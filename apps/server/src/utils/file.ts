export async function readFileLines(
	filePath: string,
	maxLines: number = 100,
): Promise<string[]> {
	try {
		const logFile = Bun.file(filePath);

		const stream = logFile.stream();
		const reader = stream.getReader();
		const decoder = new TextDecoder();

		let buffer = "";
		let lines: string[] = [];
		let done = false;

		while (!done) {
			const { value, done: readerDone } = await reader.read();
			done = readerDone;

			if (value) {
				buffer += decoder.decode(value, { stream: !done });
				const currentLines = buffer.split("\n");
				buffer = done ? "" : currentLines.pop() || "";

				lines.push(...currentLines.filter((line) => line.trim().length > 0));

				if (lines.length > maxLines * 2) {
					lines = lines.slice(-maxLines);
				}
			}
		}

		if (buffer.trim().length > 0) {
			lines.push(buffer.trim());
		}

		return lines.slice(-maxLines);
	} catch (error) {
		throw new Error(
			`Error reading ${filePath.split("/").pop()}: \n${(error as Error).message}`,
		);
	}
}
