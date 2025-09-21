export function parseLogLine(line: string, regexMap: Map<string, RegExp>) {
	const result: Record<string, string> = {};
	for (const [key, regex] of regexMap) {
		result[key] = line.match(regex)?.[1] || "";
		if (key === "timestamp") {
			const ts = parseFloat(result[key]);
			if (!Number.isNaN(ts)) {
				result[key] = Math.round(ts * 1000).toString();
			}
		}
	}

	console.log(line, result);
	return result;
}
