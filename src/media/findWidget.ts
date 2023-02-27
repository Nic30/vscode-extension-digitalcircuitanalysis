import { provideVSCodeDesignSystem, vsCodeButton, vsCodeCheckbox, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeRadio, vsCodeRadioGroup, vsCodeTextField } from "@vscode/webview-ui-toolkit";

export class FindWidgetFormData{
	searchValue: string;
	idOrName: string;
	distance: number;
	directionRight: boolean;
	directionLeft: boolean;
	constructor(data: any) {
		this.searchValue = data.searchValue;
		this.idOrName = data.idOrName;
		this.distance = parseInt(data.distance);
		if(Number.isNaN(this.distance)){
			this.distance = 0;
		}
		this.directionRight = data.directionRight === "on";
		this.directionLeft = data.directionLeft === "on";
	}
}

export function initializeFindWidget(document: Document, onAdd: (formDataJSON: FindWidgetFormData) => void, onClearSelection: () => void) {
	provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeCheckbox(), vsCodePanels(), vsCodePanelTab(), vsCodePanelView(), vsCodeRadio(), vsCodeRadioGroup(), vsCodeTextField());

	const widget = document.getElementById("findWidget");

	function WidgetControl(e: KeyboardEvent) {
		if (!widget) return;
		if (e.ctrlKey && e.key === "f") {
			if (widget.style.display === "none") {
				widget.style.display = "flex";
			} else {
				widget.style.display = "none";
			}
		} else if (e.key === "Escape") {
			widget.style.display = "none";
		}
	}
	document.addEventListener('keydown', WidgetControl);

	(window as any).digitalCircuitAnalysisOnFindWidgetOnAdd = () => {
		if (!widget) return;
		const formData = new FormData(widget as HTMLFormElement);
		const formDataJSON = {} as any;
		formData.forEach((value, key) => formDataJSON[key] = value);
		onAdd(formDataJSON as FindWidgetFormData);
	};
	(window as any).digitalCircuitAnalysisOnFindWidgetOnClearSelection = () => {
		onClearSelection();
	};
}