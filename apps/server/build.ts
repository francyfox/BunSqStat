import { rm } from "node:fs/promises";

(async () => {
	await rm("./dist", { recursive: true, force: true });
	await Bun.build({
		target: "bun",
		root: "./src",
		format: "esm",
		entrypoints: ["./src/index.ts"],
		outdir: "./dist",
		splitting: true,
		sourcemap: "linked",
		env: "inline",
		minify: {
			whitespace: true,
			syntax: true,
		},
	});

	console.log("Build complete!");
})();
