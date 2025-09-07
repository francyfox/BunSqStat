<script setup lang="ts">
import { InformationCircle } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { watchDebounced } from "@vueuse/core";
import {
	NDataTable,
	NForm,
	NInput,
	NPagination,
	NSelect,
	NTag,
	NTooltip,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { accessKeys } from "server/schema";
import { computed, ref } from "vue";
import { formatColumns } from "@/module/access-data/format.ts";
import { useStatsStore } from "@/stores/stats.ts";

const statsStore = useStatsStore();
const { accessLog, total, loading, count } = storeToRefs(statsStore);

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
const pageCount = computed(() => Math.ceil(count.value / 10));
const search = computed(() =>
	form.value.search ? `${form.value.field}${form.value.search}` : "*",
);

await statsStore.getAccessLogs();

const columns = computed(() => formatColumns(accessKeys as any));

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
</script>

<template>
  <div class="access-data flex flex-col gap-5">
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
          This input use for <a target="_blank" rel="noopener" href="https://redis.io/docs/latest/develop/ai/search-and-query/query/" class="c-amber underline">redis query</a> like <NTag size="tiny">@user: fox</NTag>
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