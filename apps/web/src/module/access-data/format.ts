// @ts-nocheck
import { type DataTableColumns, NTag, NTooltip } from "naive-ui";
import type { TAccessLog } from "server/schema";
import { h } from "vue";
import BCopy from "@/components/BCopy.vue";
import { useDayjs } from "@/composables/dayjs.ts";
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
	const dayjs = useDayjs();

	switch (column) {
		case "timestamp":
			return {
				width: 120,
				render(row) {
					return h(
						NTooltip,
						{
							trigger: "hover",
						},
						{
							default: () => row[column],
							trigger: () =>
								dayjs(Number(row[column]) * 1000).format("HH:mm:ss DD/MM"),
						},
					);
				},
			};

		case "duration":
			return {
				width: 100,
				render(row) {
					const { value, type } = formatDuration(row[column]);
					return h(NTag, { type, size: "small" }, () => value);
				},
			};

		case "clientIP":
			return {
				width: 130,
				render(row) {
					return h(
						NTag,
						{ type: "info", size: "small", bordered: false },
						() => row[column],
					);
				},
			};

		case "resultType":
			return {
				width: 140,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					const type = getResultType(row[column]);
					return h(NTag, { type, size: "small" }, () => row[column]);
				},
			};

		case "resultStatus":
			return {
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

		case "method":
			return {
				width: 90,
				render(row) {
					const type = getMethodColor(row[column]);
					return h(
						NTag,
						{ type, size: "small", strong: true },
						() => row[column],
					);
				},
			};

		case "url":
			return {
				minWidth: 200,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					return h(BCopy, { text: row[column] });
				},
			};

		case "user":
			return {
				width: 140,
				ellipsis: {
					tooltip: true,
				},
				render(row) {
					if (row[column] === "-" || !row[column]) {
						return h(
							NTag,
							{ type: "default", size: "small" },
							() => "Anonymous",
						);
					}
					return row[column];
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
					return row[column];
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
	return data.map((column, index) => {
		return {
			key: column,
			position: index,
			title: pascalToKebabCase(column).toUpperCase(),
			...accessColumnAttributes(column),
		};
	});
}
