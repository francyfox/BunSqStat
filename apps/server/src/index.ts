import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { LogManager } from "@/modules/log-manager";
import { Stats } from "@/modules/stats";
import { redisClient } from "@/redis";

await LogManager.readLogs();

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
	.get(
		"/ping",
		// @ts-ignore
		() => "pong",
		{
			detail: {
				description: "Use for ping",
			},
			response: {
				"200": t.Literal("pong"),
			},
		},
	)
	.use(Stats)
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
