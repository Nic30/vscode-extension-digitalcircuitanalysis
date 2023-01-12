import * as vscode from 'vscode';
import { HwSchedulingEditorProvider } from './hwschedulingEditor';
import { HwSchematicEditorProvider } from './hwschematicEditor';
import { WaveEditorProvider } from './waveEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(HwSchedulingEditorProvider.register(context));
	context.subscriptions.push(HwSchematicEditorProvider.register(context));
	context.subscriptions.push(WaveEditorProvider.register(context));
}
