<script setup lang="ts">
import { Time } from "@vicons/ionicons5";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { NDataTable, NFlex, NMarquee, NTag, NTooltip } from "naive-ui";
import type { TAccessLogMetricsResponse } from "server/schema";
import { computed, h } from "vue";
import BCopy from "@/components/BCopy.vue";
import { useDayjs } from "@/composables/dayjs.ts";
import { formatBytes, formatMilliseconds } from "@/utils/string.ts";

const breakpoints = useBreakpoints(breakpointsTailwind);
const dayjs = useDayjs();
const { users = [] } = defineProps<{
	users?: TAccessLogMetricsResponse["users"];
}>();

const scroll = computed(() => (breakpoints.xl.value ? undefined : 1200));

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
		key: "lastActivity",
		title: "Activity",
		width: 180,
		sorter: (row1: any, row2: any) => row1.lastActivity - row2.lastActivity,
		ellipsis: {
			tooltip: true,
		},
		render: (row: any) => {
			const secondsAgo = dayjs().diff(row.lastActivity, "s");
			const isOnline = secondsAgo < 300;
			const relativeTime = dayjs(row.lastActivity).fromNow();
			return h(NFlex, { gap: 1, wrap: false }, () => [
				h(
					NTag,
					{
						type: isOnline ? "success" : "default",
						size: "small",
						bordered: false,
					},
					isOnline ? "Online" : "Offline",
				),
				h(
					NTooltip,
					{ placement: "bottom", trigger: "click" },
					{
						trigger: () => h(Time, { class: "flex flex-shrink-0 size-5" }),
						default: () => dayjs(row.lastActivity).format("HH:mm:ss DD/MM"),
					},
				),
				h(NMarquee, { speed: 20 }, () =>
					h("div", { class: "mr-1" }, relativeTime),
				),
			]);
		},
	},
	{
		key: "clientIP",
		title: "IP",
		render(row) {
			return h(NTag, { type: "info", size: "small", bordered: false }, () =>
				row["clientIP"].replaceAll("_", "."),
			);
		},
	},
	{
		key: "currentSpeed",
		title: "Current Speed",
		sorter: (row1: any, row2: any) => row1.currentSpeed - row2.currentSpeed,
		defaultSortOrder: "descend",
		render: (row: any) => {
			const speed = formatBytes(row.currentSpeed);
			return `${speed}/s`;
		},
	},
	{
		key: "speed",
		title: "Middle speed",
		sorter: (row1: any, row2: any) => row1.speed - row2.speed,
		render: (row: any) => {
			const speed = formatBytes(row.speed);
			return `${speed}/s`;
		},
	},
	{
		key: "lastRequestUrl",
		title: "Last Url",
		ellipsis: {
			tooltip: true,
		},
		render(row) {
			return h(BCopy, { text: row["lastRequestUrl"] });
		},
	},
	{
		key: "totalBytes",
		title: "Bytes",
		sorter: (row1: any, row2: any) => row1.totalBytes - row2.totalBytes,
		render: (row: any) => {
			const formatted = formatBytes(row["totalBytes"]);
			return h(
				NTag,
				{ type: "info", size: "small", bordered: false },
				() => formatted,
			);
		},
	},
	{
		key: "totalDuration",
		title: "Duration",
		render: (row: any) => formatMilliseconds(row.totalDuration),
	},
]);
</script>

<template>
  <NDataTable
      :columns="columns"
      :data="users"
      :bordered="false"
      :max-height="300"
      :scroll-x="scroll"
      size="large"

  />
</template>

<style scoped>

</style>