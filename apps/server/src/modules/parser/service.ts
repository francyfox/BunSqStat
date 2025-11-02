import { boolean } from "mathjs";
import { redisClient } from "@/libs/redis";
import { ParserModel, type TParserModel } from "@/modules/parser/model";
import { mergeStrip } from "@/utils/array";

export const ParserService = {
	...ParserModel,
	async createIndex() {
		try {
			await redisClient.send("FT.DROPINDEX", ["origin_idx"]);
		} catch (_) {
			// No existing index, continue with creation
		}

		const args =
			`origin_idx on HASH PREFIX 1 origin: SCHEMA ${mergeStrip(this.fields, this.types).join(" ")}`.split(
				" ",
			);
		await redisClient.send("FT.CREATE", args);
	},

	exist(id: string) {
		return redisClient.exists(`origin:${id}`);
	},

	/**
	 * @param id
	 * @return item by id or file object
	 */
	async get(
		id: string,
	): Promise<Partial<Record<TParserModel["fields"][number], string>>> {
		const result = await redisClient.hmget(`origin:${id}`, this.fields);
		return result.reduce((acc: any, currentValue, currentIndex) => {
			acc[this.fields[currentIndex] as string] = currentValue;
			return acc;
		}, {});
	},

	async getAll() {
		const { results } = await redisClient.send("FT.SEARCH", [
			"origin_idx",
			"*",
		]);

		const items = results.map((i: any) => {
			return {
				id: i?.extra_attributes.id,
				host: i?.extra_attributes.host,
				listen: i?.extra_attributes.listen === "true",
				active: i?.extra_attributes.active === "true",
			};
		});

		return {
			items,
			total: items.length,
		};
	},

	async add(
		id: string,
		{ listen, active } = {
			listen: true,
			active: true,
		},
		host?: string,
	) {
		await redisClient.hset(`origin:${id}`, {
			id,
			host: host || "",
			listen: listen ? "true" : "false",
			active: active ? "true" : "false",
		});
	},
};
