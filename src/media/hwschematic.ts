import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
import { setupRootSvgOnResize } from './setupRootSvgOnResize';
export declare const vscode: _vscode;
import { initializeFindWidget, FindWidgetFormData } from './findWidget';
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
	
	const elementsToAdd: any[] = getElementsToAdd(hwSchematic.layouter.graph, matchPredicate);
	const searchHistoryItem = findFormData.getCheckedSearchHistoryItem();
	if (searchHistoryItem !== null && searchHistoryItem !== undefined) {
		elementsToAdd.forEach(element => {
			searchHistoryItem.addItem(element);
		});
	}
	
}
function onAddPath(formData: FindWidgetFormData) {
	console.log("add", formData);
}


const currentlySelected = new Set<any>();

function applyHighlight() { 
	const nodes: any[] = getElementsToAdd(hwSchematic.layouter.graph, (item: any) => true);
	nodes.forEach((node: any) => {
		if (currentlySelected.size > 0 && !currentlySelected.has(node)) {
			node.hwMeta.cssClass = "unhighlighted";
		} else {
			node.hwMeta.cssClass = "";
		}
		
	});

	const externalNode = d3.selectAll(".d3-hwschematic .node-external-port rect");
	const node = d3.selectAll(".d3-hwschematic .node rect");
	for (const components of [externalNode, node]) {
		components.classed("unhighlighted", (d: any) => {
			return d.hwMeta.cssClass.includes("unhighlighted");
		});
	}
}



function onClearSelection() {
	currentlySelected.clear();
	applyHighlight();
}

const findWidgetFormState = new FindWidgetFormData(
	() => currentlySelected,
	applyHighlight);

initializeFindWidget(document, onAddNode, onAddPath, onClearSelection, findWidgetFormState);


/**
 * Render the document in the webview.
 */
function updateContent(text: string) {
	let json;
	try {
		if (!text) {
			text = '{}';
		}
		json = JSON.parse(text);
	} catch {
		hwSchematic.setErrorText('Error: Document is not valid json');
		return;
	}
	hwSchematic.bindData(json).then(
		function () { return; },
		(e: any) => {
			hwSchematic.setErrorText(e);
			throw e;
		});
}

// Handle messages sent from the extension to the webview
window.addEventListener('message', (event) => {
	const message = event.data; // The json data that the extension sent
	switch (message.type) {
		case 'update': {
			const text = message.text;
			const state = vscode.getState();
			if (!state || state.text != text) {
				// Update our webview's content
				updateContent(text);
			}
			// Then persist state information.
			// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
			vscode.setState({ text });
			return;
		}
	}
});

// Webviews are normally torn down when not visible and re-created when they become visible again.
// State lets us save information across these re-loads
const state = vscode.getState();
if (state) {
	updateContent(state.text);
}
