import { config } from "@/config";
import { regexMap } from "@/consts";
import type { getLogParams, TAccessLog } from "@/modules/access-logs/types";
import { redisClient } from "@/redis";
import { mergeStrip } from "@/utils/array";
import { readFileLines } from "@/utils/file";
import { parseLogLine } from "@/utils/log";

export const AccessLogService = {
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
			indexes.push("TEXT"); // TODO: check types
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

		const logLines = await readFileLines(config.ACCESS_LOG, 1);

		if (results.length > 0 && logLines.length > 0) {
			const parsedFirst = parseLogLine(
				logLines[0] || "",
				this.regexMap,
			) as TAccessLog;

			if (parsedFirst.timestamp === results[0].extra_attributes.timestamp)
				return;
		}

		const logs = await readFileLines(config.ACCESS_LOG, 100);

		const stack = logs.map((log) => {
			const parsed = parseLogLine(log, this.regexMap) as TAccessLog;
			return redisClient.hmset(
				`log:${parsed.timestamp || Date.now().toString()}`,
				mergeStrip(Object.keys(parsed), Object.values(parsed)),
			);
		});

		await Promise.all(stack);
	},

	async getLogs({ search, page, fields }: getLogParams = {}) {
		const keys = await redisClient.keys("log:*");
		const total = keys.length;

		const pageSize = 10;
		const returnFields = fields ? `RETURN ${fields.join(" ")}` : "";
		const args =
			`log_idx ${search || "'*'"} LIMIT ${((page || 1) - 1) * pageSize} ${pageSize} ${returnFields}`
				.split(" ")
				.filter(Boolean);

		const response = await redisClient.send("FT.SEARCH", args);
		const items = response.results.map((i: any) => i.extra_attributes);

		return {
			items,
			total,
			count: response.total_results,
		};
	},
};
