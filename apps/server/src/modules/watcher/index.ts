import { resolve } from "node:path";
import chokidar, { type FSWatcher } from "chokidar";
import { config } from "@/config";
import { AccessLogService } from "@/modules/access-logs/service";

export interface FileChangeEvent {
	changedLinesCount: number;
	time: string;
	path: string;
}

export type FileChangeCallback = (event: FileChangeEvent) => void;

class FileWatcher {
	private watcher: FSWatcher;
	private callbacks: Set<FileChangeCallback> = new Set();
	private debounceTimeout: Timer | null = null;
	private pendingPath: string | null = null;

	constructor() {
		this.watcher = chokidar.watch([`${config.LOG_DIR}/access.log`], {
			usePolling: true,
			interval: 100, // More frequent polling
			binaryInterval: 200,
			ignoreInitial: true,
			persistent: true,
			atomic: false, // Don't wait for atomic writes
			// Remove awaitWriteFinish to avoid delays
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

		this.watcher.on("change", (path) => {
			console.log("File changed:", path);
			this.debouncedProcessChange(path);
		});
	}

	private debouncedProcessChange(path: string) {
		// Clear existing timeout
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
		}

		this.pendingPath = path;

		// Set new timeout with shorter debounce for better responsiveness
		this.debounceTimeout = setTimeout(async () => {
			if (!this.pendingPath) return;

			try {
				const newLogsCount = await AccessLogService.readLogs();
				console.log(`Found ${newLogsCount} new log entries`);

				if (newLogsCount > 0) {
					const event: FileChangeEvent = {
						changedLinesCount: newLogsCount,
						time: new Date().toISOString(),
						path: this.pendingPath,
					};

					this.notifyCallbacks(event);
				}
			} catch (error) {
				console.error("Error processing file change:", error);
			} finally {
				this.debounceTimeout = null;
				this.pendingPath = null;
			}
		}, 150); // Short debounce - 150ms
	}

	private notifyCallbacks(event: FileChangeEvent) {
		for (const callback of this.callbacks) {
			try {
				callback(event);
			} catch (error) {
				console.error("Error in file change callback:", error);
			}
		}
	}

	onFileChange(callback: FileChangeCallback) {
		this.callbacks.add(callback);
		return () => this.callbacks.delete(callback);
	}

	async close() {
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = null;
		}
		await this.watcher.close();
		this.callbacks.clear();
	}
}

export const fileWatcher = new FileWatcher();
