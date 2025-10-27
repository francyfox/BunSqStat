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
	error: ({ operation }: { operation: string }, message: string) => {
		dataLogger.pino.error(
			{
				operation,
				duration: 0,
				itemsProcessed: 0,
				memory: heapStats().heapSize,
			},
			message,
		);
	},
	info(
		{
			operation,
			startTime,
			count,
		}: {
			operation?: string;
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
