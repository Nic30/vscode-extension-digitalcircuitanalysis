export function setupRootSvgOnResize(svg: d3.Selection<d3.BaseType, unknown, HTMLElement, any>) {
    // schematic rendering script
    function viewport() {
        let e: any = window,
            a = 'inner';
        if (!('innerWidth' in window)) {
            a = 'client';
            e = document.documentElement || document.body;
        }
        return {
            width: e[a + 'Width'],
            height: e[a + 'Height']
        };
    }
    svg.attr("width", viewport().width)
       .attr("height", viewport().height);
    
    const orig: any = document.body.onresize;
    document.body.onresize = function (ev) {
        if (orig)
            orig(ev);
    
        const w = viewport();
        svg.attr("width", w.width);
        svg.attr("height", w.height);
    };

}