import { resolve } from "node:path";
import chokidar from "chokidar";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";

export interface FileChangeEvent {
	changedLinesCount: number;
	time: string;
	path: string;
}

export type FileChangeCallback = (event: FileChangeEvent) => void;

class FileWatcher {
	private watcher: chokidar.FSWatcher;
	private callbacks: Set<FileChangeCallback> = new Set();

	constructor() {
		const watchPaths = [resolve(config.ACCESS_LOG), resolve(config.CACHE_LOG)];
		console.log("Chokidar watching paths:", watchPaths);

		this.watcher = chokidar.watch(watchPaths, {
			usePolling: true,
			interval: 500,
			binaryInterval: 1000,
			ignoreInitial: true,
			persistent: true,
			atomic: true,
			awaitWriteFinish: {
				stabilityThreshold: 200,
				pollInterval: 100,
			},
		});

		this.setupEventHandlers();
	}

	private setupEventHandlers() {
		this.watcher.on("ready", () => {
			console.log("Chokidar ready, watching:", this.watcher.getWatched());
		});

		this.watcher.on("error", (error) => {
			console.error("Chokidar error:", error);
		});

		this.watcher.on("change", async (path) => {
			console.log("File changed:", path);

			try {
				const newLogsCount = await AccessLogService.readAccessLogs();
				console.log(`Found ${newLogsCount} new log entries`);

				if (newLogsCount > 0) {
					const event: FileChangeEvent = {
						changedLinesCount: newLogsCount,
						time: new Date().toISOString(),
						path,
					};

					this.notifyCallbacks(event);
				}
			} catch (error) {
				console.error("Error processing file change:", error);
			}
		});
	}

	private notifyCallbacks(event: FileChangeEvent) {
		this.callbacks.forEach((callback) => {
			try {
				callback(event);
			} catch (error) {
				console.error("Error in file change callback:", error);
			}
		});
	}

	onFileChange(callback: FileChangeCallback) {
		this.callbacks.add(callback);
		return () => this.callbacks.delete(callback);
	}

	async close() {
		await this.watcher.close();
		this.callbacks.clear();
	}
}

export const fileWatcher = new FileWatcher();
