import * as vscode from 'vscode';
import { getNonce } from './util';
import { processLogContent } from './logMaskingProcess';

export class LogFileEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new LogFileEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(LogFileEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = 'logMask.logViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {
        // Register both toggle mask commands
        const toggleMaskOnCommand = vscode.commands.registerCommand('logMask.toggleMaskOn', this.toggleMask.bind(this));
        const toggleMaskOffCommand = vscode.commands.registerCommand('logMask.toggleMaskOff', this.toggleMask.bind(this));
        context.subscriptions.push(toggleMaskOnCommand, toggleMaskOffCommand);
    }

    private isMasked: boolean = false;
    private currentDocument: vscode.TextDocument | undefined;
    private currentWebviewPanel: vscode.WebviewPanel | undefined;

    private toggleMask() {
        if (!this.currentDocument || !this.currentWebviewPanel) {
            return;
        }

        this.isMasked = !this.isMasked;
        
        // Set the context for the button icon
        vscode.commands.executeCommand('setContext', 'logMaskActive', this.isMasked);

        if (this.isMasked) {
            const processedContent = processLogContent(this.currentDocument.getText());
            this.currentWebviewPanel.webview.postMessage({ type: 'update', text: processedContent, isMasked: true });
        } else {
            this.updateWebview();
        }
    }

    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void> {
        this.currentDocument = document;
        this.currentWebviewPanel = webviewPanel;

        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                this.updateWebview();
            }
        });

        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
            this.currentDocument = undefined;
            this.currentWebviewPanel = undefined;
        });

        this.updateWebview();
    }

    private updateWebview() {
        if (!this.currentWebviewPanel || !this.currentDocument) {
            return;
        }

        this.currentWebviewPanel.webview.postMessage({
            type: 'update',
            text: this.currentDocument.getText(),
            isMasked: this.isMasked
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this.context.extensionUri, 'media', 'logViewer.js'));

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this.context.extensionUri, 'media', 'reset.css'));

        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this.context.extensionUri, 'media', 'vscode.css'));

        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
            this.context.extensionUri, 'media', 'logViewer.css'));

        const nonce = getNonce();

        return /* html */`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet" />
                <link href="${styleVSCodeUri}" rel="stylesheet" />
                <link href="${styleMainUri}" rel="stylesheet" />
                <title>Log Viewer</title>
            </head>
            <body>
                <pre id="logContent"></pre>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}