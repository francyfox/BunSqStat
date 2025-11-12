import { SQUID_FORMAT_MAP, SQUID_LOG_FORMAT_VARIANT } from "./consts";
import { MOCK_DEFAULT_LOGS } from "./mock";
import { TRANSFORMS } from "./transform";
import { normalizeFormat, parseFormatString } from "./utils";

export const CACHE_MAP = new Map([]);

export function buildFormat(format: string) {
	if (CACHE_MAP.has(format)) return CACHE_MAP.get(format);
	const normalize = normalizeFormat(format);
	const { splited, combinedIndexes } = () => {
		const splited = normalize.split(/ /);
		return {
			splited,
			combinedIndexes: splited.reduce((acc, i, index) => {
				if (i.includes("/")) acc.push(index);
				return acc;
			}, []),
		};
	};
	const formatMap = normalize.split(/ /).map((i) => {
		const formatItem = findToken(i);

		// if (!formatItem)
		// 	throw new Error(`Invalid log format: token ${i} not found`);

		return formatItem;
	});

	CACHE_MAP.set(format, formatMap);

	return formatMap;
}

export function findToken(token: string) {
	return SQUID_FORMAT_MAP.find((j) => j.token === token);
}

export function logLineParser(
	line: string,
	format: string = SQUID_LOG_FORMAT_VARIANT.squid,
) {
	const formatMap = buildFormat(format);
	const splitLine = line.split(/\s+/);
	console.log(splitLine);
	console.log(splitLine.length);

	return formatMap.reduce((acc, { field, transform }, index) => {
		if (transform) {
			if (!TRANSFORMS[transform])
				throw new Error(`Unknown transform fn "${transform}"`);

			acc[field] = TRANSFORMS[transform](splitLine[index]);

			return acc;
		}
		acc[field] = splitLine[index];

		return acc;
	}, {});
}

function test(count) {
	let middle = 0;

	for (let i = 0; i < count; i++) {
		const start = performance.now();
		const output = MOCK_DEFAULT_LOGS.map((i) => logLineParser(i));
		console.log(output);
		const end = performance.now();

		middle += end - start;

		if (i === 1) {
			console.log("Cold:", middle);
		}

		if (i === 2) {
			console.log("Hot:", middle);
		}
	}

	console.log("Middle:", middle / count);
}

test(1);
