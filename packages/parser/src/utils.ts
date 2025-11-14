/**
 * Утилиты для работы с динамическими паттернами Squid logformat
 */

export function normalizeFormat(format: string): string {
	return format.replace(/%["[\/#']?(?:-?\d+)?/g, "%");
}

/**
 * Проверяет, является ли токен динамическим header токеном
 * @example "%{User-Agent}>h" => true
 */
export function isDynamicHeaderToken(token: string): boolean {
	return /^%\{[^}]+\}[><]h$/.test(token);
}

/**
 * Извлекает имя header из динамического токена
 * @example "%{User-Agent}>h" => "User-Agent"
 */
export function extractHeaderName(token: string): string {
	const match = token.match(/^%\{([^}]+)\}/);
	return match ? match[1] : "";
}

/**
 * Извлекает направление header (request '>' или response '<')
 * @example "%{User-Agent}>h" => ">"
 */
export function extractHeaderDirection(token: string): ">" | "<" {
	return token.includes(">h") ? ">" : "<";
}

/**
 * Генерирует имя поля для динамического header
 * @example "%{User-Agent}>h" => "requestHeader_UserAgent"
 * @example "%{Content-Type}<h" => "responseHeader_ContentType"
 */
export function generateHeaderFieldName(token: string): string {
	const headerName = extractHeaderName(token);
	const direction = extractHeaderDirection(token);
	const prefix = direction === ">" ? "requestHeader" : "responseHeader";
	const safeName = headerName.replace(/[^a-zA-Z0-9]/g, "");
	return `${prefix}_${safeName}`;
}

/**
 * Проверяет, является ли токен note токеном с параметром
 * @example "%{myNote}note" => true
 */
export function isDynamicNoteToken(token: string): boolean {
	return /^%\{[^}]+\}note$/.test(token);
}

/**
 * Извлекает имя note из токена
 * @example "%{myNote}note" => "myNote"
 */
export function extractNoteName(token: string): string {
	const match = token.match(/^%\{([^}]+)\}note$/);
	return match ? match[1] : "";
}

/**
 * Проверяет, является ли токен SSL токеном
 * @example "%ssl::>sni" => true
 */
export function isSSLToken(token: string): boolean {
	return token.startsWith("%ssl::");
}

/**
 * Проверяет, является ли токен http:: prefixed
 * @example "%http::rm" => true
 */
export function isHTTPPrefixedToken(token: string): boolean {
	return token.startsWith("%http::");
}

/**
 * Удаляет http:: префикс из токена
 * @example "%http::rm" => "%rm"
 */
export function removeHTTPPrefix(token: string): string {
	return token.replace(/^%http::/, "%");
}

/**
 * Проверяет, есть ли у токена encoding префикс
 * @example '%"rm' => true (quoted encoding)
 * @example '%[rm' => true (squid encoding)
 * @example '%#rm' => true (url encoding)
 * @example '%/rm' => true (shell encoding)
 * @example "%'rm" => true (raw encoding)
 */
export function hasEncodingPrefix(token: string): boolean {
	return /^%["\[#\/']/.test(token);
}

/**
 * Извлекает encoding префикс
 * @example '%"rm' => '"'
 */
export function extractEncodingPrefix(token: string): string {
	const match = token.match(/^%(["\[#\/'])/);
	return match ? match[1] : "";
}

/**
 * Удаляет encoding префикс из токена
 * @example '%"rm' => '%rm'
 */
export function removeEncodingPrefix(token: string): string {
	return token.replace(/^%["\[#\/']/, "%");
}

/**
 * Проверяет, есть ли у токена width modifier
 * @example '%010>Hs' => true
 * @example '%-20ru' => true
 */
export function hasWidthModifier(token: string): boolean {
	return /^%["\[#\/']?-?\d+/.test(token);
}

/**
 * Извлекает width modifier
 * @example '%010>Hs' => '010'
 * @example '%-20ru' => '-20'
 */
export function extractWidthModifier(token: string): string {
	const match = token.match(/^%["\[#\/']?(-?\d+)/);
	return match ? match[1] : "";
}

/**
 * Парсит format string и разбивает на токены
 * Обрабатывает сложные случаи:
 * - %ts.%03tu (составной timestamp)
 * - %{Header}>h (динамические headers)
 * - %ssl::>sni (SSL токены)
 * - %http::rm (http prefixed)
 * - %Ss/%03>Hs (composite с delimiter)
 */
export function parseFormatString(format: string): string[] {
	const tokens: string[] = [];
	let i = 0;

	while (i < format.length) {
		if (format[i] !== "%") {
			i++;
			continue;
		}

		let tokenStart = i;
		let tokenEnd = i + 1;

		// Пропускаем encoding prefix
		const prefixes = ["\\", "[", "#", "/", "'"] as const;

		// @ts-ignore
		if (prefixes.includes(format[tokenEnd])) {
			tokenEnd++;
		}

		// Пропускаем width/alignment
		if (format[tokenEnd] === "-") tokenEnd++;
		while (/\d/.test(format[tokenEnd])) {
			tokenEnd++;
		}

		// Обработка %{...} конструкций
		if (format[tokenEnd] === "{") {
			const closeIdx = format.indexOf("}", tokenEnd);
			if (closeIdx !== -1) {
				tokenEnd = closeIdx + 1;
				// Проверяем суффикс (>h, <h, note, etc)
				if (format[tokenEnd] === ">" || format[tokenEnd] === "<") {
					tokenEnd += 2; // +2 для >h или <h
				} else if (format.substring(tokenEnd, tokenEnd + 4) === "note") {
					tokenEnd += 4;
				}
			}
		}
		// Обработка http:: префикса
		else if (format.substring(tokenEnd, tokenEnd + 6) === "http::") {
			tokenEnd += 6;
			// Читаем остальной токен
			while (tokenEnd < format.length && /[a-zA-Z<>]/.test(format[tokenEnd])) {
				tokenEnd++;
			}
		}
		// Обработка ssl:: префикса
		else if (format.substring(tokenEnd, tokenEnd + 5) === "ssl::") {
			tokenEnd += 5;
			while (
				tokenEnd < format.length &&
				/[a-zA-Z<>_:]/.test(format[tokenEnd])
			) {
				tokenEnd++;
			}
		}
		// transport:: префикс
		else if (format.substring(tokenEnd, tokenEnd + 11) === "transport::") {
			tokenEnd += 11;
			while (
				tokenEnd < format.length &&
				/[a-zA-Z<>_:]/.test(format[tokenEnd])
			) {
				tokenEnd++;
			}
		}
		// Обычные токены
		else {
			// Прочитать direction (>, <, [)
			if ([">", "<", "["].includes(format[tokenEnd])) {
				tokenEnd++;
			}
			// Прочитать буквы токена
			while (tokenEnd < format.length && /[a-zA-Z]/.test(format[tokenEnd])) {
				tokenEnd++;
			}
		}

		const token = format.substring(tokenStart, tokenEnd);

		// Специальная обработка %ts.%03tu
		if (
			token === "%ts" &&
			format.substring(tokenEnd, tokenEnd + 6) === ".%03tu"
		) {
			tokens.push("%ts.%03tu");
			i = tokenEnd + 6;
			continue;
		}

		// Специальная обработка composite токенов (например %Ss/%03>Hs)
		// Не объединяем, парсим как отдельные токены
		tokens.push(token);
		i = tokenEnd;
	}

	return tokens;
}
