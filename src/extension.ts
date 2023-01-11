import * as vscode from 'vscode';
import { HwSchedulingEditorProvider } from './hwschedulingEditor';
import { HwSchematicEditorProvider } from './hwschematicEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(HwSchedulingEditorProvider.register(context));
	context.subscriptions.push(HwSchematicEditorProvider.register(context));
}
