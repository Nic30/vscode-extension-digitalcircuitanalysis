import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
import { setupRootSvgOnResize } from './setupRootSvgOnResize';
export declare const vscode: _vscode;
import { initializeFindWidget, FindWidgetFormData } from './findWidget';

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

function onAdd(formData: FindWidgetFormData) {
	console.log("add", formData);
}
function onClearSelection() {
	console.log("clear selection");
}
initializeFindWidget(document, onAdd, onClearSelection);


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
			// Update our webview's content
			updateContent(text);
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
