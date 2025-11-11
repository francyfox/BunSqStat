import * as Sentry from "@sentry/vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";
import "virtual:uno.css";
import "@unocss/reset/tailwind-compat.css";
import "./style.css";
import "vfonts/Lato.css";
import "vfonts/FiraCode.css";

import en from "@repo/i18n/locales/en.json";
import ru from "@repo/i18n/locales/ru.json";

import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import NotFound from "@/pages/not-found.vue";
import App from "./App.vue";

const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

const browserLanguage = navigator.language || navigator.languages[0];
const languageCode = browserLanguage?.split("-")[0] || "en";

const messages = {
	en,
	ru,
};

const i18n = createI18n({
	flatJson: true,
	locale: languageCode,
	fallbackLocale: "en",
	availableLocales: ["en", "ru"],
	messages,
});

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		...[{ path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound }],
		...routes,
	],
});

const app = createApp(App);

Sentry.init({
	environment: "frontend",
	app,
	dsn: "https://d156531d5cf75eb9a43f196ae2177dba@o450533.ingest.us.sentry.io/4510335880265728",
	debug: true,
	tunnel:
		process.env.NODE_ENV === "production"
			? "/api/sentry"
			: "http://localhost:3000/sentry",
	sendDefaultPii: true,
	integrations: [
		Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
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

Sentry.captureException(new Error("test"));

app.use(router).use(pinia).use(i18n).mount("#app");
