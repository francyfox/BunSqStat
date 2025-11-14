import { parseArgs } from "node:util";
import { benchmark, parse } from "./parser";

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

export { parse };
