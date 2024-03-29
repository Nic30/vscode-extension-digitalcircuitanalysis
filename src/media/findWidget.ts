/**
 * This code contains main API for FindWidget which is used to bind button callbacks to the form from the aplication which is using this form.
 */
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeRadio, vsCodeRadioGroup, vsCodeTextField } from "@vscode/webview-ui-toolkit";

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
	seachMethod: string; // All or BFS or DFS

	constructor(data: any) {
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
		this.seachMethod = data.seachMethod;
	}
}

export function initializeFindWidget(document: Document, onAddNode: (formDataJSON: FindWidgetFormData) => void, onAddPath: (formDataJSON: FindWidgetFormData) => void, onClearSelection: () => void) {
	provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeCheckbox(), vsCodePanels(), vsCodePanelTab(), vsCodePanelView(), vsCodeRadio(), vsCodeRadioGroup(), vsCodeTextField());

	const widget = document.getElementById("findWidget") as HTMLFormElement;
	const mainInputField = widget.querySelector("[name=searchValue]");

	function widgetControl(e: KeyboardEvent) {
		if (!widget) return;
		if (e.ctrlKey && e.key === "f") {
			if (widget.style.display === "none") {
				widget.style.display = "flex";
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
		onAddNode(new FindWidgetFormData(formDataJSON));
	};
	(window as any).digitalCircuitAnalysisOnFindWidgetOnClearSelection = () => {
		onClearSelection();
	};

	(window as any).digitalCircuitAnalysisOnFindWidgetOnAddPath = () => {
		if (!widget) return;
		const formData = new FormData(widget);
		const formDataJSON = {} as any;
		formData.forEach((value, key) => formDataJSON[key] = value);
		onAddPath(new FindWidgetFormData(formDataJSON));
	};

}