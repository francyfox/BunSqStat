import { config } from "@/config";
import { regexMap } from "@/consts";
import { redisClient } from "@/redis";
import { mergeStrip } from "@/utils/array";
import { readFileLines } from "@/utils/file";
import { parseLogLine } from "@/utils/log";

export const AccessLog = {
	regexMap,

	async createIndex() {
		try {
			await redisClient.send("FT.DROPINDEX", ["log_idx"]);
		} catch (_) {
			console.log("No log_idx indexes. Creating...");
		}

		const indexes = [];

		for (const key of this.regexMap.keys()) {
			indexes.push(key);
			indexes.push("TEXT");
		}

		const args =
			`log_idx on HASH PREFIX 1 log: SCHEMA ${indexes.join(" ")}`.split(" ");
		await redisClient.send("FT.CREATE", args);
	},

	async readAccessLogs() {
		const { results } = await redisClient.send(
			"FT.SEARCH",
			"log_idx '*' LIMIT 0 1".split(" "),
		);

		if (results.length) {
		} // TODO: need read?

		const logs = await readFileLines(config.ACCESS_LOG, 1);

		const stack = logs.map((log) => {
			const parsed = parseLogLine(log, this.regexMap);
			return redisClient.hmset(
				`log:${parsed["timestamp"] || Date.now().toString()}`,
				mergeStrip(Object.keys(parsed), Object.values(parsed)),
			);
		});

		await Promise.all(stack);
	},
};
