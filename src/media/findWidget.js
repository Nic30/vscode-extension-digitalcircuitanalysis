/**
 * Javascript for find widget which is directly inserted into page where widget is to handle low level widget UI functionality.
 */

function digitalCircuitAnalysisOnIconCheckboxButtonClick(button) {
	const checkbox = button.getElementsByTagName("vscode-checkbox")[0];
	let checked = button.classList.contains('icon-checked');
	if (checked !== checkbox.checked) {
		throw new Error("State of checkbox button color and value desynchronized" + button);
	}
	checked = !checked;
	checkbox.checked = checked;
	if (checked) {
		button.classList.add('icon-checked');
	} else {
		button.classList.remove('icon-checked');
	}
}