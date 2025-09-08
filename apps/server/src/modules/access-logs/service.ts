import { config } from "@/config";
import { regexMap } from "@/consts";
import type { getLogParams, TAccessLog } from "@/modules/access-logs/types";
import { redisClient } from "@/redis";
import { mergeStrip } from "@/utils/array";
import { readFileLines } from "@/utils/file";
import { parseLogLine } from "@/utils/log";

export const AccessLogService = {
	regexMap,
	types: new Map<string, string>(),

	/**
	 * @description Use after readAccessLogs, because we need check field types
	 */
	async createIndex() {
		try {
			await redisClient.send("FT.DROPINDEX", ["log_idx"]);
		} catch (_) {
			console.log("No log_idx indexes. Creating...");
		}

		const indexes = [];

		for (const key of this.regexMap.keys()) {
			indexes.push(key);
			indexes.push(this.types.get(key));
		}

		const args =
			`log_idx on HASH PREFIX 1 log: SCHEMA ${indexes.join(" ")}`.split(" ");
		await redisClient.send("FT.CREATE", args);
	},

	async readLastLines(count: number) {
		const logs = await readFileLines(config.ACCESS_LOG, count);

		const stack = logs.map((log) => {
			const parsed = parseLogLine(log, this.regexMap) as TAccessLog;
			return redisClient.hmset(
				`log:${parsed.timestamp || Date.now().toString()}`,
				mergeStrip(Object.keys(parsed), Object.values(parsed)),
			);
		});

		await Promise.all(stack);
	},

	async readAccessLogs() {
		const logLines = await readFileLines(config.ACCESS_LOG, 1);

		if (logLines.length === 0) return;

		const parsedFirst = parseLogLine(
			logLines[0] || "",
			this.regexMap,
		) as TAccessLog;

		const [result] = await redisClient.hmget(`log:${parsedFirst?.timestamp}`, [
			Array.from(this.regexMap.keys())[0] || "",
		]);

		for (const fieldName of Object.keys(parsedFirst)) {
			let type: string;
			// @ts-ignore
			if (Number.isNaN(Number(parsedFirst[fieldName]))) {
				type = "TEXT";
			} else {
				type = "NUMERIC SORTABLE";
			}
			this.types.set(fieldName, type);
		}

		if (parsedFirst.timestamp === result) return;

		await this.readLastLines(100);
	},

	async getLogs({ search, page, fields, last }: getLogParams = {}) {
		const keys = await redisClient.keys("log:*");
		const total = keys.length;

		const pageSize = 10;
		const returnFields = fields ? `RETURN ${fields.join(" ")}` : "";
		let args =
			`LIMIT ${((page || 1) - 1) * pageSize} ${pageSize} ${returnFields}`
				.split(" ")
				.filter(Boolean);

		if (last) {
			args = `LIMIT 0 1 ${returnFields}`.split(" ").filter(Boolean);
		}

		args = [...["log_idx", `${search || "'*'"}`], ...args];

		const response = await redisClient.send("FT.SEARCH", args);
		const items = response.results.map((i: any) => i.extra_attributes);

		return {
			items,
			total,
			count: response.total_results,
		};
	},
};
