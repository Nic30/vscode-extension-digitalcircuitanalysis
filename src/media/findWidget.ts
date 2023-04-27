/**
 * This code contains main API for FindWidget which is used to bind button callbacks to the form from the aplication which is using this form.
 */
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeRadio, vsCodeRadioGroup, vsCodeTextField } from "@vscode/webview-ui-toolkit";
class SearchHistoryItem {
	name: string;
	isChecked: boolean;
	selectedNodes: Set<any>;
	constructor(name: string) {
		this.name = name;
		this.isChecked = true;
		this.selectedNodes = new Set();
	}

	renderRow(document: Document, table: HTMLTableElement, onDeleteClick: (ev: MouseEvent) => any) {
		// inserts a new empty row to the table
		const newRow = table.insertRow();

		// creates radio button
		const col0 = newRow.insertCell();
		const radio = document.createElement("input") as HTMLInputElement;
		radio.type = "radio";
		radio.name = "selectedSearchGroup";
		radio.style.width = "1.2rem";
		col0.appendChild(radio);

		// creates is selected checkbox
		const col1 = newRow.insertCell();
		const checkbox = document.createElement("vscode-checkbox") as HTMLInputElement;
		checkbox.className = "checked-indicator";
		checkbox.checked = this.isChecked;
		col1.appendChild(checkbox);


		//creates input/span for group label
		const col2 = newRow.insertCell();
		const input = document.createElement("input");
		input.type = "text";
		const span = document.createElement("span");
		// span.style.minWidth = "1rem";
		// span.style.minHeight = "1rem";
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


		// creates remove button
		const col3 = newRow.insertCell();
		const button = document.createElement("button");
		button.className = "codicon codicon-chrome-close";
		button.type = "button";
		button.onclick = onDeleteClick;
		col3.appendChild(button);
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


	}
	addToSearchHistory(name: string) {
		this.searchHistory.push(new SearchHistoryItem(name));
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

		for (const item of searchHistory) {
			const onDeleteClick = (() => (ev: MouseEvent) => {
				const index = searchHistory.indexOf(item, 0);
				if (index > -1) {
					searchHistory.splice(index, 1);
				} else {
					throw new Error("Error: Item was not found");
				}
				renderSearchHistory(document, searchHistory);
			})();
			item.renderRow(document, table, onDeleteClick);
		}


		console.log("__________breakpoint ______________");
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
		findWidgetFormState.addToSearchHistory("default");
		renderSearchHistory(document, findWidgetFormState.searchHistory);
	};

}