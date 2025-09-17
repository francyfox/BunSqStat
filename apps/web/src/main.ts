import { createPinia } from "pinia";
import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { routes } from "vue-router/auto-routes";
import "virtual:uno.css";
import "@unocss/reset/tailwind-compat.css";
import "./style.css";
import "vfonts/Lato.css";
import "vfonts/FiraCode.css";
import App from "./App.vue";

const pinia = createPinia();

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

const app = createApp(App);

app.use(router).use(pinia).mount("#app");
