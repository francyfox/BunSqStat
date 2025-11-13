import {
	PARSER_ERRORS,
	SQUID_FORMAT_MAP,
	SQUID_LOG_FORMAT_VARIANT,
} from "./consts";
import { MOCK_DEFAULT_LOGS } from "./mock";
import { TRANSFORMS } from "./transform";
import type { IFormatItem } from "./types";
import { normalizeFormat } from "./utils";

interface ICacheMapItem {
	formatMap: IFormatItem[];
	combinedIndexes: number[];
}

export const CACHE_MAP: Map<string, ICacheMapItem> = new Map([]);

export function buildFormat(format: string) {
	if (CACHE_MAP.has(format)) return CACHE_MAP.get(format) as ICacheMapItem;
	const normalize = normalizeFormat(format);
	const normalizeParts = normalize.split(/ /);
	const combinedIndexes: number[] = [];

	const formatMap = normalizeParts.flatMap((i, index) => {
		const formatItem = findToken(i);
		const isCombined = i.includes("/");

		if (!formatItem && !isCombined) {
			throw new Error(`${PARSER_ERRORS.unexpectedFormat} ${i}`);
		}

		if (isCombined) {
			combinedIndexes.push(index);

			return [...i.split("/").map((j) => findToken(j))];
		}

		return formatItem;
	}) as IFormatItem[];

	const result = {
		formatMap,
		combinedIndexes,
	};

	CACHE_MAP.set(format, result);

	return result;
}

export function findToken(token: string) {
	return SQUID_FORMAT_MAP.find((j) => j.token === token);
}

export function logLineParser(
	line: string,
	format: string = SQUID_LOG_FORMAT_VARIANT.squid,
) {
	const { formatMap, combinedIndexes } = buildFormat(format);
	const splitLine = line
		.split(/\s+/)
		.reduce((acc: string[], currentValue, index) => {
			if (combinedIndexes.includes(index)) {
				acc.push(...currentValue.split("/"));
			} else {
				acc.push(currentValue);
			}

			return acc;
		}, []);

	if (formatMap.length !== splitLine.length) {
		throw new Error(PARSER_ERRORS.combinedSlash);
	}

	return formatMap.reduce(
		(acc: Record<string, any>, { transform, field }, index) => {
			if (transform) {
				acc[field] = TRANSFORMS[transform](splitLine[index]);
			} else {
				acc[field] = splitLine[index];
			}
			return acc;
		},
		{},
	);
}

function test(count: number) {
	const testStart = performance.now();
	let middle = 0;

	for (let i = 0; i < count; i++) {
		const start = performance.now();
		const output = MOCK_DEFAULT_LOGS.map((i) => logLineParser(i));
		console.log(output);
		const end = performance.now();

		middle += end - start;

		console.log(`Iteration ${i}: ${end - start}`);
	}

	const testEnd = performance.now();

	console.log("Middle:", middle / count);
	console.log("Total:", testEnd - testStart);
}

test(1);
