<script setup lang="ts">
import { Close, Time } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { useFuse } from "@vueuse/integrations/useFuse";
import {
	type DataTableColumns,
	NButton,
	NDataTable,
	NFlex,
	NInput,
	NMarquee,
	NTag,
	NTooltip,
} from "naive-ui";
import { storeToRefs } from "pinia";
import type { TAccessLogMetricsResponse } from "server/schema";
import { computed, h, ref } from "vue";
import BCopy from "@/components/BCopy.vue";
import { useDayjs } from "@/composables/dayjs.ts";
import { useSettingsStore } from "@/stores/settings.ts";
import { formatBytes, formatMilliseconds } from "@/utils/string.ts";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const breakpoints = useBreakpoints(breakpointsTailwind);
const dayjs = useDayjs();

const settingsStore = useSettingsStore();
const { aliasRouterIsInitialized } = storeToRefs(settingsStore);

const { users = [] } = defineProps<{
	users?: TAccessLogMetricsResponse["users"];
}>();

const aliasUsers = computed(() =>
	users.map((i) => {
		const router = computed(() =>
			aliasRouterIsInitialized.value
				? settingsStore.getAliasByIp(i?.clientIP)?.payload
				: null,
		);

		const { user, ...item } = i;

		return {
			user: router.value || i.user,
			...item,
		};
	}),
);

const search = ref("");

const { results } = useFuse(search, aliasUsers, {
	matchAllWhenSearchEmpty: true,
	fuseOptions: {
		isCaseSensitive: false,
		keys: ["user"],
	},
});

const filteredUsers = computed(() => results.value.map((i) => i.item));

const scroll = computed(() => (breakpoints.xl.value ? undefined : 1200));

function handleReset() {
	search.value = "";
}

const columns = computed<DataTableColumns<any>>(() => [
	{
		key: "user",
		title: t('userColumn'),
		minWidth: 80,
		maxWidth: 300,
		width: 140,
		resizable: true,
		fixed: breakpoints.md.value ? "left" : false,
		ellipsis: {
			tooltip: true,
		},
		render(row: any) {
			if (row.user === "-" || !row.user) {
				return h(NTag, { type: "default", size: "small" }, () => t('anonymous'));
			}

			return row.user;
		},
	},
	{
		key: "lastActivity",
		title: t('activityColumn'),
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
					() => (isOnline ? t('onlineStatus') : t('offlineStatus')),
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
		title: t('ipColumn'),
		render(row) {
			return h(NTag, { type: "info", size: "small", bordered: false }, () =>
				row["clientIP"]?.replaceAll("_", "."),
			);
		},
	},
	{
		key: "currentSpeed",
		title: t('currentSpeedColumn'),
		sorter: (row1: any, row2: any) => row1.currentSpeed - row2.currentSpeed,
		defaultSortOrder: "descend",
		render: (row: any) => {
			const speed = formatBytes(row.currentSpeed);
			return `${speed}/s`;
		},
	},
	{
		key: "speed",
		title: t('middleSpeedColumn'),
		sorter: (row1: any, row2: any) => row1.speed - row2.speed,
		render: (row: any) => {
			const speed = formatBytes(row.speed);
			return `${speed}/s`;
		},
	},
	{
		key: "lastRequestUrl",
		title: t('lastUrlColumn'),
		ellipsis: {
			tooltip: true,
		},
		render(row) {
			return h(BCopy, { text: row["lastRequestUrl"] });
		},
	},
	{
		key: "totalBytes",
		title: t('bytesColumn'),
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
		title: t('durationColumn'),
		render: (row: any) => formatMilliseconds(row.totalDuration),
	},
]);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 max-w-sm">
      <NInput
          v-model:value="search"
          size="large"
          :placeholder="t('userSearchPlaceholder')"
      />

      <NButton
          type="error"
          size="large"
          @click="handleReset"
      >
        <Icon :size="24">
          <Close />
        </Icon>
      </NButton>
    </div>

    <NDataTable
        :columns="columns"
        :data="filteredUsers"
        :bordered="false"
        :max-height="300"
        :scroll-x="scroll"
        size="large"
    />
  </div>

</template>

<style scoped>

</style>