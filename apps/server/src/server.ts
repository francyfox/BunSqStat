import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import * as Sentry from "@sentry/bun";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { config } from "@/config";
import { loggerPlugin } from "@/libs/logger";
import { redisClient } from "@/libs/redis";
import { routes } from "@/routes";

const signals = ["SIGINT", "SIGTERM"];

for (const signal of signals) {
	process.on(signal, async () => {
		console.log(`Received ${signal}. Initiating graceful shutdown...`);
		redisClient.close();
		await app.stop();

		process.exit(0);
	});
}

process.on("uncaughtException", (error) => {
	console.error(error);
	Sentry.captureException(error);
});

process.on("unhandledRejection", (error) => {
	console.error(error);
	Sentry.captureException(error);
});

const app = new Elysia()
	// @ts-ignore
	.use(loggerPlugin)
	// @ts-ignore
	.onError(({ error, code, set }) => {
		console.log(error);
		Sentry.captureException(error);
		if (code === "VALIDATION") {
			set.status = 400;
			return { error: "Validation error", message: error.message, stack: error.stack.split("\n") };
		}
		if (code === "NOT_FOUND") {
			set.status = 404;
			return { error: "Not found" };
		}
		set.status = 500;
		return { error: "Internal server error", message: error.message, stack: error.stack.split("\n") };
	})
	.onRequest(({ request, path }) => {
		Sentry.startSpan(
			{
				op: "http.server",
				name: `${request.method} ${path}`,
			},
			() => {
				// span will be automatically ended
			},
		);
	})
	.use(routes)
	.use(cors())
	.use(swagger())
	.use(rateLimit());

app.listen(
	{
		port: config.BACKEND_PORT!,
	},
	() => {
		console.log(`🕮  Swagger is active at: ${app.server?.url.origin}/swagger`);
		console.log(
			`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
		);
	},
);
