import { redisClient } from "@/redis";

export const AccessLogsMetrics = {
	total: {
		bytes: 0,
		duration: 0,
	},

	async getTotalSum() {
		const response = await redisClient.send(
			"FT.AGGREGATE",
			" log_idx * LOAD 1 @bytes GROUPBY 1 @user REDUCE SUM 1 @bytes AS total_bytes REDUCE SUM 1 @duration as total_duration".split(
				" ",
			),
		);

		return {
			count: response["total-result"],
			items: response.results,
		};
	},
};
