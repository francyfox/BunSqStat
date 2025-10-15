import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import postcssCalc from "postcss-calc";
// @ts-ignore
import postcssFor from "postcss-for";
import postcssSimpleVars from "postcss-simple-vars";
import UnoCSS from "unocss/vite";
import VueRouter from "unplugin-vue-router/vite";
import { defineConfig } from "vite";
// import { analyzer } from "vite-bundle-analyzer";

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), VueRouter(), UnoCSS()],
	css: {
		postcss: {
			plugins: [postcssSimpleVars(), postcssFor(), postcssCalc({})],
		},
	},
	build: {
		cssCodeSplit: true,
		rolldownOptions: {
			output: {
				advancedChunks: {
					groups: [
						{
							name: "utils",
							test: /@vueuse\/core|pinia|dayjs|lodash|date-fns|vueuc|fuse.js|radix3/,
						},
						{
							name: "chartjs",
							test: /chart.js|vue-chartjs/,
						},
						{
							name: "datatable",
							test: /node_modules\/naive-ui\/es\/data-table/,
						},
						{
							name: "ui",
							test: /naive-ui/,
						},
						{
							name: "icons",
							test: /@vicons/,
						},
						{
							name: "vendor",
							test: /vue|vue-router|pinia|pinia-plugin-persistedstate/,
						},
					],
				},
			},
		},
	},
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});
