<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import { NDataTable, NPagination, NTag } from "naive-ui";
import { storeToRefs } from "pinia";
import { accessKeys } from "server/schema";
import { computed, ref } from "vue";
import { useStatsStore } from "@/stores/stats.ts";
import { pascalToKebabCase } from "@/utils/string.ts";

const statsStore = useStatsStore();
const { accessLog, total } = storeToRefs(statsStore);

const page = ref();
const pageCount = computed(() => Math.ceil(total.value / 10));

await statsStore.getAccessLogs();

const columns = computed(() =>
	accessKeys.map((i) => {
		return { key: i, title: pascalToKebabCase(i).toUpperCase() };
	}),
);

watchDebounced(
	page,
	async (v: number) => {
		await statsStore.getAccessLogs({ page: v });
	},
	{ debounce: 500, maxWait: 1000 },
);
</script>

<template>
  <div class="access-data flex flex-col gap-5">
    <div class="flex gap-2">
      <NTag>
        Total Records: {{ total }}
      </NTag>

      <NTag>
        Show: {{ accessLog.length }}
      </NTag>
    </div>

    <n-data-table
        :columns="columns"
        :data="accessLog"
        :max-height="560"
    />
    <n-pagination
        v-model:page="page"
        :page-count="pageCount"
        show-quick-jumper
        size="large"
    />
  </div>
</template>

<style scoped>

</style>