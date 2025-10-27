<script setup lang="ts">
import { Close, LockClosed, LockOpen } from "@vicons/ionicons5";
import { Icon } from "@vicons/utils";
import {
	breakpointsTailwind,
	useBreakpoints,
	watchDebounced,
} from "@vueuse/core";
import {
	type DataTableColumns,
	NButton,
	NDataTable,
	NInput,
	NPagination,
	NTag,
	NTooltip,
	useNotification,
} from "naive-ui";
import { storeToRefs } from "pinia";
import type { TMetricDomainItem } from "server/schema";
import { computed, h } from "vue";
import { useI18n } from "vue-i18n";
import { useDayjs } from "@/composables/dayjs.ts";
import { useDomainStore } from "@/stores/domains.ts";
import { formatBytes, formatMilliseconds } from "@/utils/string.ts";

const { t } = useI18n();
const { domains } = defineProps<{
	domains: TMetricDomainItem[];
}>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const dayjs = useDayjs();
const notification = useNotification();

const domainsStore = useDomainStore();
const { items, loading, error, count, pageCount } = storeToRefs(domainsStore);

const scroll = computed(() => (breakpoints.md.value ? undefined : 920));

const columns = computed<DataTableColumns<any> | any>(() => [
	{
		key: "domain",
		title: t("domainColumn"),
		minWidth: 80,
		maxWidth: 500,
		resizable: true,
		fixed: breakpoints.md.value ? "left" : false,
		ellipsis: {
			tooltip: true,
		},
	},
	{
		width: 100,
		key: "requestCount",
		title: t("requestColumn"),
		ellipsis: {
			tooltip: true,
		},
		defaultSortOrder: "descend",
		sorter: true,
		customNextSortOrder: (order: "ascend" | "descend" | undefined) => {
			if (typeof order === "string") {
				domainsStore.setSortBy("requestCount", order);
			}
			return order === "ascend" ? "descend" : "ascend";
		},
	},
	{
		width: 100,
		key: "bytes",
		title: t("domainBytesColumn"),
		ellipsis: {
			tooltip: true,
		},
		sorter: true,
		customNextSortOrder: (order: "ascend" | "descend" | undefined) => {
			if (typeof order === "string") {
				domainsStore.setSortBy("bytes", order);
			}
			return order === "ascend" ? "descend" : "ascend";
		},
		render: (row: any) => {
			return h(
				NTag,
				{ type: "info", size: "small", bordered: false },
				() => `${formatBytes(row?.bytes)}`,
			);
		},
	},
	{
		key: "duration",
		title: t("domainDurationColumn"),
		order: 3,
		width: 120,
		ellipsis: {
			tooltip: true,
		},
		sorter: true,
		customNextSortOrder: (order: "ascend" | "descend" | undefined) => {
			if (typeof order === "string") {
				domainsStore.setSortBy("duration", order);
			}
			return order === "ascend" ? "descend" : "ascend";
		},
		render: (row: any) => formatMilliseconds(row.duration),
	},
	{
		key: "lastActivity",
		title: t("lastActivityColumn"),
		sorter: true,
		customNextSortOrder: (order: "ascend" | "descend" | undefined) => {
			if (typeof order === "string") {
				domainsStore.setSortBy("lastActivity", order);
			}
			return order === "ascend" ? "descend" : "ascend";
		},
		render(row: any) {
			return h(
				NTooltip,
				{
					trigger: "hover",
				},
				{
					default: () => row?.lastActivity,
					trigger: () =>
						dayjs(Number(row?.lastActivity) * 1000).format("HH:mm:ss DD/MM"),
				},
			);
		},
	},
	{
		width: 120,
		key: "errorsRate",
		title: t("errorsRateColumn"),
		align: "right",
		sorter: true,
		ellipsis: {
			tooltip: true,
		},
		customNextSortOrder: (order: "ascend" | "descend" | undefined) => {
			if (typeof order === "string") {
				domainsStore.setSortBy("errorsRate", order);
			}
			return order === "ascend" ? "descend" : "ascend";
		},
		render: (row: any) => {
			const type = () => {
				if (row?.errorsRate > 80) {
					return "error";
				} else if (row?.errorsRate > 10) {
					return "warning";
				}

				return "info";
			};
			return h(NTag, { type: type(), size: "small", bordered: false }, () =>
				row?.errorsRate.toFixed(2),
			);
		},
	},
	{
		width: 120,
		key: "hasBlocked",
		title: t("blockedColumn"),
		align: "right",
		ellipsis: {
			tooltip: true,
		},
		render: (row: any) =>
			h(NTag, { type: row?.hasBlocked ? "error" : "success" }, () =>
				h(Icon, { size: 16 }, () => h(row?.hasBlocked ? LockClosed : LockOpen)),
			),
	},
]);

async function handleSearch() {
	await domainsStore.getMetricsDomain();
}

async function handleReset() {
	domainsStore.query.search = "";
	await domainsStore.getMetricsDomain();
}

watchDebounced(
	domainsStore.query,
	async () => {
		await domainsStore.getMetricsDomain();
	},
	{
		deep: true,
		debounce: 300,
	},
);
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 max-w-sm">
      <NInput
          v-model:value="domainsStore.query.search"
          size="large"
          :placeholder="t('domainSearchPlaceholder')"
          @change="handleSearch"
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
        :data="domains"
        :scroll-x="scroll"
    />

    <NPagination
        v-model:page="domainsStore.query.page"
        :page-count="pageCount"
        simple
        size="large"
    />
  </div>
</template>

<style scoped>

</style>