/**
 * This code contains main API for FindWidget which is used to bind button callbacks to the form from the aplication which is using this form.
 */
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeRadio, vsCodeRadioGroup, vsCodeTextField } from "@vscode/webview-ui-toolkit";
//import { TimelineItemData } from 'd3-hwschedulinggraphs/dist/data';
import { TimelineItemData } from '../../node_modules/d3-hwschedulinggraphs/dist/data';

import { addTimelineItemsLeft, addTimelineItemsRight } from "./hwschedulingFindWidget";
import d3, { tickFormat } from "d3";

// Represents a group with elements to be highlighted on clicking the checkbox.
class HighlightGroup {
	name: string;
	findWidgetFormState: FindWidgetFormData;
	items: Set<TimelineItemData | any>;
	RadioChecked: boolean;
	CheckboxChecked: boolean;


	constructor(name: string, findWidgetFormState: FindWidgetFormData) {
		this.name = name;
		this.findWidgetFormState = findWidgetFormState;
		this.items = new Set();
		this.RadioChecked = false;
		this.CheckboxChecked = true;
	}

	// Checks the radio button after clicking.
	checkItem(): void {
		for (const item of this.findWidgetFormState.highlightGroups) {
			item.RadioChecked = false;
		}
		this.RadioChecked = true;
	}

	// Highlights intem of this class in hwsheduling document
	applyHighlight(): void {
		for (const item of this.items) {
			this.findWidgetFormState.getCurrentlySelected().add(item);
		}
		this.findWidgetFormState.applyHighlight();
	}

	hideHighlight(): void {
		for (const node of this.items) {
			this.findWidgetFormState.getCurrentlySelected().delete(node);
		}
		this.findWidgetFormState.applyHighlight();

	}

	// Renders a radio buttun. On selection for input is added to the existing group.
	renderRadio(newRow: HTMLTableRowElement): void {
		const col = newRow.insertCell();
		const radio = document.createElement("input") as HTMLInputElement;
		radio.type = "radio";
		radio.name = "selectedSearchGroup";
		radio.style.width = "1.2rem";
		radio.onchange = this.checkItem.bind(this);
		radio.checked = this.RadioChecked;
		col.appendChild(radio);
	}

	// Renders checkbox which highlights items belonging to the group
	renderCheckbox(newRow: HTMLTableRowElement): void {
		const col = newRow.insertCell();
		const checkbox = document.createElement("vscode-checkbox") as HTMLInputElement;
		checkbox.className = "checked-indicator";

		checkbox.checked = this.CheckboxChecked;
		checkbox.onchange = () => {
			this.CheckboxChecked = checkbox.checked;
			if (this.CheckboxChecked) {
				this.applyHighlight();
			} else {
				this.hideHighlight();

			}

		};

		checkbox.checked = this.CheckboxChecked;
		col.appendChild(checkbox);
	}

	// Renders input button for changing the name of the class
	renderInput(newRow: HTMLTableRowElement): void {
		//creates input/span for group label
		const col2 = newRow.insertCell();
		const input = document.createElement("input");
		input.type = "text";
		const span = document.createElement("span");
		input.style.display = "none";
		input.value = this.name;
		input.onchange = (ev: Event) => {
			this.name = span.textContent = input.value;
			span.style.display = "block";
			input.style.display = "none";
		};
		span.ondblclick = (ev: MouseEvent) => {
			input.style.display = "block";
			span.style.display = "none";
		};
		//span.style.display = "hidden";
		span.textContent = this.name;
		col2.appendChild(input);
		col2.appendChild(span);
	}

	// Renders deleting button which deletes an added group
	renderDeletingButton(newRow: HTMLTableRowElement, onDeleteClick: (ev: MouseEvent) => any): void {
		const col3 = newRow.insertCell();
		const button = document.createElement("button");
		button.className = "codicon codicon-chrome-close";
		button.type = "button";
		button.onclick = onDeleteClick;
		col3.appendChild(button);
	}

	// Renders a default table row after clicking on add button
	renderRow(document: Document, table: HTMLTableElement, onDeleteClick: (ev: MouseEvent) => any, onClearSelection: any): void {
		const newRow = table.insertRow();

		this.renderRadio(newRow);
		this.renderCheckbox(newRow);
		this.renderInput(newRow);
		this.renderDeletingButton(newRow, onDeleteClick);
	}

	// Adds an item to the object items.
	addItem(item: any): void {
		this.items.add(item);
	}
}

export class FindWidgetFormData {
	/* Node */
	searchValue: string; // comma separated list
	searchRegex: boolean;
	searchCaseSensitive: boolean;
	idOrName: string; // search by id or name
	distance: number; // distance to search to
	directionRight: boolean; // true if right direction is selected
	directionLeft: boolean; // true if left direction is selected
	getCurrentlySelected: () => Set<any>;
	applyHighlight: () => void;
	/* Path */
	sourceId: number; // source node id
	destId: number; // destination node id
	searchMethod: string; // All or BFS or DFS
	highlightGroups: HighlightGroup[]; // List of groups, which items are highlighted
	
	constructor(getCurrentlySelected: () => Set<any>, applyHighlight: () => void) {
		/* Node */
		this.searchValue = "";
		this.searchRegex = false;
		this.searchCaseSensitive = true;
		this.idOrName = "id";
		this.distance = 0;
		this.directionRight = true;
		this.directionLeft = true;

		/* Path */
		this.sourceId = 0;
		this.destId = 0;
		this.searchMethod = "bfs";

		const defaultGroup = new HighlightGroup("default", this);
		defaultGroup.RadioChecked = true;
		this.highlightGroups = [defaultGroup];

		this.getCurrentlySelected = getCurrentlySelected;
		this.applyHighlight = applyHighlight;

	}
	update(data: any) {
		/* Node */
		this.searchValue = data.searchValue;
		this.searchRegex = data.searchRegex === "on";
		this.searchCaseSensitive = data.searchCaseSensitive === "on";
		this.idOrName = data.idOrName;
		this.distance = parseInt(data.distance);
		if (Number.isNaN(this.distance)) {
			this.distance = 0;
		}
		this.directionRight = data.directionRight === "on";
		this.directionLeft = data.directionLeft === "on";

		/* Path */
		this.sourceId = parseInt(data.sourceId);
		this.destId = parseInt(data.destId);
		this.searchMethod = data.searchMethod;

	}
	addToHighlightGroups(name: string): void {
		this.highlightGroups.push(new HighlightGroup(name, this));
	}

	getCheckedSearchHistoryItem(): HighlightGroup | null {
		for (const item of this.highlightGroups) {
			if (item.RadioChecked) {
				return item;
			}
		}
		return null;
	}
}

export function initializeFindWidget(document: Document,
	onAddNode: (formDataJSON: FindWidgetFormData) => void,
	onAddPath: (formDataJSON: FindWidgetFormData) => void,
	onClearSelection: () => void,
	findWidgetFormState: FindWidgetFormData,
) {

	provideVSCodeDesignSystem().register(vsCodeButton(),
		vsCodeCheckbox(), vsCodePanels(), vsCodePanelTab(),
		vsCodePanelView(), vsCodeRadio(), vsCodeRadioGroup(),
		vsCodeTextField());

	const widget = document.getElementById("findWidget") as HTMLFormElement;
	const mainInputField = widget.querySelector("[name=searchValue]");

	// Renders highlight groups storing items to be highlighted 
	// when selecting the corresponding checkbox
	function renderHighlightGroups(document: Document, highlightGroups: HighlightGroup[]) {

		const table = document.querySelector('.history-table') as HTMLTableElement;

		// deletes table rows
		while (table.rows.length > 0) {
			table.deleteRow(0);
		}

		for (const item of highlightGroups) {
			const onDeleteClick = (() => (ev: MouseEvent) => {
				const index = highlightGroups.indexOf(item, 0);
				if (index > -1) {
					highlightGroups.splice(index, 1);
				} else {
					throw new Error("Error: Item was not found");
				}
				renderHighlightGroups(document, highlightGroups);
			})();
			item.renderRow(document, table, onDeleteClick, onClearSelection);
		}

	}
	function widgetControl(e: KeyboardEvent) {
		if (!widget) return;
		if (e.ctrlKey && e.key === "f") {
			if (widget.style.display === "none") {
				widget.style.display = "block"; // displays findForm
				renderHighlightGroups(document, findWidgetFormState.highlightGroups);
				(mainInputField as HTMLElement)?.focus();
			} else {
				widget.style.display = "none";
			}
		} else if (e.key === "Escape") {
			widget.style.display = "none";
		} else if (e.key == "Enter") {
			(window as any).digitalCircuitAnalysisOnFindWidgetOnAddNode();

		}
	}
	document.addEventListener('keydown', widgetControl);

	(window as any).digitalCircuitAnalysisOnFindWidgetOnAddNode = () => {
		if (!widget) return;
		const formData = new FormData(widget);
		// copy properties from form data to json object
		const formDataJSON = {} as any;
		formData.forEach((value, key) => formDataJSON[key] = value);

		findWidgetFormState.update(formDataJSON);
		onAddNode(findWidgetFormState);
		const curSelectedGroup = findWidgetFormState.getCheckedSearchHistoryItem();
		if (curSelectedGroup?.CheckboxChecked) {
			curSelectedGroup?.applyHighlight();
		}
	};
	(window as any).digitalCircuitAnalysisOnFindWidgetOnClearSelection = () => {
		onClearSelection();
	};

	(window as any).digitalCircuitAnalysisOnFindWidgetOnAddPath = () => {
		if (!widget) return;
		const formData = new FormData(widget);
		const formDataJSON = {} as any;
		formData.forEach((value, key) => formDataJSON[key] = value);

		findWidgetFormState.update(formDataJSON);
		onAddPath(findWidgetFormState);
	};
	(window as any).digitalCircuitAnalysisOnFindWidgetOnAddGroup = () => {
		findWidgetFormState.addToHighlightGroups("default");
		renderHighlightGroups(document, findWidgetFormState.highlightGroups);
	};

}