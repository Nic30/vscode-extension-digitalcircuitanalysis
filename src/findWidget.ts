export function findWidgetHtml(){
	return /* html */`
	<div class="overlayWidgets" style="position:fixed; right:8px; display: none">
		<div class="editor-widget find-widget visible" style="display:flex; align-items: center; float:right">
		<vscode-panels activeid="tab-1" aria-label="Panels" style="background-color: #262641;">
				<vscode-panel-tab id="tab-1">NODE</vscode-panel-tab>
				<vscode-panel-tab id="tab-2">PATH</vscode-panel-tab>
				<vscode-panel-view id="view-1" style="flex-direction: column;">
					<section style="display:flex; align-items: center;">
						<vscode-text-field placeholder="Search value" style="margin-right: 4px">
							<section slot="end" style="display:flex; align-items: center;">
								<vscode-button appearance="icon" aria-label="Match Case">
									<span class="codicon codicon-case-sensitive"></span>
								</vscode-button>
								<vscode-button appearance="icon" aria-label="Use Regular Expression">
									<span class="codicon codicon-regex"></span>
								</vscode-button>
							</section>
						</vscode-text-field>
						<vscode-text-field placeholder="Distance(1)" size="3"> 
						</vscode-text-field>
					</section>
					<section style="display:flex; align-items: center; justify-content: space-between;">
						<vscode-radio-group orientation="horizontal" style="border">
							<vscode-radio checked>id</vscode-radio>
							<vscode-radio>id list</vscode-radio>
						</vscode-radio-group>
						<section style="float: right; align-items: center;">
							<vscode-button appearance="primary">
								<span class="codicon codicon-clear-all"></span>
							</vscode-button>
							<vscode-button appearance="primary">
								<span class="codicon codicon-trash"></span>
							</vscode-button>
							<vscode-button appearance="primary">
								Add
							</vscode-button>
						</section>
						
					</section>
				</vscode-panel-view>
				<vscode-panel-view id="view-2">
					<section style="display:flex; align-items: center;">
						<vscode-text-field>
							Source field
						</vscode-text-field>
						<vscode-text-field>
							Destination field
						</vscode-text-field>
						<vscode-radio-group>
							<vscode-radio checked>BFS</vscode-radio>
							<vscode-radio>DFS</vscode-radio>
						</vscode-radio-group>
					</section>
					<section style="display:flex; align-items: center;">
						<vscode-button appearance="secondary">Reset selection</vscode-button>
						<vscode-button appearance="secondary">Remove from selection</vscode-button>
						<vscode-button appearance="primary">Add to selection</vscode-button>
					</section>
				</vscode-panel-view>		
			</vscode-panels>
			</div>
			</div>
	`;
} 
