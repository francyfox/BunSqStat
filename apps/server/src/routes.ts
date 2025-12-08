import { Elysia } from "elysia";
import { AccessLogs } from "@/modules/access-logs";
import { AccessLogsMetrics } from "@/modules/access-logs/metrics";
import { Health } from "@/modules/health";
import { SentryProxy } from "@/modules/sentry-proxy";
import { Settings } from "@/modules/settings";
import { Stats } from "@/modules/stats";
import { WS } from "@/modules/ws";

export const routes = new Elysia()
	.get("/favicon.ico", () => new Response(null, { status: 204 }))
	.use([
		Health,
		Stats,
		AccessLogs,
		AccessLogsMetrics,
		Settings,
		WS,
		SentryProxy,
	]);

export type EdenApp = typeof routes;
