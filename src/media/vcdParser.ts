/*
:note: Typescript version of https://github.com/Nic30/pyDigitalWaveTools/blob/master/pyDigitalWaveTools/vcd/parser.py

A basic self contained VCD parser object

Walks through the definitions constructing the appropriate signal references.
Caches XMR paths if and when the signal value changes in the dump for future reference.
Needs some hooks for callbacks on signal changes and methods to allow sampling of a signal with an appropriate clock reference

Refer to IEEE SystemVerilog standard 1800-2009 for VCD details Section 21.7 Value Change Dump (VCD) files
*/


export class VcdSyntaxError extends Error {
}


export class VcdDuplicatedVariableError extends Error {
    /*
    This is when multiple definition to one variable happens.
    E.g.
    $scope module testbench $end
    $var reg 3 ! x [2:0] $end
    $upscope $end
    $scope module testbench $end
    $var wire 8 " x [7:0] $end
    $upscope $end
    */
}

export class VCD_SIG_TYPE {
    static WIRE = "wire";
    static REAL = "real";
    // not part of vcd
    static ENUM = "enum";
    static ARRAY = "array";
}

interface iJsonable {
    toJson(): any;
}

interface iNameScope {
    name: string;
    parent:iNameScope;
}

function iNameScope_getDebugName(scope: iNameScope): string {
    const buff: string[] = [];
    let o: any = scope;
    for(;;) {
        const n = o.name;
        if (n === undefined) {
            buff.push("" + o);
            break;
        }

        buff.push(n);
        o = o.parent;
        if (o === null)
            break;
    }
    buff.reverse();
    return buff.join(".");
}

export class VcdVarInfo {
    /*
    Common part of VcdParsingVarInfo and VcdVarWritingInfo
    Container of informations about variable in VCD

    :ivar ~.vcdId: id in VCD file or the first VcdVarInfo which uses the same id (in this case this var is just reference to it)
    :ivar ~.name: name in VCD file
    :ivar ~.width: width in VCD file (int)
    :ivar ~.sigType: VCD var type name (from VCD_SIG_TYPE)
    :ivar ~.parent: parent VcdVarScope object
    */
    vcdId:string|VcdVarInfo;
    name: string;
    width: number|string;
    sigType:string;
    parent:VcdVarScope;

    constructor(vcdId: string|VcdVarInfo, name: string, width:number|string, sigType:string, parent:VcdVarScope) {
        this.vcdId = vcdId;
        this.name = name;
        this.width = width;
        this.sigType = sigType;
        this.parent = parent;
    }
    toString() {
        return `<${this.constructor.name} ${iNameScope_getDebugName(this as iNameScope)} vcdId:${this.vcdId}>`;
    }
}

export class VcdVarScope implements iJsonable {
    /*
    VCD module - container for variables

    :ivar ~.name: name of this scope
    :ivar ~.parent: parent scope of this scope or None
    :ivar ~.children: dict {name: <VcdVarScope or VcdVarInfo instance>}
    */
    name: string;
    parent:VcdVarScope|null;
    children:{[name:string]:VcdVarScope|VcdVarInfo};

    constructor(name:string, parent:VcdVarScope|null=null) {
        this.name = name;
        this.parent = parent;
        this.children = {};
    }

    toJson() {
       const children: any[] = [];
       for (const ch of Object.values(this.children)) {
             children.push((ch as iJsonable).toJson());
       }

        return {
            "name": this.name,
            "type": {"name": "struct"},
            "children": children,
        };
    }
    toString() {
        return `<${this.constructor.name} ${iNameScope_getDebugName(this as iNameScope)}>`;
    }
}

export class VcdVarParsingInfo extends VcdVarInfo implements iJsonable {
    /*
    Container of informations about variable in VCD for parsing of VCD file
    */
    data:any[];
    constructor(vcdId: string|VcdVarInfo, name: string, width: number|string, sigType:string, parent:VcdVarScope){
        super(vcdId, name, width, sigType, parent);
        this.data = [];
    }

    toJson() {
        return {"name": this.name,
                "type": {"width": this.width,
                         "name": this.sigType},
                "data": this.data};
    }
}

function dropwhile<T>(predicate: (i:T) => boolean, iter:Generator<T>) {
    let item = iter.next();
    for(;;) {
        if (item.done || !predicate(item.value)) {
            break;
        }
        item = iter.next();
    }
}

export class VcdParser {
    /*
    A parser object for VCD files.
    Reads definitions and walks through the value changes
    https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=954909&tag=1

    :ivar ~.keyword_dispatch: dictionary {keyword: parse function}
    :ivar ~.scope: actual VcdSignalInfo
    :ivar ~.now: actual time (int)
    :ivar ~.idcode2var: dictionary mapping vcd id to VcdVarParsingInfo
    :ivar ~.idcode2series: dictionary {idcode: series} where series are list of tuples (time, value),
        the list commes from VcdVarParsingInfo object
    :ivar ~.signals: dict {topName: VcdSignalInfo instance}
    :ivar ~.props: dict mapping properties like date, timescale, version from vcd declaration to its value
    */
    public readonly VECTOR_VALUE_CHANGE_PREFIX = new Set([
        "b", "B", "r", "R"
    ]);
    public readonly SCOPE_TYPES = new Set([
        "begin", "fork", "function", "module", "task"
    ]);
    //keyword_dispatch: {Function}
    scope:VcdVarScope|null;
    end_of_definitions:boolean;
    now:number;
    idcode2var: {[id:string]: VcdVarParsingInfo};
    idcode2series: {[id:string]: [number, string][]};
    keyword_dispatch: {[keyword:string]: (tokeniser: Generator<[number, string]>, keyword:string)=>void};
    props: {[name:string]: string};

    constructor() {
        this.keyword_dispatch = {
            // declaration_keyword ::=
            "$comment": this.drop_while_end,
            "$date": this.save_declaration,
            "$enddefinitions": this.vcd_enddefinitions,
            "$scope": this.vcd_scope,
            "$timescale": this.save_declaration,
            "$upscope": this.vcd_upscope,
            "$var": this.vcd_var,
            "$version": this.save_declaration,
            // simulation_keyword ::=
            "$dumpall": this.vcd_dumpall,
            "$dumpoff": this.vcd_dumpoff,
            "$dumpon": this.vcd_dumpon,
            "$dumpvars": this.vcd_dumpvars,
            "$end": this.vcd_end,
        };
        // A root scope is used to deal with situations like
        // ------
        // $scope module testbench $end
        // $var reg 3 ! x [2:0] $end
        // $upscope $end
        // $scope module testbench $end
        // $var wire 8 " y [7:0] $end
        // $upscope $end
        // $enddefinitions $end
        // ------
        this.scope = new VcdVarScope("root", null);
        this.now = 0;
        this.idcode2var = {};
        this.idcode2series = {};
        this.end_of_definitions = false;
        this.props = {};
    }
    on_error(lineNo:number, vcdId:string) {
        console.log("Wrong vcdId @ line", lineNo, ":", vcdId);
    }
    value_change(vcdId:string, value:string, lineNo:number) {
        /*push change from VCD file signal data series*/
        try {
            this.idcode2series[vcdId].push([this.now, value]);
        } catch(Error) {
            this.on_error(lineNo, vcdId);
        }
    }
    setNow(value:number|string) {
       if (Number.isFinite(value)) {
            this.now = value as number;
        } else {
           this.now = parseInt(value as string);  // TODO: can be float
       }
    }

    *createTokeniser(vcdStr:string): Generator<[number, string]> {
        let lineNo = 0;
        for (const line of vcdStr.split(/\r\n|\n\r|\n|\r/)) {
            for (const word of line.split(" ")) {
                if (!word)
                    continue;
                yield [lineNo, word];
            }
            lineNo++;
        }
    }
    parse_str(vcdStr:string) {
        /*
        Tokenize and parse the VCD file

        :ivar ~.file_handle: opened file with vcd string
        */
        // open the VCD file and create a token generator
        const tokeniser = this.createTokeniser(vcdStr);

        for (;;) {
            const token = tokeniser.next();
            if (token.done) {
				throw new VcdSyntaxError("Can not find end of VCD declaration segment");
			}
            // parse VCD until the end of definitions
            let fn = this.keyword_dispatch[token.value[1]];
            if (!fn)
               fn = this.parse_error;
            fn = fn.bind(this);
            fn(tokeniser, token.value[1]);
            if (this.end_of_definitions)
                break;
        }

        for (;;) {
            const item = tokeniser.next();
            if (item.done)
                  break;
            const [lineNo, token] = item.value;

            // parse changes
            const c = token[0];
            if (c === '$') {
                let fn = this.keyword_dispatch[token.trim()];
                if (!fn)
                   fn = this.parse_error;
                fn = fn.bind(this);
                fn(tokeniser, token);
            } else if (c === '#') {
                this.setNow(token.slice(1));
            } else {
                this.vcd_value_change(lineNo, token, tokeniser);
            }
        }
    }
    vcd_value_change(lineNo: number, token:string, tokenizer: Generator<[number, string]>) {
        token = token.trim();
        if (!token)
            return;

        let _;
        let value:string;
        let vcdId:string;
        if (this.VECTOR_VALUE_CHANGE_PREFIX.has(token[0])) {
            // vectors and strings
            value = token;
            const item = tokenizer.next();
            [_, vcdId] = item.value;
        } else if (token[0] === "s") {
            // string value
            value = token.slice(1);
            const item = tokenizer.next();
            [_, vcdId] = item.value;
        } else if (token[0] === '#') { // In many VCD files there is no $end terminator
            this.setNow(token.slice(1));
            return;
        } else {
            // 1 bit value
            value = token[0];
            vcdId = token.slice(1);
        }
        this.value_change(vcdId, value, lineNo);
    }
    parse_error(tokeniser: Generator<[number, string]>, keyword:string) {
        throw new VcdSyntaxError("Don't understand keyword: " + keyword);
    }
    drop_while_end(tokeniser: Generator<[number, string]>, keyword:string) {
        dropwhile((x:[number, string]) => x[1] !== "$end", tokeniser);
    }
    *read_while_end(tokeniser: Generator<[number, string]>) {
        for (;;) {
			const token = tokeniser.next();
			if (token.done)
			    return;

			const [_, word] = token.value;
            if (word === "$end")
                return;
            else
                yield word;
		}

    }
    ltrim$(x:string) {
      // This implementation removes whitespace from the left side
      // of the input string.
      return x.replace(/^\s+/gm, '');
    }

    save_declaration(tokeniser: Generator<[number, string]>, keyword:string) {
        const declr = Array.from(this.read_while_end(tokeniser));
        keyword = this.ltrim$(keyword);
        this.props[keyword] = declr.join(" ");
    }

    vcd_enddefinitions(tokeniser: Generator<[number, string]>, keyword:string) {
        this.end_of_definitions = true;
        this.drop_while_end(tokeniser, keyword);
    }

    pop_end(tokeniser: Generator<[number, string]>) {
        if (tokeniser.next().value[1] !== "$end") {
           throw new VcdSyntaxError("Missing $end");
        }
    }

    vcd_scope(tokeniser: Generator<[number, string]>, keyword:string) {
        const scopeType = tokeniser.next();
        if (scopeType.done)
           throw new VcdSyntaxError("Name of vcd scope type expected");
        const scopeTypeName = scopeType.value[1];
        if (!this.SCOPE_TYPES.has(scopeTypeName))
           throw new VcdSyntaxError("Wrong scope type " + scopeType);
        const scopeName = tokeniser.next();
        if (scopeName.done)
           throw new VcdSyntaxError("Name of vcd scope expected");
        this.pop_end(tokeniser);
        const s = this.scope;
        const name = scopeName.value[1];
        this.scope = new VcdVarScope(name, s);
        if (s instanceof VcdVarScope) {
            if (name in s.children) {
                this.scope = s.children[name] as VcdVarScope;
                if (!(this.scope instanceof VcdVarScope)) {
                   throw new VcdSyntaxError("Type error " + this.scope);
                }
            } else {
                s.children[name] = this.scope;
            }
        }
    }

    vcd_upscope(tokeniser: Generator<[number, string]>, keyword:string) {
       if (!this.scope)
           throw new VcdSyntaxError("vcd_upscope called without parent");
        this.scope = this.scope.parent;
        this.pop_end(tokeniser);
    }

    vcd_var(tokeniser: Generator<[number, string]>, keyword:string) {
        const data = Array.from(this.read_while_end(tokeniser));
        // ignore range on identifier ( TODO  Fix this )
        const [var_type, _size, vcdId, reference] = data.slice(0, 4);
        const parent = this.scope;
        if (!parent)
            throw new VcdSyntaxError("Constructing variable without any scope");
        const size = parseInt(_size);
        let parent_var: VcdVarParsingInfo|null = this.idcode2var[vcdId];
        if (parent_var === undefined)
           parent_var = null;
        const info = new VcdVarParsingInfo(parent_var === null ? vcdId : parent_var,
                                 reference, size, var_type, parent);
        if (reference in parent.children) {
           throw new VcdSyntaxError("Duplicated id " + reference);
        }
        parent.children[reference] = info;
        if (parent_var === null) {
            this.idcode2var[vcdId] = info;
            this.idcode2series[vcdId] = info.data;
        }
    }

    _vcd_value_change_list(tokeniser: Generator<[number, string]>) {
        for (;;) {
           const item = tokeniser.next();
           if (item.done) {
               break;
           }
           const [lineNo, token] = item.value;
           if (token && token[0] === "$") {
               if (token.startsWith("$end")) {
                   return;
               } else {
                   throw new VcdSyntaxError(
                       `Line ${lineNo}: Expected $end: ${token}`);
               }
           } else {
               this.vcd_value_change(lineNo, token, tokeniser);
           }
        }
    }
    vcd_dumpall(tokeniser: Generator<[number, string]>, keyword:string) {
        /*
        specifies current values of all variables dumped

        vcd_simulation_dumpall ::= $dumpall { value_changes } $end

        .. code-block:: verilog

            $dumpall   1*@  x*#   0*$   bx   (k $end
        */
        this._vcd_value_change_list(tokeniser);
    }
    vcd_dumpoff(tokeniser: Generator<[number, string]>, keyword:string) {
        /*
        all variables dumped with X values

        vcd_simulation_dumpoff ::= $dumpoff { value_changes } $end

        .. code-block:: verilog

            $dumpoff  x*@  x*#   x*$   bx   (k $end
        */
        this._vcd_value_change_list(tokeniser);
    }
    vcd_dumpon(tokeniser: Generator<[number, string]>, keyword:string) {
        /*
        resumption of dumping and lists current values of all variables dumped.

        vcd_simulation_dumpon ::= $dumpon { value_changes } $end

        .. code-block:: verilog

            $dumpon   x*@  0*#   x*$   b1   (k $end
        */
        this._vcd_value_change_list(tokeniser);
    }
    vcd_dumpvars(tokeniser: Generator<[number, string]>, keyword:string) {
        /*
        lists initial values of all variables dumped

        vcd_simulation_dumpvars ::= $dumpvars { value_changes } $end

        .. code-block:: verilog

            $dumpvars   x*@   z*$   b0   (k $end
        */
        this._vcd_value_change_list(tokeniser);
    }
    vcd_end(tokeniser: Generator<[number, string]>, keyword:string) {
        if (!this.end_of_definitions)
            throw new VcdSyntaxError("missing end of declaration section");
    }
}
