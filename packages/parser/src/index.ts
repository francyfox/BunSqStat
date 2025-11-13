import { logLineParser } from "./parser";

export function parse(lines: string[]) {
	return lines.map((line) => logLineParser(line));
}
