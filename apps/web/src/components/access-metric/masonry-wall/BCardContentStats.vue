<script setup lang="ts">
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { NDataTable } from "naive-ui";
import { computed } from "vue";
import BCardMetric from "@/components/BCardMetric.vue";
import { formatBytes } from "@/utils/string.ts";

const breakpoints = useBreakpoints(breakpointsTailwind);

const { items } = defineProps<{
	items: {
		contentType: string;
		requestCount: number;
		bytes: number;
		hitRatePercent: number;
	}[];
}>();

const scroll = computed(() => (breakpoints.md.value ? undefined : 460));

const columns = computed(() => [
	{
		key: "contentType",
		title: "Content-Type",
		ellipsis: {
			tooltip: true,
		},
	},
	{
		width: 100,
		key: "requestCount",
		title: "Request",
		ellipsis: {
			tooltip: true,
		},
		sorter: (row1: any, row2: any) => row1.requestCount - row2.requestCount,
		defaultSortOrder: "descend",
	},
	{
		width: 100,
		key: "bytes",
		title: "Bytes",
		ellipsis: {
			tooltip: true,
		},
		sorter: (row1: any, row2: any) => row1.bytes - row2.bytes,
		render: (row: any) => {
			return `${formatBytes(row.bytes)}`;
		},
	},
	{
		width: 80,
		key: "hitRatePercent",
		title: "Hit%",
		sorter: (row1: any, row2: any) => row1.hitRatePercent - row2.hitRatePercent,
		render: (row: any) => {
			return row.hitRatePercent.toFixed(2);
		},
	},
]);
</script>

<template>
  <BCardMetric>
    <NDataTable
        :columns="columns"
        :data="items"
        :bordered="false"
        size="large"
        :max-height="300"
        :scroll-x="scroll"
    />
  </BCardMetric>
</template>

<style scoped>

</style>