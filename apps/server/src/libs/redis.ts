import { readFileSync } from "node:fs";
import { RedisClient } from "bun";
import { config } from "@/config";

const initRedis = new RedisClient(
	`rediss://:${config.REDIS_PASSWORD}@${config.REDIS_HOST}:${config.REDIS_PORT}`,
	{
		autoReconnect: true,
		maxRetries: 3,
		tls: {
			ca: readFileSync(config.REDIS_TLS_CA!),
			cert: readFileSync(config.REDIS_TLS_CERT!),
			key: readFileSync(config.REDIS_TLS_KEY!),
			rejectUnauthorized: true,
		},
	},
);

export const redisClient = initRedis;

redisClient.onconnect = async () => {
	console.log("🪣  Redis was connected!");
};

redisClient.onclose = (error) => {
	console.error("🪣 Disconnected from Redis server:", error);
};
