import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
export declare const vscode: _vscode;
import { initializeFindWidget, FindWidgetFormData } from './findWidget';
import { select } from 'd3';
import { TimelineItemData } from 'd3-hwschedulinggraphs/dist/data';
import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
import { deflateRaw } from 'zlib';



const graphContainer = document.getElementById('timelineGraphContainer');
const errorContainer = document.createElement('div');
let timeline = (null as any);
document.body.appendChild(errorContainer);
errorContainer.className = 'error';
errorContainer.style.display = 'none';

/**
 *
 * Add the selected nodes to the left of startingNode to the selection of the timeline.
 * @param startingNode
 * @param distance
 * @param resultSelected
 * @param idToDataDict
 */
function addTimelineItemsLeft(startingNode: TimelineItemData, distance: number, resultSelected: Set<TimelineItemData>, idToDataDict: { [id: number]: TimelineItemData }) {
	resultSelected.add(startingNode);
	if (distance > 0) {
		for (const port of startingNode.portsIn) {
			const predecessorID = port[2];
			const predecessor = idToDataDict[predecessorID];
			if (!predecessor) {
				throw new Error("Predecessor not found" + predecessorID);
			}
			addTimelineItemsLeft(predecessor, distance - 1, resultSelected, idToDataDict);
		}
	}
}

/**
 *
 * Add the selected nodes to the right of startingNode to the selection of the timeline.
 * @param startingNode Starting node to search from
 * @param distance Distance to search
 * @param resultSelected Set of selected nodes
 * @param idToDataDict Dictionary of id to node
 */
function addTimelineItemsRight(startingNode: TimelineItemData, distance: number, resultSelected: Set<TimelineItemData>, idToDataDict: { [id: number]: TimelineItemData }, successorDict: { [id: number]: number[] }) {
	resultSelected.add(startingNode);
	if (distance > 0) {
		for (const successorID of successorDict[startingNode.id]) {
			const successor = idToDataDict[successorID];
			if (!successor) {
				throw new Error("Successor not found" + successorID);
			}
			addTimelineItemsRight(successor, distance - 1, resultSelected, idToDataDict, successorDict);
		}
	}
}

/**
 *
 * Add the selected items to the selection of the timeline.
 * @param formDataJSON
 * @return
 */
function onAddNode(formDataJSON: FindWidgetFormData) {
	const bars = d3.selectAll(".hwscheduling-timeline-graph rect");
	if (formDataJSON.searchValue == "" || timeline == null) { return; }
	const searchValues = formDataJSON.searchValue.split(",");
	const successorDict = timeline.idToSuccessorIds;
	if(formDataJSON.idOrName == "Id"){
		for (const searchValue of searchValues) {
			const searchValueInt = parseInt(searchValue);
			for (const item of bars.data()) {
				if ((item as TimelineItemData).id == searchValueInt) {
					if (formDataJSON.directionRight) {
						addTimelineItemsRight(item as TimelineItemData, formDataJSON.distance, timeline.currentlySelected, timeline.idToDataDict, successorDict);
					}
					if (formDataJSON.directionLeft) {
						addTimelineItemsLeft(item as TimelineItemData, formDataJSON.distance, timeline.currentlySelected, timeline.idToDataDict);
					}
				}
			}
		}
	}else{
		for (const searchValue of searchValues) {
			for (const item of bars.data()) {
				if ((item as TimelineItemData).label === searchValue) {
					if (formDataJSON.directionRight) {
						addTimelineItemsRight(item as TimelineItemData, formDataJSON.distance, timeline.currentlySelected, timeline.idToDataDict, successorDict);
					}
					if (formDataJSON.directionLeft) {
						addTimelineItemsLeft(item as TimelineItemData, formDataJSON.distance, timeline.currentlySelected, timeline.idToDataDict);
					}
				}
			}
		}
	}

	// Highlight the selected items
	timeline.applyHighlight();
}

/**
 * Clear the selection of the timeline.
 */
function onClearSelection() {
	timeline.currentlySelected.clear();
	timeline.applyHighlight();
}


function onAddPath(formDataJSON: FindWidgetFormData) {
	const bars = d3.selectAll(".hwscheduling-timeline-graph rect");
	throw new Error("Not implemented");
}



initializeFindWidget(document, onAddNode, onAddPath, onClearSelection);

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

		if (timeline) {
			// remove old svg
			d3.select(graphContainer).selectAll("*").remove();
		}
		timeline = new (d3 as any).HwSchedulingTimelineGraph(graphContainer as HTMLDivElement, json);
		timeline.draw();
	}
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