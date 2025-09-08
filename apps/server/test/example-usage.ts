#!/usr/bin/env bun
import { runLogSimulatorTest } from "./log-simulator";

/**
 * Пример использования симулятора логов с пользовательской функцией проверки
 */

// Ваша функция проверки Redis (замените на свою логику)
async function customRedisValidation(): Promise<boolean> {
	console.log("🔍 Выполняется пользовательская проверка Redis...");

	try {
		// Здесь можете добавить свою логику проверки:
		// - Подключение к Redis
		// - Проверка индексов RediSearch
		// - Валидация структуры данных
		// - Проверка производительности

		// Пример заглушки
		await new Promise((resolve) => setTimeout(resolve, 1000));

		console.log("✅ Пользовательская проверка прошла успешно");
		return true;
	} catch (error) {
		console.error("❌ Ошибка в пользовательской проверке:", error);
		return false;
	}
}

// Запуск тестирования
(async () => {
	await runLogSimulatorTest(customRedisValidation);
})();
