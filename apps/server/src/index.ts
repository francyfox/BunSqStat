import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { LogManager } from "@/modules/log-manager";
import { fileWatcher } from "@/modules/watcher";
import { redisClient } from "@/redis";
import { routes } from "@/routes";

const signals = ["SIGINT", "SIGTERM"];

for (const signal of signals) {
	process.on(signal, async () => {
		console.log(`Received ${signal}. Initiating graceful shutdown...`);
		await app.stop();
		await fileWatcher.close();
		redisClient.close();
		process.exit(0);
	});
}

process.on("uncaughtException", (error) => {
	console.error(error);
});

process.on("unhandledRejection", (error) => {
	console.error(error);
});

const app = new Elysia()
	.onStart(async () => {
		await LogManager.readLogs();
	})
	.use(routes)
	.use(cors())
	.use(swagger())
	.use(rateLimit());

app.listen(
	{
		port: 3000,
	},
	() => {
		console.log(`🕮  Swagger is active at: ${app.server?.url.origin}/swagger`);
		console.log(
			`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
		);
	},
);
