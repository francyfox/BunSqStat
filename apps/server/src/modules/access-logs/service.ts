import { config } from "@/config";
import { fieldTypes, regexMap } from "@/consts";
import type { getLogParams, TAccessLog } from "@/modules/access-logs/types";
import { redisClient } from "@/redis";
import { mergeStrip } from "@/utils/array";
import { readFileLines } from "@/utils/file";
import { parseLogLine } from "@/utils/log";

export const AccessLogService = {
	regexMap,
	fieldTypes,

	sanitizeLogData(logData: Record<string, string>): Record<string, string> {
		const sanitized = { ...logData };

		for (const [key, value] of Object.entries(sanitized)) {
			const fieldType = this.fieldTypes.get(key);
			if (fieldType && fieldType.includes("NUMERIC")) {
				if (!value || value === "-" || Number.isNaN(Number(value))) {
					sanitized[key] = "0";
				}
			}
		}

		return sanitized;
	},

	/**
	 * @description Use after readAccessLogs, because we need check field types
	 */
	async createIndex() {
		try {
			await redisClient.send("FT.DROPINDEX", ["log_idx"]);
		} catch (_) {
			// No existing index, continue with creation
		}

		const indexes = [];

		for (const key of this.regexMap.keys()) {
			indexes.push(key);
			indexes.push(this.fieldTypes.get(key));
		}

		const args =
			`log_idx on HASH PREFIX 1 log: SCHEMA ${indexes.join(" ")}`.split(" ");
		await redisClient.send("FT.CREATE", args);
	},

	async readLastLines(count: number) {
		const logs = await readFileLines(config.ACCESS_LOG, count);

		const stack = logs.map((log) => {
			const parsed = parseLogLine(log, this.regexMap) as TAccessLog;

			const sanitized = this.sanitizeLogData(parsed);
			return redisClient.hmset(
				`log:${sanitized["timestamp"] || Date.now().toString()}`,
				mergeStrip(Object.keys(sanitized), Object.values(sanitized)),
			);
		});

		await Promise.all(stack);
	},

	async readAccessLogs() {
		const logLines = await readFileLines(config.ACCESS_LOG, 500);
		if (logLines.length === 0) return 0;

		const newLogs: string[] = [];

		for (let i = 0; i < logLines.length; i += 1) {
			const logLine = logLines[i] || "";
			const parsed = parseLogLine(logLine, this.regexMap) as TAccessLog;
			const logKey = `log:${parsed.timestamp}`;
			const exists = await redisClient.exists(logKey);

			if (!exists) {
				newLogs.push(logLine);
			}
		}

		newLogs.sort((a, b) => {
			const timestampA = parseFloat(a.split(" ")[0] || "");
			const timestampB = parseFloat(b.split(" ")[0] || "");
			return timestampA - timestampB;
		});

		if (newLogs.length === 0) return 0;

		const stack = newLogs.map((log) => {
			const parsed = parseLogLine(log, this.regexMap) as TAccessLog;
			const sanitized = this.sanitizeLogData(parsed);
			return redisClient.hmset(
				`log:${sanitized["timestamp"] || Date.now().toString()}`,
				mergeStrip(Object.keys(sanitized), Object.values(sanitized)),
			);
		});

		await Promise.all(stack);
		return newLogs.length;
	},

	async getLogs({ search, page, fields }: getLogParams = {}) {
		const keys = await redisClient.keys("log:*");
		const total = keys.length;

		const pageSize = 10;
		const returnFields = fields ? `RETURN ${fields.join(" ")}` : "";
		const sortBy = "SORTBY timestamp DESC";

		const args =
			`log_idx ${search || "'*'"} ${sortBy} LIMIT ${((page || 1) - 1) * pageSize} ${pageSize} ${returnFields}`
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
