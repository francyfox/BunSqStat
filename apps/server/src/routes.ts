import { Elysia } from "elysia";
import { AccessLogs } from "@/modules/access-logs";
import { AccessLogsMetrics } from "@/modules/access-logs/metrics";
import { Health } from "@/modules/health";
import { SentryProxy } from "@/modules/sentry-proxy";
import { Settings } from "@/modules/settings";
import { Stats } from "@/modules/stats";
import { WS } from "@/modules/ws";

export const routes = new Elysia()
	.use(Health)
	.use(Stats)
	.use(AccessLogs)
	.use(AccessLogsMetrics)
	.use(Settings)
	.use(WS)
	.use(SentryProxy);

export type EdenApp = typeof routes;
