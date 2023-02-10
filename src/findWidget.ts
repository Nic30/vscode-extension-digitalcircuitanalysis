import { DocumentHighlight } from "vscode";

export function findWidgetHtml() {
	return /* html */`
	<div class="overlayWidgets" style="position:fixed; right:8px;">
		<div id="findWidget" class="editor-widget find-widget visible" style="display:none; align-items: center; float:right;  min-width:340px; background-color: #262641">
		<vscode-panels activeid="tab-1" aria-label="Panels" style="width: 100%">
				<vscode-panel-tab id="tab-1">NODE</vscode-panel-tab>
				<vscode-panel-tab id="tab-2">PATH</vscode-panel-tab>
				<vscode-panel-view id="view-1" style="flex-direction: column;">
					<section  style="display:grid; grid-template-columns: auto auto; align-items: center;">
						<vscode-text-field placeholder="Search value" style="margin-right: 4px">
							<section slot="end" style="display:flex; align-items: center;">
								<vscode-button appearance="icon" aria-label="Match Case" title="Case sensitive">
									<span class="codicon codicon-case-sensitive"></span>
								</vscode-button>
								<vscode-button appearance="icon" aria-label="Use Regular Expression" title="Regular expression">
									<span class="codicon codicon-regex"></span>
								</vscode-button>
							</section>
						</vscode-text-field>
						<vscode-text-field placeholder="Distance(1)" size="3"> 
						</vscode-text-field>
					</section>
					<section style="display:flex; align-items: center; justify-content: space-between;">
						<vscode-radio-group  orientation="vertical">
							<label slot="label"></label>
							<vscode-radio>Id</vscode-radio>
							<vscode-radio>Id List</vscode-radio>
						</vscode-radio-group>
						<vscode-radio-group orientation="vertical">
							<label slot="label"></label>
							<vscode-radio>Left</vscode-radio>
							<vscode-radio>Right</vscode-radio>
						</vscode-radio-group>
						<section style="float: right; align-items: center;">
							<vscode-button appearance="primary" title="Clear selection">
								<span class="codicon codicon-clear-all"></span>
							</vscode-button>
							<vscode-button appearance="primary" title="Remove from selection">
								<span class="codicon codicon-trash"></span>
							</vscode-button>
							<vscode-button appearance="primary">
								Add
							</vscode-button>
						</section>
					</section>
				</vscode-panel-view>
				<vscode-panel-view id="view-2" style="flex-direction: column;">
					<section style="display:grid; grid-template-columns: 50% 50%; align-items: center;">
						<vscode-text-field placeholder="Source" size="3" style="margin-right: 4px">
						</vscode-text-field>
						<vscode-text-field placeholder="Destination" size="3"">
						</vscode-text-field>
					</section>
					<section style="display:flex; align-items: center; justify-content: space-between;">
						<vscode-radio-group orientation="vertical">
							<label slot="label"></label>
							<vscode-radio>BFS</vscode-radio>
							<vscode-radio>DFS</vscode-radio>
						</vscode-radio-group>
						<vscode-radio-group orientation="vertical">
							<label slot="label"></label>
							<vscode-radio>All</vscode-radio>
							<vscode-radio>One</vscode-radio>
						</vscode-radio-group>
						<section style="float: right; align-items: center;">
							<vscode-button appearance="primary" title="Clear selection">
								<span class="codicon codicon-clear-all"></span>
							</vscode-button>
							<vscode-button appearance="primary" title="Remove from selection">
								<span class="codicon codicon-trash"></span>
							</vscode-button>
							<vscode-button appearance="primary">
								Add
							</vscode-button>
						</section>
					</section>
				</vscode-panel-view>		
			</vscode-panels>
		</div>
	</div>
	`;
}

export function findWidgetFunctionsHtml() {
	return /* html */`
		<script>
			function WidgetControl(e) {
				const widget = document.getElementById("findWidget");
				if (e.ctrlKey && e.key === "f") {
					if (widget.style.display === "none" ){
						widget.style.display = "flex";
					}else{
						widget.style.display = "none";
					}
				}else if(e.key === "Escape"){
					widget.style.display = "none";
				}
			}
			document.addEventListener('keydown', WidgetControl);			
		</script>
	`;
}