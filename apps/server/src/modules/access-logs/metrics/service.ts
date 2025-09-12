import { redisClient } from "@/redis";

export const AccessLogsMetrics = {
	total: {
		bytes: 0,
		duration: 0,
	},

	async getTotalSum(): Promise<{
		count: number;
		items: {
			user: string;
			total_bytes: string;
			total_duration: string;
		}[];
	}> {
		const { results, total_results } = await redisClient.send(
			"FT.AGGREGATE",
			"log_idx * LOAD 1 @bytes GROUPBY 1 @user REDUCE SUM 1 @bytes AS total_bytes REDUCE SUM 1 @duration as total_duration".split(
				" ",
			),
		);

		return {
			count: total_results,
			items: results.map((i: any) => i.extra_attributes),
		};
	},
};
