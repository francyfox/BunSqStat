import cluster from "node:cluster";
import os from "node:os";
import process from "node:process";

if (process.env.NODE_ENV === "production") {
	if (cluster.isPrimary) {
		for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
	} else {
		await import("./server");
		console.log(`Worker ${process.pid} started`);
	}
} else {
	await import("./server");
}
