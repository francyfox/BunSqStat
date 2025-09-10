import { RedisClient } from "bun";
import { config } from "@/config";

export const redisClient = new RedisClient(
	`redis://default:${config.REDIS_PASSWORD}@localhost:6379`,
);

redisClient.onconnect = async () => {
	console.log("🪣  Redis was connected!");
};

redisClient.onclose = (error) => {
	console.error("🪣 Disconnected from Redis server:", error);
};
