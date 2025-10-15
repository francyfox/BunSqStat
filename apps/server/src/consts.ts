export const regexMap = new Map<string, RegExp>([
	["timestamp", /^(\d+\.\d+)/],
	["duration", /^\d+\.\d+\s+(\d+)/],
	["clientIP", /^\d+\.\d+\s+\d+\s+(\d+\.\d+\.\d+\.\d+)/],
	["resultType", /^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+([A-Z_]+)\/\d+/],
	["resultStatus", /^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/(\d+)/],
	["bytes", /^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/\d+\s+(\d+)/],
	[
		"method",
		/^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/\d+\s+\d+\s+(\w+)/,
	],
	[
		"url",
		/^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/\d+\s+\d+\s+\w+\s+(\S+)/,
	],
	[
		"user",
		/^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/\d+\s+\d+\s+\w+\s+\S+\s+(\S+)/,
	],
	[
		"hierarchyType",
		/^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/\d+\s+\d+\s+\w+\s+\S+\s+\S+\s+([A-Z_]+)\/[\d\.-]+/,
	],
	[
		"hierarchyHost",
		/^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/\d+\s+\d+\s+\w+\s+\S+\s+\S+\s+[A-Z_]+\/([\d\.-]+)/,
	],
	[
		"contentType",
		/^\d+\.\d+\s+\d+\s+\d+\.\d+\.\d+\.\d+\s+[A-Z_]+\/\d+\s+\d+\s+\w+\s+\S+\s+\S+\s+[A-Z_]+\/[\d\.-]+\s+(.+)$/,
	],
]);

export const fieldTypes = new Map<string, string>([
	["timestamp", "NUMERIC SORTABLE"],
	["duration", "NUMERIC SORTABLE"],
	["clientIP", "TAG SORTABLE"],
	["resultType", "TAG SORTABLE"],
	["resultStatus", "NUMERIC SORTABLE"],
	["bytes", "NUMERIC SORTABLE"],
	["method", "TAG SORTABLE"],
	["url", "TEXT SORTABLE"],
	["user", "TEXT"],
	["hierarchyType", "TAG SORTABLE"],
	["hierarchyHost", "TAG SORTABLE"],
	["contentType", "TEXT"],
	["domain", "TEXT SORTABLE"],
]);
