import { nanoid } from "nanoid";
import { parse } from "@repo/parser";
import { fieldTypes, regexMap } from "@/consts";
import { redisClient } from "@/libs/redis";
import type { getLogParams } from "@/modules/access-logs/types";
import { extractDomain } from "@/utils/string";

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

		const parsed = parse(logLines, (i) => {
			return {
				id: `access:${prefix}:${i.timestamp}_${nanoid(5)}`,
				from: prefix,
				domain: extractDomain(i.url),
			};
		});

		await redisClient.send("MULTI", []);

		for (const i of parsed) {
			const logKey = `log:${i.id}`;
			await redisClient.hset(logKey, i);
			await redisClient.expire(logKey, 604800); // 7 days
		}

		return redisClient.send("EXEC", []);
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
