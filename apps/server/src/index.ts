import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import * as Sentry from "@sentry/bun";
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
		Sentry.init({
			environment: "backend",
			dsn: "https://cb54b8ec05858d8419f21e285985c9a8@o450533.ingest.us.sentry.io/4510335843368960",
			tracesSampleRate: 1.0,
			tracePropagationTargets: ["localhost"],
			integrations: [
				Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
			],
		});
		await LogManager.readLogs();
		await LogServer.start();
	})
	.onError(({ code, error }) => {
		Sentry.captureException(error);
		if (code === "VALIDATION") {
			return error.message;
		}
	})
	.onBeforeHandle(({ set }) => {
		set.headers["Access-Control-Allow-Headers"] =
			"sentry-trace, baggage, traceparent";
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
