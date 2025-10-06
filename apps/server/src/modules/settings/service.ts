import { redisClient } from "@/redis";

export const SettingsService = {
	setAliases(aliases: string[]) {
		return redisClient.hmset("settings:alias", aliases);
	},

	async getAliases(
		ipMap: string[] = [],
	): Promise<(string | null)[] | [string, string][]> {
		if (ipMap.length > 0) {
			return redisClient.hmget("settings:alias", ipMap);
		}

		const response = await redisClient.send("HGETALL", ["settings:alias"]);

		return Object.entries(response);
	},

	dropAliases() {
		return redisClient.del("settings:alias");
	},
};
