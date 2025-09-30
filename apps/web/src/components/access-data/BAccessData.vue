<script setup lang="ts">
import {
	breakpointsTailwind,
	useBreakpoints,
	useWebSocket,
	watchDebounced,
} from "@vueuse/core";
import { NDataTable, NPagination, useNotification } from "naive-ui";
import { storeToRefs } from "pinia";
import { accessKeys } from "server/schema";
import { computed, ref, watch } from "vue";
import BAccessDataFilter from "@/components/access-data/BAccessDataFilter.vue";
import BAccessDataTags from "@/components/access-data/BAccessDataTags.vue";
import { WS_URL } from "@/consts.ts";
import { formatColumns } from "@/module/access-data/format.ts";
import { useStatsStore } from "@/stores/stats.ts";
import { buildSearchQuery } from "@/utils/redis-query.ts";

const notification = useNotification();
const statsStore = useStatsStore();
const { accessLog, sortBy, total, loading, count, error } =
	storeToRefs(statsStore);

const form = ref({
	field: "@user:",
	search: null,
});

const breakpoints = useBreakpoints(breakpointsTailwind);
const tableMaxHeight = computed(() => (breakpoints.md.value ? 560 : 280));
const interval = ref(300);
const pause = ref(false);
const page = ref();
const highlightCount = ref(0);
const pageCount = computed(() => Math.ceil(count.value / 10));
const search = computed(() =>
	buildSearchQuery(form.value.field, form.value.search),
);

await statsStore.getAccessLogs();

const columns = computed(() => formatColumns(accessKeys as any));
function rowClassName(row: any, index) {
	if (index < highlightCount.value) {
		return "highlight";
	}
}

watch(error, (v) => {
	notification.error({
		content: v,
		closable: true,
		duration: 5000,
	});
});
watchDebounced(
	page,
	async (v: number) => {
		await statsStore.getAccessLogs({
			page: v,
			search: search.value,
			sortBy: sortBy.value,
		});
	},
	{ debounce: 500, maxWait: 1000 },
);

watchDebounced(
	sortBy,
	async (v) => {
		await statsStore.getAccessLogs({
			page: page.value,
			search: search.value,
			sortBy: v,
		});
	},
	{ debounce: 500, maxWait: 1000 },
);

watchDebounced(
	form,
	async (v) => {
		console.log(sortBy.value);
		page.value = 1;
		await statsStore.getAccessLogs({
			page: page.value,
			search: search.value,
			sortBy: sortBy.value,
		});
	},
	{ debounce: 500, maxWait: 1000, deep: true },
);

const { data, status, close, open } = useWebSocket(`${WS_URL}/ws/access-logs`, {
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

function handlePause() {
	pause.value = !pause.value;

	if (pause.value) {
		close();
	} else {
		open();
	}
}

async function handleReset() {
	form.value = {
		field: "@user",
		search: null,
	};
	sortBy.value = "timestamp,DESC";

	await statsStore.getAccessLogs({
		page: page.value,
		search: search.value,
		sortBy: sortBy.value,
	});
}

watchDebounced(
	data,
	async (v) => {
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
		)
			return;
		console.log(`Received ${value.changedLinesCount} new log entries`);

		if (page.value === 1 || !page.value) {
			try {
				await statsStore.getAccessLogs({
					page: page.value,
					search: search.value,
					sortBy: sortBy.value,
				});
			} finally {
				highlightCount.value = value.changedLinesCount;

				setTimeout(() => {
					highlightCount.value = 0;
				}, 1500);
			}
		}
	},
	{
		debounce: interval,
	},
);
</script>

<template>
  <div class="access-data flex flex-col gap-5">
    <BAccessDataFilter
        v-model="form"
        @reset="handleReset"
    />

    <BAccessDataTags
        v-model:interval="interval"
        v-bind="{ total, count, pause, status }"
        @handlePause="handlePause"
    />

    <NDataTable
        :columns="columns"
        :data="accessLog"
        :max-height="tableMaxHeight"
        :loading="loading"
        :row-class-name="rowClassName"
        :scroll-x="1420"
    />
    <NPagination
        v-model:page="page"
        :page-count="pageCount"
        simple
        size="large"
    />
  </div>
</template>

<style>
.highlight > .n-data-table-td {
  animation-name: highlight;
  animation-duration: 1s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: 1;
}

@keyframes highlight {
  0% {
    background-color: var(--n-merged-td-color);
  }
  50% {
    background-color: var(--c-bg-dark);
  }
  100% {
    background-color: var(--n-merged-td-color);
  }
}
</style>