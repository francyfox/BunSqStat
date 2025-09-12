#!/usr/bin/env bun
import { appendFile, writeFile } from "node:fs/promises";
import { RedisClient } from "bun";
import { SquidLogGenerator } from "@/__tests__/log-generator/log-generator";

/**
 * @description config for log simulator
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
 * @description Real time log simulator
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
	 * @description validate new data
	 */
	async validateRedisUpdate(expectedCount: number): Promise<boolean> {
		if (!this.redisClient) return false;

		try {
			const keys = await this.redisClient.keys("log:*");
			const currentCount = keys.length;

			console.log(
				`📊 Records in Redis: ${currentCount}, expected minimum: ${expectedCount}`,
			);

			if (currentCount >= expectedCount) {
				const response = await this.redisClient.send("FT.SEARCH", [
					"log_idx",
					"*",
					"LIMIT",
					"0",
					"3",
				]);
				console.log("📋 Last records:", response.total_results);
				return true;
			}

			return false;
		} catch (error) {
			console.error("❌ Error Redis:", error);
			return false;
		}
	}

	async initializeLogFile(): Promise<void> {
		console.log(`🏁 Init file log: ${this.config.logFilePath}`);

		const initialLogs = this.generator.generateLogLines(50);
		const content = `${initialLogs.join("\n")}\n`;

		await writeFile(this.config.logFilePath, content);
		console.log(`✅ Created ${initialLogs.length} init records`);
	}

	async appendLogLines(lines: string[]): Promise<void> {
		const content = `${lines.join("\n")}\n`;
		await appendFile(this.config.logFilePath, content);

		console.log(`📝 Добавлено ${lines.length} записей в лог`);
	}

	/**
	 * @description Run scenarios, default normal. `normal | peak | heavy`
	 *
	 */
	async runScenario(
		scenarioName: keyof SimulatorConfig["scenarios"],
		durationMs: number,
	): Promise<void> {
		const scenario = this.config.scenarios[scenarioName];
		const endTime = Date.now() + durationMs;
		let totalAdded = 0;

		console.info(`\n🎬 : Scenario ${scenarioName.toUpperCase()}`);
		console.log(
			`⏱️  Interval: ${scenario.intervalMs}ms, Burst size: ${scenario.burstSize}`,
		);

		while (Date.now() < endTime && this.isRunning) {
			const lines = this.generator.generateLogLines(scenario.burstSize);

			await this.appendLogLines(lines);
			totalAdded += lines.length;

			await new Promise((resolve) => setTimeout(resolve, scenario.intervalMs));
		}

		console.log(
			`✅ Scenario ${scenarioName} completed. Add ${totalAdded} new records`,
		);

		if (this.config.validateRedis) {
			console.log("⏳ Expected updates Redis...");
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const isValid = await this.validateRedisUpdate(totalAdded);
			console.log(
				isValid
					? "✅ Redis successfully updated"
					: "⚠️ Redis hasn't synchronized",
			);
		}
	}

	async runTest(): Promise<void> {
		this.isRunning = true;

		console.log("🚀 Started");
		console.log(`📁 Log file: ${this.config.logFilePath}`);
		console.log(`⏱️  Duration: ${this.config.duration} sec`);

		// Инициализируем файл логов
		await this.initializeLogFile();

		const totalDuration = this.config.duration * 1000;
		const scenarioTime = Math.floor(totalDuration / 3);

		try {
			// Запускаем сценарии последовательно
			await this.runScenario("normal", scenarioTime);
			await this.runScenario("peak", scenarioTime);
			await this.runScenario("heavy", scenarioTime);
		} catch (error) {
			console.error("❌ Test failed:", error);
		} finally {
			this.isRunning = false;
			await this.cleanup();
		}
	}

	/**
	 * Останавливает тестирование
	 */
	async stop(): Promise<void> {
		console.log("\n🛑 Stopped...");
		this.isRunning = false;
		await this.cleanup();
	}

	/**
	 * Очистка ресурсов
	 */
	private async cleanup(): Promise<void> {
		if (this.redisClient) {
			console.log("🔌 Disable connection Redis");
		}
		console.log("✅ Successfully");
	}
}

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
			normal: { intervalMs: 5000, burstSize: 3 },
			peak: { intervalMs: 2000, burstSize: 10 },
			heavy: { intervalMs: 1000, burstSize: 20 },
		},
		duration: 60,
		validateRedis: true,
	};

	const simulator = new LogSimulator(config);

	process.on("SIGINT", async () => {
		await simulator.stop();
		process.exit(0);
	});

	await simulator.runTest();
}

if (import.meta.main) {
	console.log("🧪 Run test log simulator...");

	const userCheckFunction = async (): Promise<boolean> => {
		console.log("⚠️ Используется заглушка функции проверки");
		return true;
	};

	await runLogSimulatorTest(userCheckFunction);
}
