#!/usr/bin/env bun
import { appendFile, writeFile } from "node:fs/promises";
import { RedisClient } from "bun";
import { SquidLogGenerator } from "@/__tests__/log-generator/log-generator";

/**
 * Конфигурация для симулятора логов
 */
interface SimulatorConfig {
	logFilePath: string;
	redis: {
		host: string;
		port: number;
		password?: string;
	};
	scenarios: {
		normal: { intervalMs: number; burstSize: number };
		peak: { intervalMs: number; burstSize: number };
		heavy: { intervalMs: number; burstSize: number };
	};
	duration: number; // секунды
	validateRedis: boolean;
}

/**
 * Симулятор активности логов для тестирования реального времени
 */
export class LogSimulator {
	private generator: SquidLogGenerator;
	private config: SimulatorConfig;
	private redisClient?: RedisClient;
	private isRunning = false;

	constructor(config: SimulatorConfig) {
		this.config = config;
		this.generator = new SquidLogGenerator();

		if (config.validateRedis) {
			this.initRedis();
		}
	}

	/**
	 * Инициализация подключения к Redis
	 */
	private async initRedis() {
		try {
			const connectionString = `redis://${this.config.redis.password ? `default:${this.config.redis.password}@` : ""}${this.config.redis.host}:${this.config.redis.port}`;
			this.redisClient = new RedisClient(connectionString);

			console.log("✅ Подключение к Redis установлено");
		} catch (error) {
			console.error("❌ Ошибка подключения к Redis:", error);
			process.exit(1);
		}
	}

	/**
	 * Проверяет что новые данные появились в Redis
	 */
	async validateRedisUpdate(expectedCount: number): Promise<boolean> {
		if (!this.redisClient) return false;

		try {
			const keys = await this.redisClient.keys("log:*");
			const currentCount = keys.length;

			console.log(
				`📊 Записей в Redis: ${currentCount}, ожидалось минимум: ${expectedCount}`,
			);

			if (currentCount >= expectedCount) {
				// Проверим последние записи
				const response = await this.redisClient.send("FT.SEARCH", [
					"log_idx",
					"*",
					"LIMIT",
					"0",
					"3",
				]);
				console.log("📋 Последние записи в индексе:", response.total_results);
				return true;
			}

			return false;
		} catch (error) {
			console.error("❌ Ошибка проверки Redis:", error);
			return false;
		}
	}

	/**
	 * Записывает первоначальные данные в файл лога
	 */
	async initializeLogFile(): Promise<void> {
		console.log(`🏁 Инициализация файла логов: ${this.config.logFilePath}`);

		const initialLogs = this.generator.generateLogLines(50, 7200); // 50 записей за 2 часа
		const content = initialLogs.join("\n") + "\n";

		await writeFile(this.config.logFilePath, content);
		console.log(`✅ Создано ${initialLogs.length} начальных записей`);
	}

	/**
	 * Добавляет новые строки логов в файл
	 */
	async appendLogLines(lines: string[]): Promise<void> {
		const content = lines.join("\n") + "\n";
		await appendFile(this.config.logFilePath, content);

		console.log(`📝 Добавлено ${lines.length} записей в лог`);
	}

	/**
	 * Запускает симуляцию сценария
	 */
	async runScenario(
		scenarioName: keyof SimulatorConfig["scenarios"],
		durationMs: number,
	): Promise<void> {
		const scenario = this.config.scenarios[scenarioName];
		const endTime = Date.now() + durationMs;
		let totalAdded = 0;

		console.log(`\n🎬 Запуск сценария: ${scenarioName.toUpperCase()}`);
		console.log(
			`⏱️  Интервал: ${scenario.intervalMs}мс, Размер порции: ${scenario.burstSize}`,
		);

		while (Date.now() < endTime && this.isRunning) {
			// Генерируем логи по текущему времени
			const lines = this.generator.generateLogLines(
				scenario.burstSize,
				scenario.intervalMs / 1000,
			);

			await this.appendLogLines(lines);
			totalAdded += lines.length;

			// Ждем следующей итерации
			await new Promise((resolve) => setTimeout(resolve, scenario.intervalMs));
		}

		console.log(
			`✅ Сценарий ${scenarioName} завершен. Добавлено ${totalAdded} записей`,
		);

		// Проверяем Redis через небольшую задержку
		if (this.config.validateRedis) {
			console.log("⏳ Ожидание обновления Redis...");
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const isValid = await this.validateRedisUpdate(totalAdded);
			console.log(
				isValid
					? "✅ Redis обновлен корректно"
					: "⚠️ Redis может быть не синхронизирован",
			);
		}
	}

	/**
	 * Основной метод запуска тестирования
	 */
	async runTest(): Promise<void> {
		this.isRunning = true;

		console.log("🚀 Начало тестирования симулятора логов");
		console.log(`📁 Файл логов: ${this.config.logFilePath}`);
		console.log(`⏱️  Общая длительность: ${this.config.duration} секунд`);

		// Инициализируем файл логов
		await this.initializeLogFile();

		const totalDuration = this.config.duration * 1000;
		const scenarioTime = Math.floor(totalDuration / 3); // Равномерно распределяем сценарии

		try {
			// Запускаем сценарии последовательно
			await this.runScenario("normal", scenarioTime);
			await this.runScenario("peak", scenarioTime);
			await this.runScenario("heavy", scenarioTime);
		} catch (error) {
			console.error("❌ Ошибка во время выполнения теста:", error);
		} finally {
			this.isRunning = false;
			await this.cleanup();
		}
	}

	/**
	 * Останавливает тестирование
	 */
	async stop(): Promise<void> {
		console.log("\n🛑 Остановка симулятора...");
		this.isRunning = false;
		await this.cleanup();
	}

	/**
	 * Очистка ресурсов
	 */
	private async cleanup(): Promise<void> {
		if (this.redisClient) {
			// Закрываем соединение с Redis если нужно
			console.log("🔌 Закрытие подключения к Redis");
		}
		console.log("✅ Тестирование завершено");
	}
}

// Функция для запуска тестирования (будет вызываться пользователем)
export async function runLogSimulatorTest(
	_checkRedisFunction: () => Promise<boolean>,
): Promise<void> {
	const config: SimulatorConfig = {
		logFilePath: process.env["ACCESS_LOG"] || "/tmp/access.log",
		redis: {
			host: "localhost",
			port: 6379,
			password: "123",
		},
		scenarios: {
			normal: { intervalMs: 5000, burstSize: 3 }, // Каждые 5 сек, по 3 записи
			peak: { intervalMs: 2000, burstSize: 10 }, // Каждые 2 сек, по 10 записей
			heavy: { intervalMs: 1000, burstSize: 20 }, // Каждую секунду, по 20 записей
		},
		duration: 60, // 1 минута тестирования
		validateRedis: true,
	};

	const simulator = new LogSimulator(config);

	// Обработка прерывания
	process.on("SIGINT", async () => {
		await simulator.stop();
		process.exit(0);
	});

	await simulator.runTest();
}

// CLI запуск если файл выполняется напрямую
if (import.meta.main) {
	console.log("🧪 Запуск тестового симулятора логов...");

	// Пример пустой функции проверки - пользователь заменит на свою
	const userCheckFunction = async (): Promise<boolean> => {
		console.log("⚠️ Используется заглушка функции проверки");
		return true;
	};

	await runLogSimulatorTest(userCheckFunction);
}
