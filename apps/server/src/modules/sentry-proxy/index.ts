import * as Sentry from "@sentry/bun";
import { Elysia } from "elysia";
import { LogManager } from "@/modules/log-manager";
import { LogServer } from "@/modules/log-server";

const SENTRY_HOST = "o450533.ingest.us.sentry.io";
const SENTRY_PROJECT_ID = "4510335880265728";

export const SentryProxy = new Elysia()
	.onStart(async () => {
		Sentry.init({
			debug: true,
			environment: "backend",
			dsn: "https://cb54b8ec05858d8419f21e285985c9a8@o450533.ingest.us.sentry.io/4510335843368960",
			tracesSampleRate: 1.0,
			tracePropagationTargets: ["localhost"],
			integrations: [
				Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
			],
		});
		Sentry.captureException(new Error("test back"));
		await LogManager.readLogs();
		await LogServer.start();
	})
	// @ts-ignore
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
	.post(
		"/sentry",
		async ({ request, set }) => {
			const clonedRequest = request.clone();
			const envelopeBytes = await clonedRequest.arrayBuffer();

			try {
				const envelope = new TextDecoder().decode(envelopeBytes);
				const headerPiece = envelope.split("\n")[0];

				if (!headerPiece) throw new Error("No header piece found.");
				const header = JSON.parse(headerPiece);

				const dsnString = header.dsn;

				if (!dsnString) {
					set.status = 400;
					return { error: "DSN not found in envelope header" };
				}

				const dsn = new URL(dsnString);
				const projectId = dsn.pathname?.replace("/", "");

				if (dsn.hostname !== SENTRY_HOST) {
					set.status = 400;
					throw new Error(`Invalid sentry hostname: ${dsn.hostname}`);
				}

				if (projectId !== SENTRY_PROJECT_ID) {
					set.status = 400;
					throw new Error(`Invalid sentry project ID: ${projectId}`);
				}

				const upstreamSentryUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`;

				const upstreamResponse = await fetch(upstreamSentryUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/x-sentry-envelope",
					},
					body: envelopeBytes,
				});

				set.status = upstreamResponse.status;

				if (upstreamResponse.status >= 200 && upstreamResponse.status < 300) {
					return {};
				}

				return await upstreamResponse.text();
			} catch (e) {
				console.error("Error proxying to Sentry:", e);
				if (set.status !== 400) {
					set.status = 500;
				}
				return {
					error: "Error tunneling to Sentry",
					detail: (e as Error).message,
				};
			}
		},
		{
			parse: () => {
				return null;
			},
			detail: {
				tags: ["sentry"],
				description:
					"Tunnel endpoint for Sentry envelope requests from frontend",
			},
		},
	);
