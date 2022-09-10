import * as vscode from 'vscode';
import { WeTreeViewProvider } from './weTreeViewProvider';
import { TestController, TestAdapter, TestSuiteInfo, TestInfo } from 'vscode-test-adapter-api';

export class WeTestController implements TestController {

	private readonly disposables = new Map<TestAdapter, { dispose(): void }[]>();

	private statusBarItem: vscode.StatusBarItem;
	private passedTests = 0;
	private failedTests = 0;

	constructor(readonly weTreeViewProvider: WeTreeViewProvider) {

		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		this.statusBarItem.show();

		this.statusBarItem.command = 'test-explorer.run-all';
	}

	registerTestAdapter(adapter: TestAdapter): void {
		
		const adapterDisposables: { dispose(): void }[] = [];
		this.disposables.set(adapter, adapterDisposables);

		adapterDisposables.push(adapter.tests(testLoadEvent => {

			if (testLoadEvent.type === 'started') {

				this.statusBarItem.text = 'Loading tests...';

			} else { // testLoadEvent.type === 'finished'

				const rootSuite = testLoadEvent.suite;
				const testCount = rootSuite ? countTests(rootSuite) : 0;
				this.statusBarItem.text = `Loaded ${testCount} tests`;
				if (rootSuite) {
					this.weTreeViewProvider.showTestSuite(rootSuite);
				}
			}
		}));

		adapterDisposables.push(adapter.testStates(testRunEvent => {

			if (testRunEvent.type === 'started') {

				this.statusBarItem.text = 'Running tests: ...';
				this.passedTests = 0;
				this.failedTests = 0;

			} else if (testRunEvent.type === 'test') {

				if (testRunEvent.state === 'passed') {
					this.passedTests++;
				} else if (testRunEvent.state === 'failed') {
					this.failedTests++;
				}

				this.statusBarItem.text = `Running tests: ${this.passedTests} passed / ${this.failedTests} failed`;

			} else if (testRunEvent.type === 'finished') {

				this.statusBarItem.text = `Tests: ${this.passedTests} passed / ${this.failedTests} failed`;

			}
		}));
	}

	unregisterTestAdapter(adapter: TestAdapter): void {

		const adapterDisposables = this.disposables.get(adapter);
		if (adapterDisposables) {

			for (const disposable of adapterDisposables) {
				disposable.dispose();
			}

			this.disposables.delete(adapter);
		}
	}
}

function countTests(info: TestSuiteInfo | TestInfo): number {
	if (info.type === 'suite') {
		let total = 0;
		for (const child of info.children) {
			total += countTests(child);
		}
		return total;
	} else { // info.type === 'test'
		return 1;
	}
}
