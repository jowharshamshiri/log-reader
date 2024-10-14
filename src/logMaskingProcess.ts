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
    const separators = /[:.,:;!?@#$%^&*()+=[\]{}<>~/\\|"'-]/;
    const tokenPattern = /(\\s+)|(\\d+)|(\\w+)/;

    const currentLine = line.trimEnd();
    const output: string[] = [];
    const currentWords: string[] = [];

    let remainingLine = currentLine;
    while (remainingLine.length > 0) {
        if (remainingLine.startsWith('\u001b')) {
            const endIndex = remainingLine.indexOf('m', 1);
            if (endIndex !== -1) {
                output.push(remainingLine.slice(0, endIndex + 1));
                remainingLine = remainingLine.slice(endIndex + 1);
                continue;
            }
        }

        const sepMatch = separators.exec(remainingLine);
        if (sepMatch) {
            output.push(sepMatch[0]);
            remainingLine = remainingLine.slice(sepMatch[0].length);
            continue;
        }

        const tokenMatch = tokenPattern.exec(remainingLine);
        if (tokenMatch) {
            const token = tokenMatch[0];
            if (currentWords.length < previousWords.length && token === previousWords[currentWords.length]) {
                output.push(substituteChar.repeat(token.length));
            } else {
                output.push(token);
            }
            currentWords.push(token);
            remainingLine = remainingLine.slice(token.length);
        } else {
            output.push(remainingLine[0]);
            remainingLine = remainingLine.slice(1);
        }
    }

    const outputLine = output.join('');
    return [outputLine, currentWords];
}