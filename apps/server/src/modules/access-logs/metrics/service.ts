import { evaluate } from "mathjs";
import { redisClient } from "@/libs/redis";
import {
	IMetricBytesAndDuration,
	TMetricDomainItem,
	TMetricDomainOptions,
} from "@/modules/access-logs/metrics/types";

export const AccessLogsMetricsService = {
	/**
	 * Get hit ratio percentage for given time range
	 * @param startTime - Start timestamp in milliseconds
	 * @param endTime - End timestamp in milliseconds
	 * @returns Hit ratio as percentage (0-100)
	 */
	async getHitRatio({
		startTime,
		endTime,
	}: {
		startTime?: number;
		endTime?: number;
	} = {}): Promise<number> {
		const hitQuery =
			startTime && endTime
				? `(@timestamp:[${startTime} ${endTime}] @resultType:*HIT*)`
				: "@resultType:*HIT*";
		const totalQuery =
			startTime && endTime ? `@timestamp:[${startTime} ${endTime}]` : "*";

		const { total_results: hitCount } = await redisClient.send("FT.SEARCH", [
			"log_idx",
			hitQuery,
			"LIMIT",
			"0",
			"0",
		]);

		const { total_results: totalCount } = await redisClient.send("FT.SEARCH", [
			"log_idx",
			totalQuery,
			"LIMIT",
			"0",
			"0",
		]);

		return totalCount > 0 ? (hitCount / totalCount) * 100 : 0;
	},

	/**
	 * Get success rate percentage (2xx status codes)
	 * @param startTime - Start timestamp in milliseconds
	 * @param endTime - End timestamp in milliseconds
	 * @returns Success rate as percentage (0-100)
	 */
	async getSuccessRate({
		startTime,
		endTime,
	}: {
		startTime?: number;
		endTime?: number;
	} = {}): Promise<number> {
		const successQuery =
			startTime && endTime
				? `(@timestamp:[${startTime} ${endTime}] @resultStatus:[200 299])`
				: "@resultStatus:[200 299]";
		const totalQuery =
			startTime && endTime ? `@timestamp:[${startTime} ${endTime}]` : "*";

		const { total_results: successCount } = await redisClient.send(
			"FT.SEARCH",
			["log_idx", successQuery, "LIMIT", "0", "0"],
		);

		const { total_results: totalCount } = await redisClient.send("FT.SEARCH", [
			"log_idx",
			totalQuery,
			"LIMIT",
			"0",
			"0",
		]);

		return totalCount > 0 ? (successCount / totalCount) * 100 : 0;
	},

	/**
	 * Get bandwidth in bytes per second
	 * @param totalBytes - Total bytes transferred
	 * @param startTime - Start timestamp in milliseconds
	 * @param endTime - End timestamp in milliseconds
	 * @returns Bandwidth in bytes per second
	 */
	getBandwidth(
		totalBytes: number,
		startTime?: number,
		endTime?: number,
	): number {
		if (!startTime || !endTime || startTime >= endTime) return 0;
		const timeRangeSeconds = (endTime - startTime) / 1000;
		return totalBytes / timeRangeSeconds;
	},

	/**
	 * Get content type statistics with hit rates
	 * @param startTime - Start timestamp in milliseconds
	 * @param endTime - End timestamp in milliseconds
	 * @returns Content type statistics array
	 */
	async getContentTypeStats({
		startTime,
		endTime,
	}: {
		startTime?: number;
		endTime?: number;
	} = {}): Promise<{
		count: number;
		items: Array<{
			contentType: string;
			requestCount: number;
			bytes: number;
			hitRatePercent: number;
		}>;
	}> {
		const TIMESTAMP =
			startTime && endTime ? `@timestamp:[${startTime} ${endTime}]` : "*";

		const { total_results, results } = await redisClient.send("FT.AGGREGATE", [
			"log_idx",
			TIMESTAMP,
			"GROUPBY",
			"1",
			"@contentType",
			"REDUCE",
			"COUNT",
			"0",
			"AS",
			"request_count",
			"REDUCE",
			"SUM",
			"1",
			"@bytes",
			"AS",
			"total_bytes",
			"SORTBY",
			"2",
			"@request_count",
			"DESC",
		]);

		const items = await Promise.all(
			results.map(async (result: any) => {
				const contentType = result.extra_attributes.contentType;
				const requestCount = Number(result.extra_attributes.request_count);
				const bytes = Number(result.extra_attributes.total_bytes);

				let hitCount = 0;
				try {
					const escapedContentType = contentType.replace(/[/\-\.]/g, "\\$&");
					const hitQuery =
						TIMESTAMP === "*"
							? `(@contentType:${escapedContentType} @resultType:*HIT*)`
							: `(${TIMESTAMP} @contentType:${escapedContentType} @resultType:*HIT*)`;

					const { total_results } = await redisClient.send("FT.SEARCH", [
						"log_idx",
						hitQuery,
						"LIMIT",
						"0",
						"0",
					]);
					hitCount = total_results;
				} catch (error) {
					console.warn(
						`Failed to get hit count for contentType: ${contentType}`,
						error,
					);
				}

				const hitRatePercent =
					requestCount > 0 ? (hitCount / requestCount) * 100 : 0;

				return {
					contentType,
					requestCount,
					bytes,
					hitRatePercent,
				};
			}),
		);

		return {
			count: total_results,
			items,
		};
	},

	async getTotalSum(
		limit?: number,
		fresh: boolean = false,
		freshTimeWindowMs: number = 60000,
		startTime?: number,
		endTime?: number,
	): Promise<{
		count: number;
		items: IMetricBytesAndDuration[];
	}> {
		const TIMESTAMP =
			startTime && endTime
				? `@timestamp:[${startTime} ${endTime}]`
				: fresh
					? `@timestamp:[${(Date.now() - freshTimeWindowMs).toString()} inf]`
					: "*";
		const LIMIT = limit ? ` LIMIT 0 ${limit}` : "";
		const { results, total_results } = await redisClient.send("FT.AGGREGATE", [
			"log_idx",
			TIMESTAMP,
			...`LOAD 1 @bytes GROUPBY 1 @clientIP REDUCE SUM 1 @bytes AS total_bytes REDUCE SUM 1 @duration as total_duration${LIMIT}`.split(
				" ",
			),
		]);

		const items: IMetricBytesAndDuration[] = results.map(
			({ extra_attributes: i }: any) => {
				return {
					clientIP: i.clientIP,
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

		const rpsTime = (): any => {
			if (!time.startTime && !time.endTime) {
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

		const hitRatePercent = await this.getHitRatio(time);
		const successRatePercent = await this.getSuccessRate(time);

		const bandwidthTime = time.startTime && time.endTime ? time : rpsTime();
		const bandwidth = this.getBandwidth(
			result.bytes,
			bandwidthTime.startTime,
			bandwidthTime.endTime,
		);

		const contentTypes = await this.getContentTypeStats(time);

		const output = {
			globalStates: {
				...result,
				statusCodes: await this.getTotalStatusesByTime(time),
				bandwidth,
				hitRatePercent,
				successRatePercent,
				contentTypes,
			},
			currentStates: {
				rps: evaluate(`${recentRequestCount} / ${timeRangeSeconds}`),
				statusCodes: await this.getTotalStatusesByTime(time),
			},
		};

		return output;
	},

	/**
	 * Get user speed information in bytes per second
	 * @param items - Array of user metrics data
	 * @returns Array of user info with speeds in bytes per second
	 */
	async getUsersInfo(items: IMetricBytesAndDuration[]) {
		const output = [];
		const freshTimeWindow = 5 * 60 * 1000; // 5 minutes
		const { items: freshData } = await AccessLogsMetricsService.getTotalSum(
			1000,
			true,
			freshTimeWindow,
		);

		for (const i of items) {
			if (i.clientIP === "-") continue; // TODO: check empty users
			const freshItem = freshData.find(
				(j: IMetricBytesAndDuration) => j?.clientIP === i?.clientIP,
			);
			const { results } = await redisClient.send(
				"FT.SEARCH",
				`log_idx @clientIP:{${i?.clientIP}} SORTBY timestamp DESC LIMIT 0 1 RETURN 2 user timestamp`.split(
					" ",
				),
			);

			const { results: largeRequestResult } = await redisClient.send(
				"FT.SEARCH",
				`log_idx @clientIP:{${i?.clientIP}} SORTBY bytes DESC LIMIT 0 1 RETURN 1 url`.split(
					" ",
				),
			);

			const totalBytes = Number(i.totalBytes) || 0;
			const totalDuration = Number(i.totalDuration) || 1;

			const freshBytes = freshItem ? Number(freshItem.totalBytes) || 0 : 0;
			const freshDuration = freshItem
				? Number(freshItem.totalDuration) || 1
				: 1;

			const calculatedCurrentSpeed =
				freshItem && freshBytes > 0 ? (freshBytes / freshDuration) * 1000 : 0;
			const calculatedSpeed =
				totalBytes > 0 ? (totalBytes / totalDuration) * 1000 : 0;

			output.push({
				...i,
				currentSpeed: calculatedCurrentSpeed,
				user: results[0]?.extra_attributes?.user || "-",
				speed: calculatedSpeed,
				largeRequestUrl: largeRequestResult[0]?.extra_attributes?.url || "",
				lastActivity: Number(results[0]?.extra_attributes?.timestamp) || 0,
			});
		}

		return output;
	},

	async getDomainsInfo({
		search,
		limit = 10,
		startTime,
		endTime,
		sortBy = "requestCount",
		sortOrder = "DESC",
		page = 1,
	}: TMetricDomainOptions): Promise<{
		count: number;
		items: TMetricDomainItem[];
	}> {
		const TIMESTAMP =
			startTime && endTime ? `@timestamp:[${startTime} ${endTime}]` : "*";

		const SEARCH_FILTER = search ? ` @url:${search}` : "";
		const FILTER =
			TIMESTAMP === "*" && SEARCH_FILTER
				? SEARCH_FILTER.trim()
				: TIMESTAMP === "*"
					? "*"
					: SEARCH_FILTER
						? `(${TIMESTAMP}${SEARCH_FILTER})`
						: TIMESTAMP;

		const redisSortBy = ["errorsRate"].includes(sortBy)
			? "errorsCount"
			: sortBy; // fallback for client-side sorting
		const aggregateQuery = `LOAD 3 @domain @resultStatus @resultType APPLY (@resultStatus>=400) AS is_error GROUPBY 1 @domain REDUCE COUNT 0 AS requestCount REDUCE SUM 1 @bytes AS bytes REDUCE SUM 1 @duration AS duration REDUCE MAX 1 @timestamp AS lastActivity REDUCE SUM 1 @is_error AS errorsCount SORTBY 2 @${redisSortBy} ${sortOrder} LIMIT ${(page - 1) * limit} ${limit}`;

		const { results, total_results } = await redisClient.send("FT.AGGREGATE", [
			"log_idx",
			FILTER,
			...aggregateQuery.split(" "),
		]);

		let items = results.map((result: any) => {
			const { extra_attributes: data } = result;
			return {
				domain: data.domain,
				requestCount: Number(data.requestCount),
				bytes: Number(data.bytes),
				duration: Number(data.duration),
				lastActivity: Number(data.lastActivity),
				errorsRate:
					data.errorsCount && data.requestCount
						? (Number(data.errorsCount) / Number(data.requestCount)) * 100
						: 0,
			};
		});

		return {
			count: total_results,
			items,
		};
	},
};
