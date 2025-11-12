import * as Sentry from "@sentry/vue";
import type { App } from "vue";
import type { Router } from "vue-router";

export const sentryInit = (app: App<any>, router: Router) => {
	if (process.env.NODE_ENV === "production") {
		Sentry.init({
			environment: "frontend",
			app,
			dsn: "https://d156531d5cf75eb9a43f196ae2177dba@o450533.ingest.us.sentry.io/4510335880265728",
			tunnel: "/api/sentry",
			sendDefaultPii: true,
			integrations: [
				Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
				Sentry.globalHandlersIntegration(),
				Sentry.httpClientIntegration({
					failedRequestStatusCodes: [[400, 599]],
				}),
				Sentry.browserApiErrorsIntegration({
					setTimeout: true,
					setInterval: true,
					requestAnimationFrame: true,
					XMLHttpRequest: true,
					eventTarget: true,
					unregisterOriginalCallbacks: true,
				}),
				Sentry.replayIntegration(),
				Sentry.browserTracingIntegration({
					router,
				}),
				Sentry.feedbackIntegration({
					colorScheme: "dark",
					showBranding: false,
				}),
			],
			tracesSampleRate: 0.1,
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
			tracePropagationTargets: ["localhost", /^\/api\//],
		});
	}
};
