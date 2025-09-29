<script setup lang="ts">
import { NDataTable } from "naive-ui";
import type { TAccessLogMetricsResponse } from "server/schema";
import { computed } from "vue";
import BCardMetric from "@/components/BCardMetric.vue";
import { formatBytes } from "@/utils/string.ts";

const { users = [] } = defineProps<{
	users?: TAccessLogMetricsResponse["users"];
}>();

const columns = computed(() => [
	{
		key: "user",
		title: "User",
		render(row: any) {
			const username = row.user === "-" ? "Anonymous" : row.user;
			return username;
		},
	},
	{
		key: "speed",
		title: "Speed",
		sorter: (row1: any, row2: any) => row1.speed - row2.speed,
		defaultSortOrder: "descend",
		render: (row: any) => {
			const speed = formatBytes(row.speed);
			return `${speed}/s`;
		},
	},
]);
</script>

<template>
  <BCardMetric>
    <NDataTable
        :columns="columns"
        :data="users"
        :bordered="false"
        size="large"
    />
  </BCardMetric>
</template>

<style scoped>

</style>