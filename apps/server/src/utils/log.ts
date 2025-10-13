// @ts-ignore
import { default as mime } from "mime/lite";
import { extractDomain, getFileExtensionFromUrl } from "@/utils/string";

export function parseLogLine(line: string, regexMap: Map<string, RegExp>) {
	const result: Record<string, string> = {};
	for (const [key, regex] of regexMap) {
		result[key] = line.match(regex)?.[1] || "-";
		if (key === "timestamp") {
			const ts = parseFloat(result[key]);
			if (!Number.isNaN(ts)) {
				result[key] = Math.round(ts * 1000).toString();
			}
		}

		if (key === "clientIP" && result[key] !== "-") {
			result[key] = result[key].replace(/\./g, "_");
		}

		if (key === "hierarchyHost" && result[key] !== "-") {
			result[key] = result[key].replace(/\./g, "_");
		}

		if (key === "url" && result[key] !== "-") {
			result["domain"] = extractDomain(result["url"] || "");
		}

		const NO_CONTENT_TYPE =
			key === "contentType" && result["contentType"] === "-";
		if (NO_CONTENT_TYPE) {
			const extension = getFileExtensionFromUrl(result["url"] || "");
			result[key] = mime.getType(extension) || "-";
		}
	}

	return result;
}
