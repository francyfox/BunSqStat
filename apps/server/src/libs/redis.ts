import { readFileSync } from "node:fs";
import { RedisClient } from "bun";
import { config } from "@/config";

export const REDIS_WS_CHANNEL = "ws:broadcast";
export let REDIS_COUNT = 0;

export function getRedisClient(): RedisClient {
	REDIS_COUNT += 1;

	const _redisClient = new RedisClient(
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

	_redisClient.onconnect = async () => {
		console.log(`🪣  [${REDIS_COUNT}] Redis client was connected!`);
	};

	_redisClient.onclose = (error) => {
		console.error(`🪣 [${REDIS_COUNT}] Disconnected Redis client:`, error);
	};

	return _redisClient;
}

export const redisClient = getRedisClient();
export const redisSubscriber = getRedisClient();
