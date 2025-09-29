export function toCamelCase(str: string) {
	return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

export function sanitizeUrl(url: string) {
	const match = url.match(/:(\d+)$/);
	if (!match) return url;
	const [_, port] = url.match(/:(\d+)$/) || ["", ""];

	switch (port) {
		case "443":
			return `https://${url.replace(_, "")}`;
		case "80":
			return `http://${url.replace(_, "")}`;
		default:
			return url;
	}
}

export function isValidUrl(url: string) {
	try {
		new URL(url);
		return true;
	} catch (_) {
		return false;
	}
}

export function getFileExtensionFromUrl(url: string) {
	const regex = /(?<=\.)[a-zA-Z0-9]+/gm;
	const match = url.match(regex);

	if (match) {
		return match.pop();
	} else {
		return null;
	}
}
