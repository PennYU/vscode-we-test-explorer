import * as vscode from 'vscode';

import { TestHub, testExplorerExtensionId } from 'vscode-test-adapter-api';
import { WeTestController } from './weTestController';
import { WeTreeViewProvider } from './weTreeViewProvider';

let testHub: TestHub | undefined;
let controller: WeTestController | undefined;

export function activate(context: vscode.ExtensionContext) {
	const testExplorerExtension = vscode.extensions.getExtension<TestHub>(testExplorerExtensionId);
	const provider = new WeTreeViewProvider(context.extensionUri);

	if (testExplorerExtension) {

		testHub = testExplorerExtension.exports;
		controller = new WeTestController(provider);
		testHub.registerTestController(controller);
	}

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(WeTreeViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-we-test-explorer.addColor', () => {
			provider.addColor();
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-we-test-explorer.clearColors', () => {
			provider.clearColors();
		}));
}

export function deactivate() {
	if (testHub && controller) {
		testHub.unregisterTestController(controller);
	}
}
