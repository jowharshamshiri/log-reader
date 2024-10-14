(function() {
    const vscode = acquireVsCodeApi();
    const logContent = document.getElementById('logContent');

    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                updateContent(message.text);
                break;
        }
    });

    function updateContent(content) {
        logContent.innerHTML = ''; // Clear existing content
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'log-line';
            lineElement.textContent = line;
            lineElement.setAttribute('data-line-number', index + 1);
            logContent.appendChild(lineElement);
        });
    }
})();