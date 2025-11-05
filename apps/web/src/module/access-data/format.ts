// @ts-nocheck

import { breakpointsTailwind, useBreakpoints } from "@vueuse/core";
import { type DataTableColumns, NTag, NTooltip } from "naive-ui";
import { storeToRefs } from "pinia";
import type { TAccessLog } from "server/schema";
import { computed, h } from "vue";
import BCopy from "@/components/BCopy.vue";
import { useSettingsStore } from "@/stores/settings.ts";
import { useStatsStore } from "@/stores/stats.ts";
import { getDate } from "@/utils/date.ts";
import {
	formatBytes,
	formatDuration,
	pascalToKebabCase,
} from "@/utils/string.ts";

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

function getStatusType(status: string): string {
	const code = Number(status);
	if (code >= 200 && code < 300) return "success";
	if (code >= 300 && code < 400) return "info";
	if (code >= 400 && code < 500) return "warning";
	if (code >= 500) return "error";
	return "default";
}

function getResultType(resultType: string): string {
	if (resultType.includes("HIT")) return "success";
	if (resultType.includes("MISS")) return "warning";
	if (resultType.includes("DENIED")) return "error";
	if (resultType.includes("TUNNEL")) return "info";
	return "default";
}

function getMethodColor(method: string): string {
	switch (method.toUpperCase()) {
		case "GET":
			return "success";
		case "POST":
			return "info";
		case "PUT":
			return "warning";
		case "DELETE":
			return "error";
		case "CONNECT":
			return "info";
		default:
			return "default";
	}
}

function getHierarchyTypeColor(type: string): string {
	if (type.includes("DIRECT")) return "success";
	if (type.includes("NONE")) return "warning";
	return "info";
}

export function accessColumnAttributes(
	column: keyof TAccessLog,
): ArrayElement<DataTableColumns> {
	const settingsStore = useSettingsStore();
	const { aliasRouterIsInitialized } = storeToRefs(settingsStore);
	const breakpoints = useBreakpoints(breakpointsTailwind);

	switch (column) {
		case "timestamp":
			return {
				order: 0,
				width: 125,
				fixed: breakpoints.md.value ? "left" : false,
				defaultSortOrder: "descend",
				render(row) {
					return h(
						NTooltip,
						{
							trigger: "hover",
						},
						{
							default: () => row[column],
							trigger: () => getDate(row[column]),
						},
					);
				},
			};

		case "user":
			return {
				order: 1,
				minWidth: 80,
				maxWidth: 300,
				width: 140,
				resizable: true,
				fixed: breakpoints.md.value ? "left" : false,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					const router = computed(() =>
						aliasRouterIsInitialized.value
							? settingsStore.getAliasByIp(row["clientIP"])?.payload
							: null,
					);

					if (router.value) return router.value;

					if (row[column] === "-" || !row[column]) {
						return h(
							NTag,
							{ type: "default", size: "small" },
							() => "Anonymous",
						);
					}
					return router.value || row[column];
				},
			};

		case "url":
			return {
				order: 2,
				minWidth: 200,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					return h(BCopy, { text: row[column] });
				},
			};

		case "duration":
			return {
				order: 3,
				width: 100,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					const { value, type } = formatDuration(row[column]);
					return h(NTag, { type, size: "small" }, () => value);
				},
			};

		case "resultStatus":
			return {
				order: 4,
				width: 80,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					const type = getStatusType(row[column]);
					return h(NTag, { type, size: "small" }, () => row[column]);
				},
			};

		case "bytes":
			return {
				order: 5,
				width: 90,
				render(row) {
					const formatted = formatBytes(row[column]);
					const type = Number(row[column]) > 1048576 ? "warning" : "default";
					return h(
						NTag,
						{ type, size: "small", bordered: false },
						() => formatted,
					);
				},
			};

		case "resultType":
			return {
				order: 6,
				width: 140,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					const type = getResultType(row[column]);
					return h(NTag, { type, size: "small" }, () => row[column]);
				},
			};

		case "method":
			return {
				order: 7,
				width: 100,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					const type = getMethodColor(row[column]);
					return h(
						NTag,
						{ type, size: "small", strong: true },
						() => row[column],
					);
				},
			};

		case "clientIP":
			return {
				order: 8,
				width: 130,
				render(row) {
					return h(NTag, { type: "info", size: "small", bordered: false }, () =>
						row[column].replaceAll("_", "."),
					);
				},
			};

		case "hierarchyType":
			return {
				width: 120,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					const type = getHierarchyTypeColor(row[column]);
					return h(NTag, { type, size: "small" }, () => row[column]);
				},
			};

		case "hierarchyHost":
			return {
				width: 140,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					if (row[column] === "-" || row[column] === "0.0.0.0") {
						return h(
							NTag,
							{ type: "warning", size: "small", bordered: false },
							() => "Local",
						);
					}
					return row[column].replaceAll("_", ".");
				},
			};

		case "contentType":
			return {
				width: 120,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					if (row[column] === "-" || !row[column]) {
						return "-";
					}

					return h(NTag, { size: "small", bordered: false }, () => row[column]);
				},
			};

		default:
			return {
				render(row) {
					return row[column];
				},
			};
	}
}

export function formatColumns(data: Array<keyof TAccessLog>): DataTableColumns {
	const store = useStatsStore();

	return data
		.filter((column) => column !== "domain")
		.map((column, index) => {
			return {
				key: column,
				position: index,
				title: pascalToKebabCase(column).toUpperCase(),
				...accessColumnAttributes(column),
				sorter: true,
				customNextSortOrder: (order) => {
					if (typeof order === "string") {
						store.setSortBy(column, order);
					}
					return order === "ascend" ? "descend" : "ascend";
				},
			};
		})
		.sort((a, b) => a?.order > b?.order);
}
