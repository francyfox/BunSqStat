import { ParserService } from "@/modules/parser/service";

export async function readFileLines(
	filePath: string,
	maxLines: number = 100,
): Promise<string[]> {
	try {
		const logFile = Bun.file(filePath);
		const exists = await logFile.exists();
		if (!exists) {
			console.warn(`File ${filePath} does not exist, returning empty array`);
			return [];
		}

		const { offset: begin } = await ParserService.getFileInfo(
			filePath.split("/").pop() as string,
		);

		if (Number(begin) === logFile.size) {
			return [];
		}

		const stream = logFile.slice(Number(begin)).stream();
		const decoder = new TextDecoder();

		let buffer = "";
		let offset = 0;
		let lines: string[] = [];

		for await (const chunk of stream) {
			const decoded = decoder.decode(chunk);
			buffer += decoded;
			offset += decoded.length;

			const currentLines = buffer.split("\n");
			lines.push(...currentLines.filter((line) => line.trim().length > 0));

			if (lines.length > maxLines * 2) {
				lines = lines.slice(-maxLines);
			}
		}

		if (buffer.trim().length > 0) {
			lines.push(buffer.trim());
		}

		if (offset !== 0) {
			await ParserService.add(logFile, offset);
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
