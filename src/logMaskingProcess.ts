export function processLogContent(content: string, substituteChar: string = '░'): string {
    const lines = content.split('\n');
    let previousWords: string[] = [];
    const processedLines = lines.map(line => {
        const [processedLine, currentWords] = processLine(line, previousWords, substituteChar);
        previousWords = currentWords;
        return processedLine;
    });
    return processedLines.join('\n');
}

function processLine(line: string, previousWords: string[], substituteChar: string = '░'): [string, string[]] {
    // eslint-disable-next-line no-control-regex
    const colorPattern = /\x1b\[[0-9;]*[mGK]/;
    const separators = /[:.,;!?@#$%^&*()+=[\]{}<>~/\\|"'-]/;
    // eslint-disable-next-line no-control-regex
    const tokenPattern = /(\x1b\[[0-9;]*[mGK])|([:.,:;!?@#$%^&*()+=[\]{}<>~/\\|"'-])|(\s+)|(\d+)|(\w+)/g;

    const currentLine = line.trimEnd();
    const output: string[] = [];
    const currentWords: string[] = [];

    const tokens = currentLine.match(tokenPattern) || [];

    for (const token of tokens) {
        if (colorPattern.test(token)) {
            output.push(token);
        } else if (separators.test(token) || /\s+/.test(token)) {
            output.push(token);
        } else {
            if (currentWords.length < previousWords.length && token === previousWords[currentWords.length]) {
                output.push(substituteChar.repeat(token.length));
            } else {
                output.push(token);
            }
            currentWords.push(token);
        }
    }

    const outputLine = output.join('');
    return [outputLine + '\n', currentWords];
}