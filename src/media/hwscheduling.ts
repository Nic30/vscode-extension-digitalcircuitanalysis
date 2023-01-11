import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
export declare const vscode: _vscode;


const graphContainer = document.getElementById('timelineGraphContainer');
const errorContainer = document.createElement('div');

document.body.appendChild(errorContainer);
errorContainer.className = 'error';
errorContainer.style.display = 'none';

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
		if (graphContainer)
			graphContainer.style.display = 'none';
		errorContainer.innerText = 'Error: Document is not valid json';
		errorContainer.style.display = '';
		return;
	}
	errorContainer.style.display = 'none';
	if (graphContainer !== null) {
		graphContainer.style.display = '';

		const timeline = new (d3 as any).HwSchedulingTimelineGraph(graphContainer as HTMLDivElement, json);
		timeline.draw();
	}
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