import { parseArgs } from "node:util";
import { benchmark, dev, parse } from "./parser";

const { values } = parseArgs({
	args: Bun.argv,
	options: {
		dev: {
			type: "boolean",
			default: false,
		},
		benchmark: {
			type: "string",
		},
	},
	strict: true,
	allowPositionals: true,
});

if (values.benchmark) {
	benchmark(Number(values.benchmark));
}

// if (values.dev) {
// 	dev();
// }

export { parse };
