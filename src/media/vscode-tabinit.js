/**
 * Initialization code which triggers aplication if VSCode tab to load.
 */
const vscode = acquireVsCodeApi();
window.onload = function() {
	vscode.postMessage({ command: 'get-data' });
};