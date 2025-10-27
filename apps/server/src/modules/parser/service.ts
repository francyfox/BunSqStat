import type { BunFile } from "bun";
import { redisClient } from "@/libs/redis";
import { ParserModel, type TParserModel } from "@/modules/parser/model";
import { mergeStrip } from "@/utils/array";

export const ParserService = {
	...ParserModel,
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

	/**
	 * @param id
	 * @return item by id or file object
	 */
	async getFileInfo(
		id: string,
	): Promise<Partial<Record<TParserModel["fields"][number], string>>> {
		const result = await redisClient.hmget(`file:${id}`, this.fields);
		return result.reduce((acc: any, currentValue, currentIndex) => {
			acc[this.fields[currentIndex] as string] = currentValue;
			return acc;
		}, {});
	},

	/**
	 * @description Add or update log information
	 * @param file
	 * @param offset - offset for file reader `used Blob slice`
	 */
	async add(file: BunFile, offset: number) {
		const { mtimeMs, ctimeMs } = await file.stat();
		const name = file.name?.split("/").pop() as string;

		const info = {
			id: ctimeMs,
			name,
			offset,
			mtimeMs,
		};

		await redisClient.hset(`file:${name}`, info);
	},
};
