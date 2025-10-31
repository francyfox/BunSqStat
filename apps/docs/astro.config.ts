// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import UnoCSS from "unocss/astro";

// https://astro.build/config
export default defineConfig({
	// i18n: {
	// 	locales: ["en", "ru"],
	// 	defaultLocale: "en",
	// },
	// site: "bunsqstat.shalotts.site",
	integrations: [
		UnoCSS(),
		starlight({
			title: "🐙 BunSqStat",
			defaultLocale: "root",
			customCss: ["./src/assets/index.css"],
			locales: {
				root: {
					lang: "en",
					label: "English",
				},
				ru: {
					label: "Russian",
				},
			},
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/francyfox/BunSqStat",
				},
			],
			sidebar: [
				{
					label: "Getting-started",
					autogenerate: { directory: "getting-started" },
				},
				{
					label: "Advanced",
					autogenerate: { directory: "advanced" },
				},
				{
					label: "About",
					autogenerate: { directory: "about" },
				},
			],
		}),
	],
});
