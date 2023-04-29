import * as d3 from 'd3';
//import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';
//const HwSchedulingTimelineGraph = d3.HwSchedulingTimelineGraph;
import { _vscode } from './vscodePlaceholder';
export declare const vscode: _vscode;
import { initializeFindWidget, FindWidgetFormData } from './findWidget';
import { addTimelineItemsLeft, addTimelineItemsRight } from './hwschedulingFindWidget';
import { TimelineItemData } from 'd3-hwschedulinggraphs/dist/data';
import { HwSchedulingTimelineGraph } from 'd3-hwschedulinggraphs';

const graphContainer = document.getElementById('timelineGraphContainer');
const errorContainer = document.createElement('div');
let timeline = (null as any);
document.body.appendChild(errorContainer);
errorContainer.className = 'error';
errorContainer.style.display = 'none';


/**
 * Add the selected items to the selection of the timeline.
 */
function findWidgetOnAddNode(findFormData: FindWidgetFormData) {
    findFormData.timeline = timeline;
    const bars = d3.selectAll(".hwscheduling-timeline-graph rect");
    if (findFormData.searchValue === "" || timeline === null)
        return;
    const successorDict = timeline.idToSuccessorIds;

    let matchPredicate: (item: TimelineItemData) => boolean;
    if (findFormData.idOrName == "Id") {
        const _searchValues = findFormData.searchValue.split(",").map((x)=>x.trim());
        const searchValues = new Set(_searchValues.map((x) => parseInt(x)));
        matchPredicate = (item: TimelineItemData) => searchValues.has(item.id);
    } else {
        const searchValue = findFormData.searchValue;
        const casesens = findFormData.searchCaseSensitive;
        if (findFormData.searchRegex) {
            const r = new RegExp(searchValue, casesens ? 'i' : undefined);
            matchPredicate = (item: TimelineItemData) => r.test(item.tooltip);
        } else {
            if (casesens) {
                matchPredicate = (item: TimelineItemData) => item.tooltip === searchValue;
            } else {
                matchPredicate = (item: TimelineItemData) => searchValue.localeCompare(item.tooltip, undefined, { sensitivity: 'base' }) === 0;
            }
        }
    }
    const d = findFormData.distance;
    const currentlySelected = timeline.currentlySelected;
    const idToData = timeline.idToDataDict;
    for (const _item of bars.data()) {
        const item = _item as TimelineItemData;
        if (matchPredicate(item)) {
            const items = findFormData.getCheckedSearchHistoryItem()?.items as Set<TimelineItemData>;
            if (findFormData.directionRight)
                addTimelineItemsRight(item, d, items, idToData, successorDict);
            if (findFormData.directionLeft)
                addTimelineItemsLeft(item, d, items, idToData);
            
            findFormData.getCheckedSearchHistoryItem()?.addItem(item);
        }
    }
    // Highlight the selected items
    //timeline.applyHighlight();
}

/**
 * Clear the selection of the timeline.
 */
function findWidgetOnClearSelection() {
    timeline.currentlySelected.clear();
    timeline.applyHighlight();
}


function findWidgetOnAddPath(findFormData: FindWidgetFormData) {
    const bars = d3.selectAll(".hwscheduling-timeline-graph rect");
    throw new Error("Not implemented");
}

const findWidgetFormState = new FindWidgetFormData();

initializeFindWidget(document, findWidgetOnAddNode, findWidgetOnAddPath, 
                     findWidgetOnClearSelection, findWidgetFormState);

/**
 * Render the document in the webview.
 */
function updateContent(text: string) {
    let json;
    try {
        if (!text) {
            json = {};
        } else {
            json = JSON.parse(text);
        }
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

/**
 * Handle messages sent from the extension to the webview
 */
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