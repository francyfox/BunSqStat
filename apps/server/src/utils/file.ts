export async function readFileLines(
	filePath: string,
	maxLines: number = 100,
): Promise<string[]> {
	try {
		const logFile = Bun.file(filePath);

		console.log(await logFile.stat());
		// Check if file exists first
		const exists = await logFile.exists();
		if (!exists) {
			console.warn(`File ${filePath} does not exist, returning empty array`);
			return [];
		}

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
		console.error(
			`Error reading ${filePath.split("/").pop()}: ${(error as Error).message}`,
		);
		return [];
	}
}

export async function readMultiplyFiles(
	files: string[],
	maxLines: number = 100,
) {
	let count = maxLines;
	let result: string[] = [];

	for (let i = 0; i < files.length; i++) {
		const lines = await readFileLines(files[i] as string, count);
		result = [...result, ...lines];

		if (count >= lines.length) break;

		count -= lines.length;
	}

	return result;
}
