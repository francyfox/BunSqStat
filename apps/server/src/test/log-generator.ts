import { faker } from "@faker-js/faker";

/**
 * Генератор реалистичных строк логов Squid для тестирования
 */
export class SquidLogGenerator {
	private readonly resultTypes = [
		"TCP_MISS",
		"TCP_HIT",
		"TCP_DENIED",
		"TCP_DENIED_REPLY",
		"NONE_NONE",
	];
	private readonly methods = [
		"GET",
		"POST",
		"CONNECT",
		"PUT",
		"DELETE",
		"HEAD",
		"OPTIONS",
	];
	private readonly hierarchyTypes = ["HIER_DIRECT", "HIER_NONE"];
	private readonly contentTypes = [
		"text/html",
		"text/javascript",
		"text/css",
		"application/json",
		"application/octet-stream",
		"application/json+protobuf",
		"image/png",
		"image/jpeg",
		"image/gif",
		"-",
	];

	private readonly statusCodes = [
		200, 201, 204, 301, 302, 304, 400, 401, 403, 404, 407, 500, 502, 503,
	];
	private readonly userAgents = [
		"sgolota@TP.OIL",
		"vpupkin@TP.OIL",
		"TMP-PTO$@TP.OIL",
		"-",
	];

	private readonly clientIPs = [
		"192.168.10.41",
		"192.168.11.16",
		"192.168.11.5",
		"127.0.0.1",
	];

	/**
	 * Генерирует одну строку лога Squid
	 * @param baseTimestamp - базовый timestamp (по умолчанию текущее время)
	 * @returns строка лога в формате Squid
	 */
	generateLogLine(baseTimestamp?: number): string {
		const timestamp = baseTimestamp || Date.now() / 1000;
		const duration = faker.number.int({ min: 0, max: 2000 });
		const clientIP = faker.helpers.arrayElement(this.clientIPs);
		const resultType = faker.helpers.arrayElement(this.resultTypes);
		const resultStatus = faker.helpers.arrayElement(this.statusCodes);
		const bytes = faker.number.int({ min: 0, max: 10000 });
		const method = faker.helpers.arrayElement(this.methods);
		const url = this.generateURL(method);
		const user = faker.helpers.arrayElement(this.userAgents);
		const hierarchyType = faker.helpers.arrayElement(this.hierarchyTypes);
		const hierarchyHost = this.generateHierarchyHost(hierarchyType);
		const contentType = faker.helpers.arrayElement(this.contentTypes);

		return `${timestamp} ${duration} ${clientIP} ${resultType}/${resultStatus} ${bytes} ${method} ${url} ${user} ${hierarchyType}/${hierarchyHost} ${contentType}`;
	}

	/**
	 * Генерирует массив строк логов
	 * @param count - количество строк
	 * @param timeSpread - разброс времени в секундах
	 * @returns массив строк логов
	 */
	generateLogLines(count: number, timeSpread: number = 3600): string[] {
		const baseTime = Date.now() / 1000;
		const lines: string[] = [];

		for (let i = 0; i < count; i++) {
			const timestamp =
				baseTime + faker.number.int({ min: 0, max: timeSpread });
			lines.push(this.generateLogLine(timestamp));
		}

		return lines.sort((a, b) => {
			const timeA = parseFloat(a.split(" ")[0] as string);
			const timeB = parseFloat(b.split(" ")[0] as string);
			return timeA - timeB;
		});
	}

	/**
	 * Генерирует URL на основе HTTP метода
	 */
	private generateURL(method: string): string {
		switch (method) {
			case "CONNECT":
				return `${faker.internet.domainName()}:443`;
			case "GET":
				return (
					faker.internet.url() +
					(faker.datatype.boolean()
						? "?" + faker.internet.url().split("?")[1] || ""
						: "")
				);
			case "POST":
				return faker.internet.url() + "/api/" + faker.lorem.slug();
			default:
				return faker.internet.url();
		}
	}

	/**
	 * Генерирует hierarchy host на основе типа
	 */
	private generateHierarchyHost(hierarchyType: string): string {
		switch (hierarchyType) {
			case "HIER_DIRECT":
				return faker.internet.ip();
			case "HIER_NONE":
				return "-";
			default:
				return faker.internet.ip();
		}
	}

	/**
	 * Генерирует сценарий активности (пиковая нагрузка, обычная и т.д.)
	 */
	generateActivityBurst(scenario: "normal" | "peak" | "heavy"): string[] {
		switch (scenario) {
			case "normal":
				return this.generateLogLines(faker.number.int({ min: 5, max: 15 }), 60);
			case "peak":
				return this.generateLogLines(
					faker.number.int({ min: 50, max: 100 }),
					30,
				);
			case "heavy":
				return this.generateLogLines(
					faker.number.int({ min: 100, max: 200 }),
					10,
				);
			default:
				return this.generateLogLines(10, 60);
		}
	}
}
