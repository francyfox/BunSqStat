import {
	defineConfig,
	transformerDirectives,
	transformerVariantGroup,
} from "unocss";

export default defineConfig({
	transformers: [transformerDirectives(), transformerVariantGroup()],
	theme: {
		containers: {
			default: {
				center: true,
			},
		},
	},
});
