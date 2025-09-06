import type { DataTableColumns } from "naive-ui";
import { NTag } from "naive-ui";
import type { TAccessLog } from "server/schema";
import { useDayjs } from "@/composables/dayjs.ts";
import { pascalToKebabCase } from "@/utils/string.ts";

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
export function accessColumnAttributes(
	column: keyof TAccessLog,
): ArrayElement<DataTableColumns> {
	const dayjs = useDayjs();

	switch (column) {
		case "timestamp":
			return {
				width: 160,
				render(row) {
					return dayjs(Number(row[column])).format("HH:mm:ss DD/MM/YYYY");
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
	return data.map((column) => {
		return {
			key: column,
			title: pascalToKebabCase(column).toUpperCase(),
			...accessColumnAttributes(column),
		};
	});
}
