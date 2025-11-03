// @ts-check

import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import starlightChangelogs, {
	makeChangelogsSidebarLinks,
} from "starlight-changelogs";
import UnoCSS from "unocss/astro";

const googleAnalyticsId = "GTM-PWXSZLDZ";
// https://astro.build/config
export default defineConfig({
	site: "https://bunsqstat.shalotts.site",
	integrations: [
		UnoCSS(),
		starlight({
			title: "🐙 BunSqStat",
			defaultLocale: "root",
			plugins: [starlightChangelogs()],
			customCss: ["./src/assets/index.css"],
			head: [
				{
					tag: "noscript",
					content: `
                  <!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${googleAnalyticsId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
                  
                  `,
				},
				{
					tag: "script",
					content: `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${googleAnalyticsId}');
        `,
				},
			],
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
				...makeChangelogsSidebarLinks([
					{
						type: "all",
						base: "changelog",
						label: "All versions",
					},
				]),
			],
		}),
	],
	adapter: vercel({
		webAnalytics: {
			enabled: true,
		},
	}),
});
