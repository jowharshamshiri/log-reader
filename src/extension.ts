import * as vscode from 'vscode';
import { LogFileEditorProvider } from './logFileEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom editor providers
	context.subscriptions.push(LogFileEditorProvider.register(context));
}
