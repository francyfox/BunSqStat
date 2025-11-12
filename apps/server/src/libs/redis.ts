import { readFileSync } from "node:fs";
import { RedisClient } from "bun";
import { config } from "@/config";

export const redisClient = new RedisClient(
	`rediss://:${config.REDIS_PASSWORD}@${config.REDIS_HOST}:${config.REDIS_PORT}`,
	{
		tls: {
			ca: readFileSync(config.REDIS_TLS_CA!),
			cert: readFileSync(config.REDIS_TLS_CERT!),
			key: readFileSync(config.REDIS_TLS_KEY!),
			rejectUnauthorized: true,
		},
	},
);

redisClient.onconnect = async () => {
	console.log("🪣  Redis was connected!");
};

redisClient.onclose = (error) => {
	console.error("🪣 Disconnected from Redis server:", error);
};
