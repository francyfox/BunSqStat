export function pascalToKebabCase(pascalCaseString: string) {
	return pascalCaseString
		.replace(/([A-Z])/g, "-$1")
		.toLowerCase()
		.replace(/^-/, "");
}

/**
 * Escapes special characters in Redis Search queries
 *
 * Redis Search special characters that need escaping:
 * . (dot) - field separator, token delimiter
 * , (comma) - default TAG separator
 * < > - range operators
 * [ ] - array notation, character classes
 * { } - tag value delimiters (optional, but can cause issues)
 * ( ) - grouping operators
 * ~ - fuzzy matching operator
 * * - wildcard operator
 * ? - single character wildcard
 * " - phrase delimiter
 * ' - phrase delimiter
 * | - OR operator
 * & - AND operator (when not using implicit AND)
 * ! - NOT operator
 * @ - field prefix
 * : - field-value separator
 * + - mandatory term
 * - - excluded term
 * = - exact match (deprecated but still recognized)
 * # - comment (in some contexts)
 * ^ - boost operator
 * $ - end anchor (in some regex contexts)
 * \ - escape character itself
 */

/**
 * Characters that need to be escaped in Redis Search queries
 */
const REDIS_SEARCH_SPECIAL_CHARS = /[.,()\[\]{}~*?"'|&!@:+=^$\-]/g;

/**
 * Escapes special characters for Redis Search queries
 * @param value - The value to escape
 * @returns Escaped value safe for Redis Search
 */
export function escapeRedisSearch(value: string): string {
	if (!value || typeof value !== "string") {
		return "";
	}

	return value.replace(REDIS_SEARCH_SPECIAL_CHARS, "\\$&");
}

/**
 * Escapes IP address for Redis Search (specifically for TAG fields)
 * @param ip - IP address to escape
 * @returns Escaped IP address
 */
export function escapeRedisSearchIP(ip: string): string {
	if (!ip || typeof ip !== "string") {
		return "";
	}

	// For IP addresses, we primarily need to escape dots
	return ip.replace(/\./g, "\\.");
}

/**
 * Escapes email address for Redis Search
 * @param email - Email address to escape
 * @returns Escaped email address
 */
export function escapeRedisSearchEmail(email: string): string {
	if (!email || typeof email !== "string") {
		return "";
	}

	// For emails, we need to escape @ and . symbols
	return email.replace(/[@.]/g, "\\$&");
}

/**
 * Creates a Redis Search TAG query with proper escaping
 * @param field - Field name
 * @param value - Value to search for
 * @returns Properly formatted and escaped TAG query
 */
export function createTagQuery(field: string, value: string): string {
	const escapedValue = escapeRedisSearch(value);
	return `@${field}:{${escapedValue}}`;
}

/**
 * Creates a Redis Search TEXT query with proper escaping
 * @param field - Field name
 * @param value - Value to search for
 * @param exact - Whether to search for exact phrase (wrapped in quotes)
 * @returns Properly formatted and escaped TEXT query
 */
export function createTextQuery(
	field: string,
	value: string,
	exact = false,
): string {
	const escapedValue = escapeRedisSearch(value);

	if (exact) {
		return `@${field}:"${escapedValue}"`;
	}

	return `@${field}:${escapedValue}`;
}

/**
 * Creates a Redis Search IP query (for TAG fields)
 * @param field - Field name (e.g., 'clientIP')
 * @param ip - IP address to search for
 * @returns Properly formatted and escaped IP query
 */
export function createIPQuery(field: string, ip: string): string {
	const escapedIP = escapeRedisSearchIP(ip);
	return `@${field}:{${escapedIP}}`;
}

/**
 * Creates a Redis Search wildcard query
 * @param field - Field name
 * @param pattern - Pattern with * for wildcards
 * @returns Properly formatted wildcard query
 */
export function createWildcardQuery(field: string, pattern: string): string {
	// Don't escape * and ? in wildcard queries, but escape other special chars
	const escapedPattern = pattern.replace(
		/[.,()\[\]{}~"'|&!@:+=^$\\-]/g,
		"\\$&",
	);
	return `@${field}:${escapedPattern}`;
}

/**
 * Creates a Redis Search range query for numeric fields
 * @param field - Field name
 * @param min - Minimum value (use '-inf' for negative infinity)
 * @param max - Maximum value (use '+inf' for positive infinity)
 * @param inclusive - Whether the range is inclusive [min max] or exclusive (min max)
 * @returns Properly formatted range query
 */
export function createRangeQuery(
	field: string,
	min: string | number,
	max: string | number,
	inclusive = true,
): string {
	const leftBracket = inclusive ? "[" : "(";
	const rightBracket = inclusive ? "]" : ")";
	return `@${field}:${leftBracket}${min} ${max}${rightBracket}`;
}

/**
 * Combines multiple queries with AND operator
 * @param queries - Array of query strings
 * @returns Combined query with AND operator
 */
export function combineWithAND(queries: string[]): string {
	return queries.filter(Boolean).join(" ");
}

/**
 * Combines multiple queries with OR operator
 * @param queries - Array of query strings
 * @returns Combined query with OR operator
 */
export function combineWithOR(queries: string[]): string {
	return queries.filter(Boolean).join(" | ");
}

export function formatBytes(bytes: number = 0, decimals = 2) {
	if (!+bytes) return "0 B";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function formatMilliseconds(ms: number | undefined): string {
	if (ms === undefined) return "-";
	const milliseconds = ms % 1000;
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor(ms / (1000 * 60 * 60));

	const pad = (num: number, size = 2) => `000${num}`.slice(-size);

	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

export function formatDuration(ms: string): { value: string; type: string } {
	const duration = Number(ms);
	if (duration <= 1000) return { value: `${duration}ms`, type: "success" };
	if (duration <= 5000) return { value: `${duration}ms`, type: "warning" };
	if (duration <= 30000)
		return { value: `${(duration / 1000).toFixed(1)}s`, type: "error" };
	return { value: `${(duration / 1000).toFixed(1)}s`, type: "error" };
}
