import { resolve } from "node:path";
import chokidar from "chokidar";
import { config } from "@/config";
import { regexMap } from "@/consts";
import { redisClient } from "@/redis";
import { mergeStrip } from "@/utils/array";

export const LogManager = {
	regexMap,

	logs: [resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)],
	watcher: chokidar.watch([
		resolve(config.ACCESS_LOG),
		resolve(config.CACHE_LOG),
	]),

	async createIndex() {
		await redisClient.send("FT.DROPINDEX", ["log_idx"]);

		const indexes = [];

		for (const key in this.regexMap.keys()) {
			indexes.push(key);
			indexes.push("TEXT");
		}

		const args =
			`log_idx on HASH PREFIX 1 log: SCHEMA ${indexes.join(" ")}`.split(" ");
		await redisClient.send("FT.CREATE", args);
	},

	async readFileLines(
		filePath: string,
		maxLines: number = 100,
	): Promise<string[]> {
		try {
			const logFile = Bun.file(filePath);

			const stream = logFile.stream();
			const reader = stream.getReader();
			const decoder = new TextDecoder();

			let buffer = "";
			let lines: string[] = [];
			let done = false;

			while (!done) {
				const { value, done: readerDone } = await reader.read();
				done = readerDone;

				if (value) {
					buffer += decoder.decode(value, { stream: !done });
					const currentLines = buffer.split("\n");
					buffer = done ? "" : currentLines.pop() || "";

					lines.push(...currentLines.filter((line) => line.trim().length > 0));

					if (lines.length > maxLines * 2) {
						lines = lines.slice(-maxLines);
					}
				}
			}

			if (buffer.trim().length > 0) {
				lines.push(buffer.trim());
			}

			return lines.slice(-maxLines);
		} catch (error) {
			throw new Error(
				`Error reading ${filePath.split("/").pop()}: \n${(error as Error).message}`,
			);
		}
	},
	parseLogLine(line: string) {
		const result: Record<string, string> = {};
		for (const [key, regex] of this.regexMap) {
			result[key] = line.match(regex)?.[1] || "";
			if (key === "id") Math.floor(parseFloat(result[key]) as number);
		}

		return result;
	},

	async readAccessLogs() {
		const { results } = await redisClient.send(
			"FT.SEARCH",
			"log_idx '*' LIMIT 0 1".split(" "),
		);

		if (results.length) {
		} // TODO: need read?

		const logs = await this.readFileLines(config.ACCESS_LOG, 1);

		const stack = logs.map((log) => {
			const parsed = this.parseLogLine(log);
			console.log(parsed);
			return redisClient.hmset(
				`log:${parsed["timestamp"] || Date.now().toString()}`,
				mergeStrip(Object.keys(parsed), Object.values(parsed)),
			);
		});
	},

	async readLogs() {
		await this.readAccessLogs();
	},
};
