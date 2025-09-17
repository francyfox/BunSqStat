import { evaluate } from "mathjs";
import { redisClient } from "@/redis";

export interface IMetricBytesAndDuration {
	user: string;
	totalBytes: number;
	totalDuration: number;
}

export const AccessLogsMetricsService = {
	async getTotalSum(limit?: number): Promise<{
		count: number;
		items: IMetricBytesAndDuration[];
	}> {
		const LIMIT = limit ? ` LIMIT 0 ${limit}` : "";
		const { results, total_results } = await redisClient.send(
			"FT.AGGREGATE",
			`log_idx * LOAD 1 @bytes GROUPBY 1 @user REDUCE SUM 1 @bytes AS total_bytes REDUCE SUM 1 @duration as total_duration${LIMIT}`.split(
				" ",
			),
		);

		const items: IMetricBytesAndDuration[] = results.map(
			({ extra_attributes: i }: any) => {
				return {
					user: i.user,
					totalBytes: Number(i.total_bytes),
					totalDuration: Number(i.total_duration),
				};
			},
		);

		return {
			count: total_results,
			items,
		};
	},

	/**
	 * @param time milliseconds
	 */
	async getTotalRequestByTime({
		startTime,
		endTime,
	}: {
		startTime?: number;
		endTime?: number;
	}) {
		const TIMESTAMP =
			startTime && endTime ? `@timestamp:[${startTime} ${endTime}]` : "*";

		const { total_results } = await redisClient.send("FT.SEARCH", [
			"log_idx",
			TIMESTAMP,
			"LIMIT",
			"0",
			"0",
		]);

		return total_results;
	},

	async getTotalStatusesByTime({
		startTime,
		endTime,
	}: {
		startTime?: number;
		endTime?: number;
	}) {
		const TIMESTAMP =
			startTime && endTime ? `@timestamp:[${startTime} ${endTime}]` : "*";
		const aggregateQuery = `APPLY floor(@resultStatus/100) AS status_class GROUPBY 1 @status_class REDUCE COUNT 0 AS count SORTBY 2 @status_class ASC`;

		const { total_results, results } = await redisClient.send("FT.AGGREGATE", [
			"log_idx",
			TIMESTAMP,
			...aggregateQuery.split(" "),
		]);

		const items = results.map((i: any) => {
			return {
				status: `${i.extra_attributes.status_class}XX`,
				count: Number(i.extra_attributes.count),
			};
		});

		return {
			count: total_results,
			items,
		};
	},

	async getTotal(
		items: IMetricBytesAndDuration[],
		time: { startTime?: number; endTime?: number },
	) {
		const result = {
			bytes: 0,
			duration: 0,
		};

		const rpsTime = (): { startTime: number; endTime: number } => {
			if (!time.startTime && !time.endTime) {
				// TODO: fix time types
				const now = Date.now();

				return {
					startTime: now - 60 * 60 * 1000,
					endTime: now,
				};
			}

			return time;
		};

		const recentRequestCount = await this.getTotalRequestByTime(rpsTime());

		for (const i of items) {
			result.bytes += Number(i.totalBytes || 0);
			result.duration += Number(i.totalDuration || 0);
		}

		const timeRangeSeconds = Math.abs(
			(rpsTime().endTime - rpsTime().startTime) / 1000,
		);

		const test = (await redisClient.keys("log:*"))[0].replace("log:", "");
		console.log(
			`${recentRequestCount}\n${timeRangeSeconds}\n${new Date(rpsTime().startTime)}\n${new Date(rpsTime().endTime)}\n${new Date(Number(test))}`,
		);
		const output = {
			globalStates: {
				...result,
				statusCodes: await this.getTotalStatusesByTime(time),
			},
			currentStates: {
				rps: evaluate(`${recentRequestCount} / ${timeRangeSeconds}`),
				statusCodes: await this.getTotalStatusesByTime(time),
			},
		};

		return output;
	},

	async getUsersInfo(items: IMetricBytesAndDuration[]) {
		const { items: freshMetrics } = await this.getTotalSum(10);
		return items
			.filter((i) => i.user)
			.map((i) => {
				const freshMetric = freshMetrics.find((j) => j.user === i.user);
				return {
					...i,
					currentSpeed: evaluate(
						`${freshMetric?.totalBytes} / ${freshMetric?.totalDuration}  * 1000 / 1024`,
					),
					speed: evaluate(`${i.totalBytes} / ${i.totalDuration} * 1000 / 1024`),
				};
			});
	},
};
