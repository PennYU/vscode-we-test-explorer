//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    const oldState = vscode.getState() || { colors: [], suite: {} };

    /** @type {Array<{ value: string }>} */
    const suite = oldState.suite;
    let colors = oldState.colors;

    if (suite) {
        showRootSuite(suite);
    }
    if (colors) {
        updateColorList(colors);
    }

    document.querySelector('.add-color-button').addEventListener('click', () => {
        addColor();
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'addColor':
                {
                    addColor();
                    break;
                }
            case 'clearColors':
                {
                    colors = [];
                    updateColorList(colors);
                    break;
                }
            case 'showSuite':
                {
                    if (message.suite) {
                       showRootSuite(message.suite);
                    }
                    break;
                }

        }
    });

    function showRootSuite(suite) {
        const ul = document.querySelector('.suite-list');
        if (ul) {
            ul.textContent = '';
            ul.className = 'tree';
            showTestSuite(ul, suite);
        }
        vscode.setState({ suite: suite });
    }

    function showTestSuite(ul, suite) {
        for (const info of suite.children) {
            console.log(info.label);
            const li = document.createElement('li');
            li.className = 'color-entry';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', (e) => {
                const value = e.target.value;
                onSuiteSelected(info);
            });
            li.appendChild(checkbox);

            const label = document.createElement('label');
            label.innerText = info.label;
            li.appendChild(label);

            const button = document.createElement('button');
            button.className = 'btn';
            button.addEventListener('click', (e) => {
                onRunSuite(info);
            });
            li.appendChild(button);

            if (info.children) {
                const nestedUl = document.createElement('ul');
                showTestSuite(nestedUl, info);
                li.appendChild(nestedUl);
            }

            ul.appendChild(li);
        }
    }

    /**
     * @param {Array<{ value: string }>} colors
     */
    function updateColorList(colors) {
        console.log("4");
        const ul = document.querySelector('.color-list');
        ul.textContent = '';
        for (const color of colors) {
            const li = document.createElement('li');
            li.className = 'color-entry';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            li.appendChild(checkbox);

            const colorPreview = document.createElement('div');
            colorPreview.className = 'color-preview';
            colorPreview.style.backgroundColor = `#${color.value}`;
            colorPreview.addEventListener('click', () => {
                onColorClicked(color.value);
            });
            li.appendChild(colorPreview);

            const input = document.createElement('input');
            input.className = 'color-input';
            input.type = 'text';
            input.value = color.value;
            input.addEventListener('change', (e) => {
                const value = e.target.value;
                if (!value) {
                    // Treat empty value as delete
                    colors.splice(colors.indexOf(color), 1);
                } else {
                    color.value = value;
                }
                updateColorList(colors);
            });
            li.appendChild(input);

            ul.appendChild(li);
        }

        // Update the saved state
        vscode.setState({ colors: colors });
    }

    /** 
     * @param {string} color 
     */
    function onColorClicked(color) {
        vscode.postMessage({ type: 'colorSelected', value: color });
    }

    function onRunSuite(suite) {
        vscode.postMessage({ type: 'run', value: suite });
    }

    function onSuiteSelected(suite) {
        vscode.postMessage({ type: 'suiteSelected', value: suite });
    }

    /**
     * @returns string
     */
    function getNewCalicoColor() {
        const colors = ['020202', 'f1eeee', 'a85b20', 'daab70', 'efcb99'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function addColor() {
        colors.push({ value: getNewCalicoColor() });
        updateColorList(colors);
    }
}());


