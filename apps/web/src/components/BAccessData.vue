<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { useWebSocket, watchDebounced } from "@vueuse/core";
import {
	NDataTable,
	NForm,
	NInput,
	NPagination,
	NSelect,
	NTag,
	NTooltip,
	useNotification,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { accessKeys } from "server/schema";
import { computed, onMounted, ref, watch } from "vue";
import { formatColumns } from "@/module/access-data/format.ts";
import { useStatsStore } from "@/stores/stats.ts";
import { buildSearchQuery } from "@/utils/redis-query.ts";

const notification = useNotification();
const statsStore = useStatsStore();
const { accessLog, total, loading, count, error } = storeToRefs(statsStore);

const fieldOptions = accessKeys.map((key: string) => {
	return {
		label: `@${key}:`,
		value: `@${key}:`,
	};
});

const form = ref({
	field: "@user:",
	search: null,
});
const page = ref();
const highlightCount = ref(1);
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
		});
	},
	{ debounce: 500, maxWait: 1000 },
);

watchDebounced(
	form,
	async (v) => {
		await statsStore.getAccessLogs({
			page: page.value,
			search: search.value,
		});
	},
	{ debounce: 500, maxWait: 1000, deep: true },
);

const { data, status, ws } = useWebSocket(
	"ws://localhost:3000/ws/access-logs",
	{
		autoReconnect: {
			retries: 3,
			delay: 1000,
			onFailed() {
				notification.error({
					content: "Failed to connect WebSocket after 3 retries",
				});
			},
		},
	},
);

onMounted(() => {
	ws.value?.addEventListener("access-logs", (event) => {
		console.log("ss");
	});
});

watch(data, async (v) => {
	const value = JSON.parse(v);
	console.log(value);

	try {
		await statsStore.getAccessLogs({
			page: page.value,
			search: search.value,
		});
	} finally {
		highlightCount.value = value.changedLinesCount;
	}
});
</script>

<template>
  <div class="access-data flex flex-col gap-5">
    {{ status }}
    <NForm :model="form" class="search">
      <div class="max-w-xl flex gap-2">
        <n-select
            v-model:value="form.field"
            placeholder="Select"
            :options="fieldOptions"
            class="w-[200px]"
        />
        <NInput
            v-model:value="form.search"
            placeholder="Search by column"
        />

        <NTooltip placement="bottom" trigger="hover">
          <template #trigger>
            <Icon size="32" class="cursor-pointer">
              <InformationCircle />
            </Icon>
          </template>
          This input use for <a target="_blank" rel="noopener" href="https://redis.io/docs/latest/develop/ai/search-and-query/query/" class="c-amber underline">redis query</a> like <NTag>@user: fox</NTag>
          <br>
          Search by IP: <NTag>192.168.1.1</NTag> (auto-escaped)
          <br>
          Single number: <NTag>200</NTag> → <NTag>[200 200]</NTag>
          <br>
          Number ranges: <NTag>[200 299]</NTag> or <NTag>[0 20]</NTag>
        </NTooltip>
      </div>
    </NForm>
    <div class="flex gap-2">
      <NTag>
        Total Records: {{ total }}
      </NTag>

      <NTag>
        Count: {{ count }}
      </NTag>
    </div>

    <n-data-table
        :columns="columns"
        :data="accessLog"
        :max-height="560"
        :loading="loading"
        :row-class-name="rowClassName"
    />
    <n-pagination
        v-model:page="page"
        :page-count="pageCount"
        show-quick-jumper
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