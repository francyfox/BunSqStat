import { toCamelCase } from "@/utils/string";

export function toPascalCaseObject(obj: any) {
	const result: Record<string, any> = {};

	for (const [key, value] of Object.entries(obj)) {
		result[toCamelCase(key)] = value;
	}

	return result;
}

export type Mutable<T> = {
	-readonly [P in keyof T]: T[P] extends object ? Mutable<T[P]> : T[P];
};
