import { rename, rm } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";

(async () => {
	await rm("./dist", { recursive: true, force: true });

	try {
		const ROOT_DIR = join(__dirname, "../../");
		const [SERVER_DIST_DIR, FRONTEND_DIST_DIR] = [
			join(ROOT_DIR, "./apps/server/dist"),
			join(ROOT_DIR, "./apps/web/dist"),
		];

		const [SERVER_OUTPUT_DIR, FRONTEND_OUTPUT_DIR] = [
			`${__dirname}/dist/server`,
			`${__dirname}/dist/web`
		]
		console.log("- Build app...");
		await $`cd ${ROOT_DIR} && bun i && bun run build | wc -c`;
		await $`mkdir -p ${__dirname}/dist/server | wc -c`.quiet();
		await $`mkdir -p ${__dirname}/dist/web | wc -c`.quiet();
		await $`cp -r ${SERVER_DIST_DIR}/* ${SERVER_OUTPUT_DIR} | wc -c`.quiet();
		await $`cp -r ${FRONTEND_DIST_DIR}/* ${FRONTEND_OUTPUT_DIR} | wc -c`.quiet();
	} catch (e) {
		const err = e as any;
		console.log(`Failed with code ${err.exitCode}`);
		console.log(err.stdout.toString());
		console.log(err.stderr.toString());
	}

	try {
		await Bun.build({
			compile: "bun-linux-x64",
			entrypoints: ["./src/index.ts"],
			outdir: "./dist",
			env: "inline",
		});

		await rename("./dist/src", "./dist/bunsqstat");

		console.log("- Build complete!");
	} catch (e) {
		const error = e as AggregateError;
		console.error("- Build Failed!");
		console.error(error);
		console.error(JSON.stringify(error, null, 2));
	}
})();
