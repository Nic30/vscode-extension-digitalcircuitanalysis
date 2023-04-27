/**
 * This code contains main API for FindWidget which is used to bind button callbacks to the form from the aplication which is using this form.
 */
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeRadio, vsCodeRadioGroup, vsCodeTextField } from "@vscode/webview-ui-toolkit";
class SearchHistoryItem {
	item: string;
	constructor(item: string) {
		this.item = item;
	}

	addRow(document: Document, table: HTMLTableElement) {
		// inserts a new empty row to the table
		const newRow = table.insertRow();
		const col1 = newRow.insertCell();
		const col2 = newRow.insertCell();
		const col3 = newRow.insertCell();

		// creates checkbox
		const checkbox = document.createElement("vscode-checkbox") as HTMLInputElement;
		checkbox.className = "checked-indicator";
		checkbox.checked = true;

		// creates button
		const button = document.createElement("button");
		button.className = "codicon codicon-chrome-close";
		button.type = "button";


		// fills row values
		col1.appendChild(checkbox);
		col2.appendChild(button);
		col3.innerHTML = this.item;
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
	/* Path */
	sourceId: number; // source node id
	destId: number; // destination node id
	searchMethod: string; // All or BFS or DFS
	searchHistory: SearchHistoryItem[]; // List of searched components
	constructor() {
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
		this.searchHistory = [];
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

		if (data.searchValue !== "") {
			this.searchHistory.push(new SearchHistoryItem(data.searchValue));
		}
	}
}

export function initializeFindWidget(document: Document, 
	onAddNode: (formDataJSON: FindWidgetFormData) => void, 
	onAddPath: (formDataJSON: FindWidgetFormData) => void, 
	onClearSelection: () => void,
	findWidgetFormState: FindWidgetFormData) {

	provideVSCodeDesignSystem().register(vsCodeButton(), 
	vsCodeCheckbox(), vsCodePanels(), vsCodePanelTab(), 
	vsCodePanelView(), vsCodeRadio(), vsCodeRadioGroup(), 
	vsCodeTextField());

	const widget = document.getElementById("findWidget") as HTMLFormElement;
	const mainInputField = widget.querySelector("[name=searchValue]");

	function renderSearchHistory(document: Document, searchHistory: SearchHistoryItem[]) {
		
		const table = document.querySelector('.history-table') as HTMLTableElement;
		
		while (table.rows.length > 0) {
			table.deleteRow(0);
		}

		for(const item of searchHistory ) {
			item.addRow(document, table);
		}


		console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
	}
	function widgetControl(e: KeyboardEvent) {
		if (!widget) return;
		if (e.ctrlKey && e.key === "f") {
			if (widget.style.display === "none") {
				widget.style.display = "block"; // displays findForm
				renderSearchHistory(document, findWidgetFormState.searchHistory);
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
		renderSearchHistory(document, findWidgetFormState.searchHistory);

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

}