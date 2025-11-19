import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";
import { config } from "@/config";
import { redisClient, redisSubscriber } from "@/libs/redis";
import { LogManager } from "@/modules/log-manager";
import { LogServer } from "@/modules/log-server";

/**
 * Flag to indicate if the primary process is intentionally shutting down.
 * @type {boolean}
 */
let isShuttingDown = false;

/**
 * Handles the logic for a worker process.
 * Workers will start the main server (Elysia) to handle HTTP/WebSocket requests.
 */
async function startWorker() {
	await import("./server");
	console.log(`Worker ${process.pid} started`);
}

function shutdownWorkers() {
	isShuttingDown = true;
	console.log("Primary is initiating graceful shutdown...");
	redisClient.close();
	redisSubscriber.close();

	// @ts-ignore
	for (const worker of Object.values(cluster.workers)) {
		worker?.kill("SIGTERM");
	}
}

function createWorkers() {
	const MAX_CPU = os.availableParallelism() > 4 ? 4 : os.availableParallelism();
	console.log(`Starting ${MAX_CPU} worker processes.`);
	for (let i = 0; i < MAX_CPU; i++) {
		cluster.fork();
	}
}

/**
 * Handles the logic for the primary (master) process.
 * The primary process is responsible for managing workers, initiating the main Redis connection,
 * and handling global services like LogManager and Redis Pub/Sub orchestration.
 */
async function startPrimary() {
	console.log(`⭐   Primary pid ${process.pid}`);
	await redisClient.connect();
	await redisSubscriber.connect();

	await LogManager.readLogs();
	await LogServer.start();

	if (config.CLUSTER_MODE) createWorkers();

	cluster.on("exit", (worker, code, signal) => {
		console.warn(
			"worker %d died (%s). restarting...",
			worker.process.pid,
			signal || code,
		);

		if (isShuttingDown) {
			// @ts-ignore
			if (Object.keys(cluster.workers).length === 0) {
				console.log("All workers have exited. Master process shutting down.");
				process.exit(0); // The final exit point for the cluster
			}
			return;
		}

		cluster.fork();
	});

	process.on("SIGINT", shutdownWorkers);
	process.on("SIGTERM", shutdownWorkers);
}

if (!config.CLUSTER_MODE) {
	await startPrimary();
	await import("./server");
} else {
	if (cluster.isPrimary) {
		await startPrimary();
	} else {
		await startWorker();
	}
}
