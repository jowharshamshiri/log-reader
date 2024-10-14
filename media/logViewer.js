(function() {
    const vscode = acquireVsCodeApi();

    const logContentElement = document.getElementById('logContent');

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                logContentElement.textContent = message.text;
                break;
        }
    });
}());