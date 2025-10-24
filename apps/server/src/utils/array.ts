export function mergeStrip(a: any[], b: any[]) {
	return [
		...a.flatMap((x, i) => (i in b ? [x, b[i]] : [x])),
		...b.slice(a.length),
	];
}

export function chuck(array: any[], chunkSize: number) {
	const output = [];

	for (let i = 0; i < array.length; i += chunkSize) {
		const chunk = array.slice(i, i + chunkSize);
		output.push(chunk);
	}

	return output;
}
