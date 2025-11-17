import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";
import { redisClient } from "@/libs/redis";
import { LogManager } from "@/modules/log-manager";
import { LogServer } from "@/modules/log-server";

async function main() {
	await redisClient.connect();
	await LogManager.readLogs();
	await LogServer.start();
}

await main();

if (process.env.NODE_ENV !== "production") {
	if (cluster.isPrimary) {
		const MAX_SIZE =
			os.availableParallelism() > 4 ? 4 : os.availableParallelism();
		for (let i = 0; i < MAX_SIZE; i++) cluster.fork();
	} else {
		await import("./server");
		console.log(`Worker ${process.pid} started`);
	}
} else {
	await import("./server");
}
