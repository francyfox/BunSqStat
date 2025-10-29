// @ts-check

import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	// site: "bunsqstat.shalotts.site",
	integrations: [
		starlight({
			title: "Docs",
			customCss: ["./src/assets/index.css"],
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/francyfox/BunSqStat",
				},
			],
			sidebar: [
				{
					label: "Guides",
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: "Example Guide", slug: "guides/example" },
					],
				},
				{
					label: "Reference",
					autogenerate: { directory: "reference" },
				},
			],
		}),
	],
});
