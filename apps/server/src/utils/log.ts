export function parseLogLine(line: string, regexMap: Map<string, RegExp>) {
	const result: Record<string, string> = {};
	for (const [key, regex] of regexMap) {
		result[key] = line.match(regex)?.[1] || "";
		if (key === "timestamp")
			result[key] = Math.floor(parseFloat(result[key]) as number).toString();
	}

	return result;
}
