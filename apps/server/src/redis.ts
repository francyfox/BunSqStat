import { RedisClient } from "bun";

export const redisClient = new RedisClient(
	"redis://default:123@localhost:6379",
);

redisClient.onconnect = async () => {
	console.log("🪣  Redis was connected!");
};

redisClient.onclose = (error) => {
	console.error("🪣 Disconnected from Redis server:", error);
};
