export function toCamelCase(str: string) {
	return str.replace(/_([a-z])/g, (match, char) => char.toUpperCase());
}
