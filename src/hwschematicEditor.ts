import * as vscode from 'vscode';
import { findWidgetHtml } from './findWidgetElement';
import { getNonce } from './util';
import { HwSchematicDocument, HwSchematicHighlightEdit, WebviewCollection } from './hwschematicEditorDocument';
import { disposeAll } from './dispose';

export class HwSchematicEditorProvider implements vscode.CustomEditorProvider<HwSchematicDocument> {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		const provider = new HwSchematicEditorProvider(context);
		const providerRegistration = vscode.window.registerCustomEditorProvider(HwSchematicEditorProvider.viewType, provider);
		return providerRegistration;
	}

	private static readonly viewType = 'digitalcircuitanalysis.hwschematic';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to script and css for the webview
		const _this = this;
		function getAsset(filename: string) {
			return webview.asWebviewUri(vscode.Uri.joinPath(
				_this.context.extensionUri, 'media', filename
			));
		}

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Gantt graph</title>
			<!--
			Use a content security policy to only allow loading images from https or from our extension directory,
			and only allow scripts that have a specific nonce.
			:attention: This makes rendering extremly slow
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
			-->
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
		    <link href="${getAsset('reset.css')}" rel="stylesheet" />
		    <link href="${getAsset('vscode.css')}" rel="stylesheet" />
		    <link href="${getAsset('d3-hwschematic-dark.css')}" rel="stylesheet" />
			<link href="${getAsset('codicon.css')}" rel="stylesheet" />
            <link href="${getAsset('findWidget.css')}" rel="stylesheet" />
			<script type="text/javascript" src="${getAsset('vscode-tabinit.js')}" nonce="${nonce}"></script>
		    <script type="text/javascript" src="${getAsset('elk.bundled.js')}" nonce="${nonce}"></script>
		    <script type="text/javascript" src="${getAsset('d3.min.js')}" nonce="${nonce}"></script>
		    <script type="text/javascript" src="${getAsset('d3-hwschematic.js')}" nonce="${nonce}"></script>
			<script type="text/javascript" src="${getAsset('findWidget.js')}" nonce="${nonce}"></script>
		</head>
		<body  style="overflow: hidden;">
			${findWidgetHtml()}
		    <div style="display: block; width: 100%; height: 100%;">
				<svg id="scheme-placeholder"></svg>
			</div>
            <script type="text/javascript" src="${getAsset('hwschematic.js')}" nonce="${nonce}"></script>
		</body>
		</html>`;
	}


	////
	private _requestId = 1;
	private readonly _callbacks = new Map<number, (response: any) => void>();

	private readonly webviews = new WebviewCollection();

	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<HwSchematicDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	public saveCustomDocument(document: HwSchematicDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.save(cancellation);
	}

	public saveCustomDocumentAs(document: HwSchematicDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.saveAs(destination, cancellation);
	}

	public revertCustomDocument(document: HwSchematicDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.revert(cancellation);
	}

	public backupCustomDocument(document: HwSchematicDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
		return document.backup(context.destination, cancellation);
	}


	private onMessage(document: HwSchematicDocument, message: any) {
		switch (message.type) {
			case 'highlight':
				document.makeEdit(message.edit as HwSchematicHighlightEdit);
				return;

			case 'getFileDataResponse': {
				const callback = this._callbacks.get(message.requestId);
				callback?.(message.body);
				return;
			}
		}
	}
	
	private postMessage(panel: vscode.WebviewPanel, type: string, body: any): void {
		panel.webview.postMessage({ type, body });
	}

	private postMessageWithResponse<R = unknown>(panel: vscode.WebviewPanel, type: string, body: any): Promise<R> {
		const requestId = this._requestId++;
		const p = new Promise<R>(resolve => this._callbacks.set(requestId, resolve));
		panel.webview.postMessage({ type, requestId, body });
		return p;
	}

	async openCustomDocument(
		uri: vscode.Uri,
		openContext: { backupId?: string },
		_token: vscode.CancellationToken
	): Promise<HwSchematicDocument> {
		const document: HwSchematicDocument = await HwSchematicDocument.create(uri, openContext.backupId, {
			getFileData: async () => {
				const webviewsForDocument = Array.from(this.webviews.get(document.uri));
				if (!webviewsForDocument.length) {
					throw new Error('Could not find webview to save for');
				}
				const panel: any = webviewsForDocument[0];
				const response = await this.postMessageWithResponse<number[]>(panel, 'getFileData', {});
				const enc = new TextEncoder();
				return enc.encode(JSON.stringify(response));
			}
		});

		const listeners: vscode.Disposable[] = [];

		listeners.push(document.onDidChange(e => {
			// Tell VS Code that the document has been edited by the use.
			this._onDidChangeCustomDocument.fire({
				document,
				...e,
			});
		}));
		
		listeners.push(document.onDidChangeContent(e => {
			// Update all webviews when the document changes
			for (const webviewPanel of this.webviews.get(document.uri)) {
				this.postMessage(webviewPanel, 'update', {
					edits: e.edits,
					change: e.change,
				});
			}
		}));

		document.onDidDispose(() => disposeAll(listeners));

		return document;
	}

	async resolveCustomEditor(
		document: HwSchematicDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		// Add the webview to our internal set of active webviews
		this.webviews.add(document.uri, webviewPanel);

		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		webviewPanel.webview.onDidReceiveMessage(e => this.onMessage(document, e));

		// Wait for the webview to be properly ready before we init
		webviewPanel.webview.onDidReceiveMessage(e => {
			if (e.type === 'ready') {
				let editable = true;
				let untitled = false;
				if (document.uri.scheme === 'untitled') {
					untitled = true;
				} else {
					editable = vscode.workspace.fs.isWritableFileSystem(document.uri.scheme) ? true : false;
				}
				this.postMessage(webviewPanel, 'init', {
					json: document.documentData,
					editable,
					untitled,
				});

			}
		});
	}

}
