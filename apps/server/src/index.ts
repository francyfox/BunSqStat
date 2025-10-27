import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { config } from "@/config";
import { loggerPlugin } from "@/libs/logger";
import { redisClient } from "@/libs/redis";
import { LogManager } from "@/modules/log-manager";
import { LogServer } from "@/modules/log-server";
import { routes } from "@/routes";

const signals = ["SIGINT", "SIGTERM"];

for (const signal of signals) {
	process.on(signal, async () => {
		console.log(`Received ${signal}. Initiating graceful shutdown...`);
		await app.stop();
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
		await LogServer.start();
	})
	.use(loggerPlugin)
	.use(routes)
	.use(cors())
	.use(swagger())
	.use(rateLimit());

app.listen(
	{
		port: config.BACKEND_PORT,
	},
	() => {
		console.log(`🕮  Swagger is active at: ${app.server?.url.origin}/swagger`);
		console.log(
			`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
		);
	},
);
