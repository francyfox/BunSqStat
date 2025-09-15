import { regexMap } from "./consts";
import type { TAccessLogMetricsResponse } from "./modules/access-logs/metrics/types";
import type { getLogParams, TAccessLog } from "./modules/access-logs/types";

const accessKeys = Array.from(regexMap.keys());

export {
	accessKeys,
	type getLogParams,
	type TAccessLog,
	type TAccessLogMetricsResponse,
};
