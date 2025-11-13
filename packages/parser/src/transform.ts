import type { TransformFunction } from "./types";

/**
 * Преобразует timestamp из секунд в миллисекунды
 * @example "1699876543.123" => "1699876543123"
 */
export const timestampToMs: TransformFunction = (value: string): string => {
	const ts = parseFloat(value);
	if (Number.isNaN(ts)) return "0";
	return Math.round(ts * 1000).toString();
};

/**
 * Заменяет точки на подчеркивания (для IP адресов в Redis)
 * @example "192.168.1.1" => "192_168_1_1"
 */
export const dotToUnderscore: TransformFunction = (value: string): string => {
	if (value === "-" || !value) return "-";
	return value.replace(/\./g, "_");
};

/**
 * Обратная трансформация: подчеркивания в точки (для Postgres INET)
 * @example "192_168_1_1" => "192.168.1.1"
 */
export const underscoreToDot: TransformFunction = (value: string): string => {
	if (value === "-" || !value) return "0.0.0.0";
	return value.replace(/_/g, ".");
};

/**
 * Преобразует строку в integer
 * @example "12345" => "12345", "invalid" => "0"
 */
export const toInt: TransformFunction = (value: string): string => {
	const num = parseInt(value, 10);
	return Number.isNaN(num) ? "0" : num.toString();
};

/**
 * Нормализует HTTP статус код
 * @example "200" => "200", "invalid" => "0"
 */
export const normalizeStatus: TransformFunction = (value: string): string => {
	const num = parseInt(value, 10);
	if (Number.isNaN(num) || num < 0 || num > 999) return "0";
	return num.toString();
};

/**
 * Извлекает домен из URL
 * @example "http://example.com/path" => "example.com"
 */
export const extractDomain: TransformFunction = (value: string): string => {
	if (value === "-" || !value) return "-";

	try {
		// Если нет протокола, добавляем
		const urlString = value.startsWith("http") ? value : `http://${value}`;
		const url = new URL(urlString);
		return url.hostname || "-";
	} catch {
		// Fallback для невалидных URL
		const match = value.match(/(?:https?:\/\/)?([^/]+)/);
		return match?.[1] || "-";
	}
};

/**
 * Нормализует User-Agent строку (обрезает до разумной длины)
 */
export const normalizeUserAgent: TransformFunction = (
	value: string,
): string => {
	if (value === "-" || !value) return "-";
	// Обрезаем очень длинные UA до 500 символов
	return value.length > 500 ? `${value.substring(0, 500)}...` : value;
};

/**
 * Нормализует URL (обрезает слишком длинные)
 */
export const normalizeURL: TransformFunction = (value: string): string => {
	if (value === "-" || !value) return "-";
	let output = value;
	if (value.endsWith(":443")) {
		output = `https://${value.replace(":443", "")}`;
	}
	if (value.endsWith(":80")) {
		output = `http://${value.replace(":80", "")}`;
	}
	return value.length > 2000 ? `${value.substring(0, 2000)}...` : output;
};

/**
 * Base64 декодирование (для handshake данных)
 */
export const base64Decode: TransformFunction = (value: string): string => {
	if (value === "-" || !value) return "-";
	try {
		return Buffer.from(value, "base64").toString("utf-8");
	} catch {
		return value;
	}
};

/**
 * Маппинг всех доступных трансформаций
 */
export const TRANSFORMS: Record<string, TransformFunction> = {
	timestampToMs,
	dotToUnderscore,
	underscoreToDot,
	toInt,
	normalizeStatus,
	extractDomain,
	normalizeUserAgent,
	normalizeURL,
	base64Decode,
};
