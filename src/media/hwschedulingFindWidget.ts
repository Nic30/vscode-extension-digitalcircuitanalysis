import { TimelineItemData } from 'd3-hwschedulinggraphs/dist/data';


/**
 * Add the selected nodes to the left of startingNode to the selection of the timeline.
 * @param startingNode Starting node to search from
 * @param distance Distance to search
 * @param resultSelected Set of selected nodes
 * @param idToDataDict Dictionary of id to node
 */
export function addTimelineItemsLeft(startingNode: TimelineItemData, distance: number, resultSelected: Set<TimelineItemData>, idToDataDict: { [id: number]: TimelineItemData }) {
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
 * Add the selected nodes to the right of startingNode to the selection of the timeline.
 * @see addTimelineItemsLeft
 */
export function addTimelineItemsRight(startingNode: TimelineItemData, distance: number, resultSelected: Set<TimelineItemData>, idToDataDict: { [id: number]: TimelineItemData }, successorDict: { [id: number]: number[] }) {
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