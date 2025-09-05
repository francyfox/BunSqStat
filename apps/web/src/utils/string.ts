export function pascalToKebabCase(pascalCaseString: string) {
	return pascalCaseString
		.replace(/([A-Z])/g, "-$1")
		.toLowerCase()
		.replace(/^-/, "");
}
