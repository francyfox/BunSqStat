export const COLORS = new Map([
	["5XX", ["#e88080", "#bd6d8a"]],
	["4XX", ["#70c0e8", "#676faf"]],
	["3XX", ["#f2c97d", "#817257"]],
	["2XX", ["#63e2b7", "#7a9d44"]],
]);

export function getGradient(
	ctx: CanvasRenderingContext2D,
	chartArea: any,
	colors: string[] = ["#fafafa", "#fafafa"],
) {
	const gradient = ctx.createLinearGradient(
		0,
		chartArea.bottom,
		0,
		chartArea.top,
	);
	gradient.addColorStop(0, colors[0]); // Bottom color
	gradient.addColorStop(1, colors[1]); // Top color
	return gradient;
}
