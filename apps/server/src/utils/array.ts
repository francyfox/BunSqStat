export function mergeStrip(a: any[], b: any[]) {
	return [
		...a.flatMap((x, i) => (i in b ? [x, b[i]] : [x])),
		...b.slice(a.length),
	];
}
