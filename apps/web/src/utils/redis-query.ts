import {
	createTagQuery,
	createTextQuery,
	createURLQuery,
} from "@/utils/string";

/**
 * Builds a smart Redis Search query with proper escaping based on field type
 * @param field - Field name with @ and : (e.g., "@clientIP:")
 * @param searchValue - Value to search for
 * @returns Properly formatted and escaped Redis Search query
 */
export function buildSearchQuery(
	field: string,
	searchValue: string | null,
): string {
	if (!searchValue) {
		return "*";
	}

	const fieldName = field.replace(/[@:]/g, ""); // Extract clean field name
	const value = searchValue.toString().trim();

	switch (fieldName) {
		case "clientIP":
			return `@${fieldName}:${value.replace(/\./g, "*")}`;

		case "user":
			return value.includes("@")
				? createTagQuery(fieldName, value)
				: createTextQuery(fieldName, value);

		case "resultType":
		case "method":
			return `@${fieldName}:{${value.replace(/\./g, "*")}}`;
		case "hierarchyType":
		case "contentType":
			return `@${fieldName}:'${value}'`;

		case "url":
			// URL is TEXT SORTABLE field - use specialized URL query function
			return createURLQuery(fieldName, value.replace(/^https?:\/\//g, ""));
		case "hierarchyHost":
			return `@${fieldName}:${value.replace(/\./g, "*")}`;

		case "timestamp":
		case "duration":
		case "resultStatus":
		case "bytes":
			if (value.match(/^[\[\(].*[\]\)]$/)) {
				return `@${fieldName}:${value}`;
			} else {
				return `@${fieldName}:[${value} ${value}]`;
			}

		default:
			return createTextQuery(fieldName, value);
	}
}
