import { createApp } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import { routes } from "vue-router/auto-routes";
import "virtual:uno.css";
import "@unocss/reset/tailwind-compat.css";
import "./style.css";
import "vfonts/Lato.css";
import "vfonts/FiraCode.css";
import App from "./App.vue";

const router = createRouter({
	history: createMemoryHistory(),
	routes,
});

const app = createApp(App);

app.use(router).mount("#app");
