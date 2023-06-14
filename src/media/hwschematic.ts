import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
import { setupRootSvgOnResize } from './setupRootSvgOnResize';
export declare const vscode: _vscode;
import { initializeFindWidget, FindWidgetFormData, HighlightGroup } from './findWidget';
import { assert } from 'console';
import { resourceLimits } from 'worker_threads';

import * as vscode1 from 'vscode';

const svg = d3.select("#scheme-placeholder");

setupRootSvgOnResize(svg);
const hwSchematic = new (d3 as any).HwSchematic(svg);
const zoom = d3.zoom();
zoom.on("zoom", function applyTransform(ev) {
	hwSchematic.root.attr("transform", ev.transform);
});

// disable zoom on doubleclick
// because it interferes with component expanding/collapsing
svg.call(zoom as any)
	.on("dblclick.zoom", null);


function processPort(port: any, matchPredicate: any, result: any) {
	if (matchPredicate(port)) {
		result.push(port);
	}

	const children: any[] = port.children || port._children || [];

	for (const child of children) {
		processPort(child, matchPredicate, result);
	}

}

function processNode(node: any, matchPredicate: any, result: any) {
	if (matchPredicate(node)) {
		result.push(node);
	}

	const children: any[] = node.children || node._children || [];
	const ports: any[] = node.ports || node._ports || [];
	const edges: any[] = node.edges || node._edges || [];

	for(const child of children) {
		processNode(child, matchPredicate, result);
	}

	for(const port of ports) {
		processPort(port, matchPredicate, result);
	}

	for(const edge of edges) {
		if (matchPredicate(edge)) {
			result.push(edge);
		}
	}
}

function getElementsToAdd(graph: any, matchPredicate: any): any[] {
	const result: any[] = [];
	processNode(graph, matchPredicate, result);
	return result;
}


// On add node clicking adds a node corresponding to the form input into an existing group 
// When tying to add a node not existing in the hwschematic file nothing happens.
function onAddNode(findFormData: FindWidgetFormData) {
	console.log("add", findFormData);	
	if (findFormData.searchValue === null || findFormData.searchValue === undefined 
		|| findFormData.searchValue === '') {
        return;
	}

	let matchPredicate: (item: any) => boolean;
    if (findFormData.idOrName == "Id") {
        const _searchValues = findFormData.searchValue.split(",").map((x)=>x.trim());
        const searchValues = new Set(_searchValues.map((x) => parseInt(x)));
        matchPredicate = (item: any) => searchValues.has(parseInt(item?.id));
    } else {
        const searchValue = findFormData.searchValue;
        const casesens = findFormData.searchCaseSensitive;
        if (findFormData.searchRegex) {
            const r = new RegExp(searchValue, casesens ? 'i' : undefined);
            matchPredicate = (item: any) => r.test(item?.tooltip);
        } else {
            if (casesens) {
                matchPredicate = (item: any) => item?.tooltip === searchValue;
            } else {
                matchPredicate = (item: any) => searchValue.localeCompare(item.tooltip, undefined, { sensitivity: 'base' }) === 0;
            }
        }
    }
	
	const change: string[] = [];
	const elementsToAdd: any[] = getElementsToAdd(hwSchematic.layouter.graph, matchPredicate);
	const searchHistoryItem = findFormData.getCheckedSearchHistoryItem();
	if (searchHistoryItem !== null && searchHistoryItem !== undefined) {
		elementsToAdd.forEach(element => {
			searchHistoryItem.addItem(element);
			change.push(element.id);
		});
	}


	const highlightGroup = findWidgetFormState.getCheckedSearchHistoryItem();
	if (!highlightGroup) {
		return;
	}
	
	vscode.postMessage({
		type: 'highlight',
		edit: {
			index: findWidgetFormState.highlightGroups.indexOf(highlightGroup),
			members: change,
			isSelected: highlightGroup.CheckboxChecked,
			isCancelled: false
		}
	});
	
}
function onAddPath(formData: FindWidgetFormData) {
	console.log("add", formData);
}


const currentlySelected = new Set<any>();

function applyHighlight(sendHighlightMessage: boolean) { 
	const nodes: any[] = getElementsToAdd(hwSchematic.layouter.graph, (item: any) => true);
	const highlighted: any = [];
	const unhighlighted: any = [];
	nodes.forEach((node: any) => {
		if (currentlySelected.size > 0 && !currentlySelected.has(node)) {
			node.hwMeta.cssClass = "unhighlighted";
			unhighlighted.push(node.id);
		} else {
			node.hwMeta.cssClass = "";
			highlighted.push(node.id);
		}
		
	});

	const externalNode = d3.selectAll(".d3-hwschematic .node-external-port");
	const node = d3.selectAll(".d3-hwschematic .node");
	for (const components of [externalNode, node]) {
		components.classed("unhighlighted", (d: any) => {
			return d.hwMeta.cssClass.includes("unhighlighted");
		});
	}
	
}



function onClearSelection() {
	currentlySelected.clear();
	applyHighlight(true);
}

const findWidgetFormState = new FindWidgetFormData(
	() => currentlySelected,
	applyHighlight);

initializeFindWidget(document, onAddNode, onAddPath, onClearSelection, findWidgetFormState);

function getCurrentlySelectedIds(highlightGroups: any): Set<string> {
	const currentlySelectedIds: Set<string> = new Set();

	for (const highlightGroup of highlightGroups) {
		if (highlightGroup.isSelected) {
			for (const id of highlightGroup.members) {
				currentlySelectedIds.add(id);
			}
		}
	}

	return currentlySelectedIds;
}

function addHighlightGroups(nodes: any, highlightGroups: any) {
	findWidgetFormState.highlightGroups = [];
	//findWidgetFormState.addToHighlightGroups("GROUP");

	for (const highlightGroup of highlightGroups) {
		const newHighlightGroup = new HighlightGroup(highlightGroup.name, findWidgetFormState);
		//newHighlightGroup.CheckboxChecked = highlightGroup.isSelected;
		const membersSet = new Set(highlightGroup.members);

		for (const node of nodes) {
			if (membersSet.has(node.id)){
				newHighlightGroup.addItem(node);
			}
		}
		findWidgetFormState.highlightGroups.push(newHighlightGroup);
	}
}

function updateContent(json: any, eventType: string) {

	hwSchematic.bindData(json).then(
		function () { return; },
		(e: any) => {
			hwSchematic.setErrorText(e);
			throw e;
		});

		if ((eventType == "init" || eventType == "") && json.hwMeta.highlightGroups !== undefined && json.hwMeta.highlightGroups !== null) {
			currentlySelected.clear();
			const nodes: any[] = getElementsToAdd(hwSchematic.layouter.graph, (item: any) => true);
			const currentlySelectedIds = getCurrentlySelectedIds(json.hwMeta.highlightGroups);

			for (const node of nodes) {
				if (currentlySelectedIds.has(node.id)) {
					currentlySelected.add(node);
				}
			}
			applyHighlight(false);
			addHighlightGroups(nodes, json.hwMeta.highlightGroups);
		}

	



}

/*
 Checks two object for equality (recursively)
*/
function isDeepEqual(object1: any, object2: any) {
	const objKeys1 = Object.keys(object1);
	const objKeys2 = Object.keys(object2);

	if (objKeys1.length !== objKeys2.length) return false;

	for (const key of objKeys1) {
		const value1 = object1[key];
		const value2 = object2[key];

		const isObjects = isObject(value1) && isObject(value2);

		if ((isObjects && !isDeepEqual(value1, value2)) ||
			(!isObjects && value1 !== value2)
		) {
			return false;
		}
	}
	return true;
}

function isObject(object: any) {
	return object != null && typeof object === "object";
}

function handleUpdate(body: any) {
	const edit = body.edits;
	const change: string = body.change;
	
	if (!edit) {
		return;
	}

	const membersSet = new Set(edit.members);
		const nodes: any[] = getElementsToAdd(hwSchematic.layouter.graph, (item: any) => true);
		const highlightGroup = findWidgetFormState.highlightGroups[edit.index];

	if (change === "undo") {
		for (const node of nodes) {
			if (membersSet.has(node.id)) {
				highlightGroup.items.delete(node);
				if (edit.isSelected){
					currentlySelected.delete(node);
				}
			}
			
		}
	
	} else if (change === "redo") {
		for (const node of nodes) {
			if (membersSet.has(node.id)) {
				highlightGroup.items.add(node);
				if (edit.isSelected){
					currentlySelected.add(node);
				}
			}
			
		}
	} else {
		throw new Error("Unknown update change: " + change);
	}

	//highlightGroup.CheckboxChecked = edit.isSelected;
	applyHighlight(false);

	

}

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
	const {type, body} = event.data;
	switch (type) {
		case 'update': {
			handleUpdate( event.data.body);
			return;
		}
		case 'init': {
			const textBytes = body.json;
			const decoder = new TextDecoder();
			const text = decoder.decode(textBytes);
			let json: any = {};
			try {
				json = JSON.parse(text);
			} catch {
				if (hwSchematic)
					hwSchematic.setErrorText('Error: Document is not valid json');
			}

			const state = vscode.getState();
			if (!state || isDeepEqual(state.json, json)) {
				// Update our webview's content
				// copy json for updateContent because it modifies it
				updateContent(JSON.parse(JSON.stringify(json)), type);
				//json.hwMeta.highlightGroups = findWidgetFormState.getHighlightGroups();

			}
			// Then persist state information.
			// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
			vscode.setState({ json: json });
			return;
		}

		case 'getFileData':
		{
			// Get the image data for the canvas and post it back to the extension.
			//const json = hwSchematic === null ? {} :  hwSchematic.layouter.graph;
			const {requestId, body} = event.data;
			// const text = decoder.decode(vscode.getState().text.value);
			const json = vscode.getState().json;
			const groups : any[] = []; 
			json.hwMeta.highlightGroups = groups;
			for (const g of findWidgetFormState.getHighlightGroups()) {
				const members: string[] = [];
				for (const item of g.items) {
					members.push(item.id);
				}
				groups.push({
					name: g.name,
					members: members,
					isSelected: g.CheckboxChecked
				});
			}
			vscode.postMessage({ type: 'getFileDataResponse', requestId, body: json});
			return;
		}
	}
});

// Webviews are normally torn down when not visible and re-created when they become visible again.
// State lets us save information across these re-loads
const state = vscode.getState();
if (state) {
	updateContent(state.json, "");

}
vscode.postMessage({ type: 'ready' });