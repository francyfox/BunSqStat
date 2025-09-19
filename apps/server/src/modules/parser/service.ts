import type { BunFile } from "bun";
import { redisClient } from "@/redis";
import { mergeStrip } from "@/utils/array";

export const ParserService = {
	fields: ["id", "name", "offset", "mtimeMs"],
	types: ["TAG", "TEXT SORTABLE", "NUMERIC", "NUMERIC"],

	async createIndex() {
		try {
			await redisClient.send("FT.DROPINDEX", ["file_idx"]);
		} catch (_) {
			// No existing index, continue with creation
		}

		const args =
			`file_idx on HASH PREFIX 1 log: SCHEMA ${mergeStrip(this.fields, this.types).join(" ")}`.split(
				" ",
			);
		await redisClient.send("FT.CREATE", args);
	},
	getFileInfo(id: number) {
		return redisClient.hmget(`file:${id}`, this.fields);
	},

	async add(file: BunFile, offset: number) {
		const { mtimeMs, ctimeMs } = await file.stat();

		const info = {
			id: ctimeMs,
			name: file.name,
			offset,
			mtimeMs,
		};

		await redisClient.hmset(
			`file:${ctimeMs}`,
			mergeStrip(this.fields, Object.values(info)),
		);
	},

	async update(
		id: string,
		{ offset, mtimeMs }: { offset: number; mtimeMs: number },
	) {
		await redisClient.hmset(`file:${id}`, [
			"offset",
			offset.toString(),
			"mtimeMs",
			mtimeMs.toString(),
		]);
	},

	async hasUpdates(id: number, mtimeMs: number) {
		const result = await redisClient.hmget(`file:${id}`, ["mtimeMs"]);
		return result.length > 0 && Number(result[0]) === mtimeMs;
	},
};
