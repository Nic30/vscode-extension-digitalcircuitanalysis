import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
import { setupRootSvgOnResize } from './setupRootSvgOnResize';
export declare const vscode: _vscode;
import { initializeFindWidget, FindWidgetFormData } from './findWidget';
import { assert } from 'console';

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

// On add node clicking adds a node corresponding to the form input into an existing group 
// When tying to add a node not existing in the hwschematic file nothing happens.
function onAddNode(findFormData: FindWidgetFormData) {
	console.log("add", findFormData);
	const components = d3.selectAll(".d3-hwschematic rect");
	
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

	const data = components.data();
	let index = 0;
	for (const htmlItem of components) {
        if (htmlItem !== undefined && data[index] !== undefined && matchPredicate(data[index])) {
            findFormData.getCheckedSearchHistoryItem()?.addItem(htmlItem);
        }
		++index;
    }

	console.log(d3);
}
function onAddPath(formData: FindWidgetFormData) {
	console.log("add", formData);
}
function onClearSelection() {
	console.log("clear selection");
	const components = d3.selectAll(".d3-hwschematic rect");
	for(const htmlIItem of components) {
		if (htmlIItem !== null) {
			const item = htmlIItem as HTMLElement;
			item.style.opacity = "1";
		}
	}
	
}

const findWidgetFormState = new FindWidgetFormData();
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
		() => {},
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
