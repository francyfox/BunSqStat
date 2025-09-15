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
	async getTotalRequestByTime(time: number = 60) {
		const currentTime = Date.now();
		const endTime = currentTime + time;
		const { total_results } = await redisClient.send("FT.SEARCH", [
			"log_idx",
			`@timestamp:[${currentTime} ${endTime}]`,
			"LIMIT",
			"0",
			"0",
		]);

		return total_results;
	},

	async getTotalStatusesByTime(time?: number) {
		const currentTime = Date.now();
		const TIMESTAMP = time
			? `@timestamp:[${currentTime} ${currentTime + time}]`
			: "*";
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

	async getTotal(items: IMetricBytesAndDuration[], time: number = 60) {
		const result = {
			bytes: 0,
			duration: 0,
		};

		const requestPerSecond = await this.getTotalRequestByTime(time);

		for (const i of items) {
			result.bytes += Number(i.totalBytes || 0);
			result.duration += Number(i.totalDuration || 0);
		}

		return {
			globalStates: {
				...result,
				statusCodes: await this.getTotalStatusesByTime(),
			},
			currentStates: {
				rps: evaluate(`${requestPerSecond} / ${time}`),
				statusCodes: await this.getTotalStatusesByTime(time),
			},
		};
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
