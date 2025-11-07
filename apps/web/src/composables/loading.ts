import { useLoadingBar } from "naive-ui";
import type { Ref } from "vue";
import { watch } from "vue";

export function useLoading(loading: Ref<boolean>, error?: Ref<string>) {
	const loadingBar = useLoadingBar();
	watch(loading, (v) => {
		if (v) {
			loadingBar.start();
		} else {
			loadingBar.finish();
		}
	});

	watch(error as any, () => {
		loadingBar.error();
	});
}
