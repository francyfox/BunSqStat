/**
 * Mock implementation для RedisClient для тестирования
 */
export class MockRedisClient {
	private data: Map<string, any> = new Map();
	private searchIndex: Map<string, any[]> = new Map();
	private connected = false;

	constructor(connectionString: string) {
		// Имитируем подключение
		setTimeout(() => {
			this.connected = true;
		}, 100);
	}

	async keys(pattern: string): Promise<string[]> {
		if (!this.connected) throw new Error('Redis not connected');
		
		const keys = Array.from(this.data.keys());
		if (pattern === 'log:*') {
			return keys.filter(key => key.startsWith('log:'));
		}
		return keys;
	}

	async hmset(key: string, ...args: any[]): Promise<string> {
		if (!this.connected) throw new Error('Redis not connected');
		
		const obj: any = {};
		for (let i = 0; i < args.length; i += 2) {
			obj[args[i]] = args[i + 1];
		}
		this.data.set(key, obj);
		
		// Добавляем в поисковый индекс
		if (!this.searchIndex.has('log_idx')) {
			this.searchIndex.set('log_idx', []);
		}
		this.searchIndex.get('log_idx')?.push({ key, ...obj });
		
		return 'OK';
	}

	async hmget(key: string, fields: string[]): Promise<(string | null)[]> {
		if (!this.connected) throw new Error('Redis not connected');
		
		const obj = this.data.get(key) || {};
		return fields.map(field => obj[field] || null);
	}

	async send(command: string, args: any[]): Promise<any> {
		if (!this.connected) throw new Error('Redis not connected');
		
		switch (command) {
			case 'FT.SEARCH':
				return this.mockSearch(args);
			case 'FT.DROPINDEX':
				this.searchIndex.delete(args[0]);
				return 'OK';
			case 'FT.CREATE':
				this.searchIndex.set(args[0], []);
				return 'OK';
			default:
				throw new Error(`Unknown command: ${command}`);
		}
	}

	private mockSearch(args: any[]): any {
		const [indexName, query, ...searchArgs] = args;
		const index = this.searchIndex.get(indexName) || [];
		
		// Простая имитация поиска
		let results = index;
		if (query !== '*') {
			// Базовая фильтрация для тестов
			results = index.filter(item => {
				return Object.values(item).some(value => 
					String(value).includes(query.replace(/[@:]/g, ''))
				);
			});
		}

		// Обрабатываем LIMIT
		let limit = results.length;
		const limitIndex = searchArgs.indexOf('LIMIT');
		if (limitIndex !== -1) {
			const start = parseInt(searchArgs[limitIndex + 1]) || 0;
			const count = parseInt(searchArgs[limitIndex + 2]) || 10;
			results = results.slice(start, start + count);
			limit = count;
		}

		return {
			total_results: results.length,
			results: results.map(item => ({
				key: item.key,
				extra_attributes: item
			}))
		};
	}

	// Utility методы для тестирования
	getStoredData(): Map<string, any> {
		return this.data;
	}

	clearData(): void {
		this.data.clear();
		this.searchIndex.clear();
	}

	isConnected(): boolean {
		return this.connected;
	}

	setConnected(connected: boolean): void {
		this.connected = connected;
	}
}
