import { createPinia } from "pinia";
import { createApp } from "vue";
import { createI18n } from "vue-i18n"; // Уже есть
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
	fallbackLocale: "en", // Запасной язык
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

app.use(router).use(pinia).use(i18n).mount("#app"); // Добавляем use(i18n)
