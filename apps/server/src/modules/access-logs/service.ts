import { nanoid } from "nanoid";
import { fieldTypes, regexMap } from "@/consts";
import { redisClient } from "@/libs/redis";
import type { getLogParams, TAccessLog } from "@/modules/access-logs/types";
import { parseLogLine } from "@/utils/log";

export const AccessLogService = {
	name: "access",
	regexMap,
	fieldTypes,

	async dropLogs() {
		const logKeys = await redisClient.keys("log:access:*");
		const fileKeys = await redisClient.keys("file:access*");

		if (logKeys.length > 0) {
			await redisClient.del(...logKeys);
		}

		if (fileKeys.length > 0) {
			await redisClient.del(...fileKeys);
		}
	},

	sanitizeLogData(logData: Record<string, string>): Record<string, string> {
		const sanitized = { ...logData };

		for (const [key, value] of Object.entries(sanitized)) {
			const fieldType = this.fieldTypes.get(key);
			if (fieldType?.includes("NUMERIC")) {
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
	async createIndex(prefix: string = "") {
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
			`log_idx on HASH PREFIX 1 log:access:${prefix} SCHEMA ${indexes.join(" ")}`.split(
				" ",
			);
		await redisClient.send("FT.CREATE", args);
	},

	async readLogs(logLines: string[], prefix = "o") {
		if (logLines.length === 0) return;

		logLines.sort((a, b) => {
			const timestampA = parseFloat(a.split(" ")[0] || "");
			const timestampB = parseFloat(b.split(" ")[0] || "");
			return timestampA - timestampB;
		});

		if (logLines.length === 0) return;

		const stack = logLines.map(async (log) => {
			const parsed = parseLogLine(log, this.regexMap) as TAccessLog;
			const sanitized = {
				...this.sanitizeLogData(parsed),
				id: `access:${prefix}:${parsed.timestamp}_${nanoid(5)}`,
				from: prefix,
			};
			const logKey = `log:${sanitized.id}`;

			await redisClient.hset(logKey, sanitized);
			await redisClient.expire(logKey, 604800); // 7 days
		});

		await Promise.all(stack);

		return;
	},

	async getLogs({ search, sortBy, page, fields, prefix }: getLogParams = {}) {
		const keys = await redisClient.keys(`log:${prefix ?? "*"}`);
		const total = keys.length;

		const pageSize = 10;
		const returnFields = fields ? `RETURN ${fields.join(" ")}` : "";

		const args = [
			"log_idx",
			search || "*",
			"SORTBY",
			(sortBy || "timestamp, DESC").split(","),
			"LIMIT",
			(((page || 1) - 1) * pageSize).toString(),
			pageSize.toString(),
			returnFields,
		]
			.flat()
			.filter(Boolean) as string[];

		const response = await redisClient.send("FT.SEARCH", args);
		const items = response.results.map((i: any) => i.extra_attributes);

		return {
			items,
			total,
			count: response.total_results,
		};
	},
};
