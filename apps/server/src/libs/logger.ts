import { memoryUsage } from "bun:jsc";
import logixlysia, { createLogger } from "logixlysia";
import { config } from "@/config";

const defaultOptions = {
	logRotation: {
		maxSize: "400k",
		maxFiles: "3d",
		compress: true,
	},
	timestamp: {
		translateTime: "yyyy-mm-dd HH:MM:ss.SSS",
	},
	logFilter: {
		level:
			config.NODE_ENV === "production"
				? ["ERROR", "WARNING"]
				: ["DEBUG", "INFO", "WARNING", "ERROR"],
	},
};

export const dataLogger = createLogger({
	config: {
		...defaultOptions,
		logFilePath: "./logs/data.log",
		customLogFormat: "{now} {level} {duration} {message} {context}",
	},
});

export const logger = {
	error: (
		{ operation, url }: { operation: string; url: string },
		message: string,
	) => {
		dataLogger.error(new Request(`udp://${url}`), message, {
			from: url,
			operation,
			memory: memoryUsage().current,
			cpu: process.cpuUsage().user + process.cpuUsage().system,
		});
	},
	info(
		{
			operation,
			startTime,
			count,
			url,
		}: {
			operation?: string;
			startTime: number;
			count?: number;
			url: string;
		},
		message: string = "",
	) {
		dataLogger.info(new Request(`udp://${url}`), message, {
			from: url,
			operation: operation || "process_data",
			duration: performance.now() - startTime,
			itemsProcessed: count || 0,
			memory: memoryUsage().current,
			cpu: process.cpuUsage().user + process.cpuUsage().system,
		});
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
			"{now} {level} {duration} {method} {pathname} {status} {message} {ip}",
	},
});
