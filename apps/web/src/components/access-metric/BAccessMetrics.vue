<script setup lang="ts">
import { useWebSocket, watchDebounced } from "@vueuse/core";
import { NTabPane, NTabs, useNotification } from "naive-ui";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BAccessMetricFilter from "@/components/access-metric/BAccessMetricFilter.vue";
import BTabActual from "@/components/access-metric/BTabActual.vue";
import BTabLimit from "@/components/access-metric/BTabLimit.vue";
import { WS_URL } from "@/consts.ts";
import { useStatsStore } from "@/stores/stats.ts";

const route = useRoute();
const router = useRouter();
const notification = useNotification();

const statsStore = useStatsStore();

const form = ref({
	limit: 50,
	time: undefined,
});

const tab = ref("actual");

await statsStore.getAccessMetrics();

function handleTabChange(tab: string) {
	router.push({ name: route.name, hash: `#${tab}` });
}

watchDebounced(
	form,
	async (v) => {
		const { limit, time: [startTime, endTime] = [] } = v;

		await statsStore.getAccessMetrics({
			limit,
			startTime,
			endTime,
		});
	},
	{
		deep: true,
		debounce: 500,
	},
);

watch(
	() => route.hash,
	(v) => {
		tab.value = v ? v.replace("#", "") : "actual";
	},
);

const { data } = useWebSocket(`${WS_URL}/ws/access-logs`, {
	autoReconnect: {
		retries: 3,
		delay: 1000,
		onFailed() {
			notification.error({
				content: "Failed to connect WebSocket after 3 retries",
			});
		},
	},
});

watchDebounced(data, async (v) => {
	if (!v) return;
	let value: any;
	try {
		value = JSON.parse(v);
	} catch (_) {
		// Ignore non-JSON messages
		return;
	}

	if (
		typeof value?.changedLinesCount !== "number" ||
		value.changedLinesCount <= 0
	) {
		return;
	}
	console.log(`Received ${value.changedLinesCount} new log entries`);

	await statsStore.getAccessMetrics({
		limit: form.value.limit,
		startTime: form.value.time ? form.value.time[0] : undefined,
		endTime: form.value.time ? form.value.time[1] : undefined,
	});
});

onMounted(() => {
	if (route.hash) {
		tab.value = route.hash.replace("#", "");
	}
});

onUnmounted(() => {
	window.location.hash = "";
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <BAccessMetricFilter
        v-model="form"
    />

    <NTabs
        v-model:value="tab"
        type="line"
        size="large"
        @update:value="handleTabChange"
        animated
    >
      <NTabPane name="actual" tab="By time">
        <BTabActual
            v-model="form"
        />
      </NTabPane>

      <NTabPane name="per-n" tab="By limit">
        <BTabLimit />
      </NTabPane>
    </NTabs>
  </div>
</template>

<style lang="postcss" scoped></style>