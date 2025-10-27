import { heapStats } from "bun:jsc";
import logixlysia, { createLogger } from "logixlysia";

const defaultOptions = {
	logRotation: {
		maxSize: "400k",
		maxFiles: "3d",
		compress: true,
	},
	timestamp: {
		translateTime: "yyyy-mm-dd HH:MM:ss.SSS",
	},
};

export const dataLogger = createLogger({
	config: {
		...defaultOptions,
		logFilePath: "./logs/data.log",
	},
});

export const logger = {
	info(
		{
			operation,
			startTime,
			count,
		}: {
			operation?: "process_data";
			startTime: number;
			count?: number;
		},
		message: string = "",
	) {
		dataLogger.pino.info(
			{
				operation: operation || "process_data",
				duration: Date.now() - startTime,
				itemsProcessed: count || 0,
				memory: heapStats().heapSize,
				success: true,
			},
			message,
		);
	},
};

export const loggerPlugin = logixlysia({
	config: {
		...defaultOptions,
		showStartupMessage: false,
		startupMessageFormat: "simple",
		logFilePath: "./logs/server.log",
		ip: true,
		customLogFormat:
			"🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip}",
	},
});
