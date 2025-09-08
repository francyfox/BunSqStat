import { createTagQuery, createTextQuery } from "@/utils/string";

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
		case "hierarchyType":
		case "contentType":
		case "url":
		case "hierarchyHost":
			return `@${fieldName}:${value.replace(/\./g, "*")}`;

		case "timestamp":
		case "duration":
		case "resultStatus":
		case "bytes":
			// Numeric fields in Redis Search require range syntax
			if (value.match(/^[\[\(].*[\]\)]$/)) {
				// User provided range like [200 299] or (0 100) - use as-is
				return `@${fieldName}:${value}`;
			} else {
				// Single value like "200" - convert to exact range [200 200]
				return `@${fieldName}:[${value} ${value}]`;
			}

		default:
			return createTextQuery(fieldName, value);
	}
}
