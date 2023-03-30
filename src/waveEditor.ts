import * as vscode from 'vscode';
import { getNonce } from './util';

export class WaveEditorProvider implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new WaveEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(WaveEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = 'digitalcircuitanalysis.wave';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    /**
     * Called when our custom editor is opened.
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        function updateWebview() {
            webviewPanel.webview.postMessage({
                type: 'update',
                text: document.getText(),
            });
        }

        // Hook up event handlers so that we can synchronize the webview with the text document.
        //
        // The text document acts as our model, so we have to sync change in the document to our
        // editor and sync changes in the editor back to the document.
        //
        // Remember that a single text document can also be shared between multiple custom
        // editors (this happens for example when you split a custom editor)
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Receive message from the webview.
        webviewPanel.webview.onDidReceiveMessage(e => {
            //switch (e.type) {
            //}
        });

        updateWebview();
    }

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
            <title>Wave</title>
            <!--
            Use a content security policy to only allow loading images from https or from our extension directory,
            and only allow scripts that have a specific nonce.
            :attention: This makes rendering extremly slow
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            -->
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${getAsset('reset.css')}" rel="stylesheet" />
            <link href="${getAsset('vscode.css')}" rel="stylesheet" />
            <script type="text/javascript" nonce="${nonce}">
                const vscode = acquireVsCodeApi();
                window.onload = function() {
                    vscode.postMessage({ command: 'get-data' });
                    console.log('Ready to accept data.');
                };
            </script>
            <script type="text/javascript" src="${getAsset('d3.min.js')}" nonce="${nonce}"></script>
            <script type="text/javascript" src="${getAsset('@fortawesome/free-solid-svg-icons/index.js')}" nonce="${nonce}"></script>
            <script type="text/javascript" src="${getAsset('d3-wave.js')}" nonce="${nonce}"></script>
            <style type="text/css">
               .d3-wave {
                     width: 100%;
                     height: 100%;
                     position: fixed;
                     left: 0px;
                     bottom: 0px;
                     right: 0px;
                     top: 0px;
               };
            </style>
        </head>
        <body>
            <svg id="wave-placeholder"></svg>
            <script type="text/javascript" src="${getAsset('wave.js')}" nonce="${nonce}"></script>
        </body>
        </html>`;
    }


}
