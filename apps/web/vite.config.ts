import vue from "@vitejs/plugin-vue";
import postcssCalc from "postcss-calc";
import postcssFor from "postcss-for";
import postcssSimpleVars from "postcss-simple-vars";
import UnoCSS from "unocss/vite";
import VueRouter from "unplugin-vue-router/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), VueRouter(), UnoCSS()],
	css: {
		postcss: {
			plugins: [postcssSimpleVars(), postcssFor(), postcssCalc({})],
		},
	},
});
