<script setup lang="ts">
import {
	breakpointsTailwind,
	useBreakpoints,
	watchDebounced,
} from "@vueuse/core";
import { NDataTable, NPagination, useMessage, useNotification } from "naive-ui";
import { storeToRefs } from "pinia";
import { accessKeys } from "server/schema";
import { computed, onMounted, ref, watch } from "vue";
import BAccessDataFilter from "@/components/access-data/BAccessDataFilter.vue";
import BAccessDataTags from "@/components/access-data/BAccessDataTags.vue";
import { formatColumns } from "@/module/access-data/format.ts";
import { useAccessStore } from "@/stores/access.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import { useStatsStore } from "@/stores/stats.ts";
import { buildSearchQuery } from "@/utils/redis-query.ts";

const message = useMessage();

const notification = useNotification();
const statsStore = useStatsStore();

const settingsStore = useSettingsStore();
const { aliasRouterIsInitialized, interval } = storeToRefs(settingsStore);

const { accessLog, sortBy, total, loading, count, error } =
	storeToRefs(statsStore);

const form = ref({
	field: "@user:",
	search: null,
});

const breakpoints = useBreakpoints(breakpointsTailwind);
const tableMaxHeight = computed(() => (breakpoints.md.value ? 560 : 280));
const page = ref();
const highlightCount = ref(0);
const pageCount = computed(() => Math.ceil(count.value / 10));
const search = computed(() =>
	buildSearchQuery(form.value.field, form.value.search),
);

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
		try {
			await statsStore.getAccessLogs({
				page: v,
				search: search.value,
				sortBy: sortBy.value,
			});
		} catch (e) {
			message.error((e as Error).message);
		}
	},
	{ debounce: 500, maxWait: 1000 },
);

watchDebounced(
	sortBy,
	async (v) => {
		try {
			await statsStore.getAccessLogs({
				page: page.value,
				search: search.value,
				sortBy: v,
			});
		} catch (e) {
			message.error((e as Error).message);
		}
	},
	{ debounce: 500, maxWait: 1000 },
);

watchDebounced(
	form,
	async () => {
		page.value = 1;
		await statsStore.getAccessLogs({
			page: page.value,
			search: search.value,
			sortBy: sortBy.value,
		});
	},
	{ debounce: 500, maxWait: 1000, deep: true },
);

const accessStore = useAccessStore();
const { value, status, paused } = storeToRefs(accessStore);

function handlePause() {
	accessStore.setPaused(!paused.value);
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
	value,
	async (v) => {
		if (!v) return;

		if (typeof v?.changedLinesCount !== "number" || v.changedLinesCount <= 0)
			return;
		console.log(`Received ${v.changedLinesCount} new log entries`);

		if (page.value === 1 || !page.value) {
			try {
				await statsStore.getAccessLogs({
					page: page.value,
					search: search.value,
					sortBy: sortBy.value,
				});
			} finally {
				highlightCount.value = v.changedLinesCount;

				setTimeout(() => {
					highlightCount.value = 0;
				}, 1500);
			}
		}
	},
	{ debounce: interval, flush: "post" },
);

onMounted(async () => {
	try {
		await statsStore.getAccessLogs();
	} catch (e) {
		message.error((e as Error).message);
	}

	if (!aliasRouterIsInitialized.value) {
		await settingsStore.getAliases();
	}
});
</script>

<template>
  <div class="access-data flex flex-col gap-2">
    <BAccessDataTags
        v-bind="{ total, count, pause: paused, status }"
        @handlePause="handlePause"
    />

    <BAccessDataFilter
        v-model="form"
        @reset="handleReset"
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