import { redisClient } from "@/redis";

export const SettingsService = {
	setAliases(aliases: string[]) {
		return redisClient.hmset("settings:alias", aliases);
	},

	getAliases(ipMap: string[]) {
		return redisClient.hmget("settings:alias", ipMap);
	},

	dropAliases() {
		return redisClient.del("settings:alias");
	},
};
