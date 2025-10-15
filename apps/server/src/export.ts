import { regexMap } from "./consts";
import type {
	TAccessLogMetricsResponse,
	TMetricDomainItem,
	TMetricDomainOptions,
} from "./modules/access-logs/metrics/types";
import type { getLogParams, TAccessLog } from "./modules/access-logs/types";

const accessKeys = Array.from(regexMap.keys());

export {
	accessKeys,
	type getLogParams,
	type TAccessLog,
	type TAccessLogMetricsResponse,
	type TMetricDomainItem,
	type TMetricDomainOptions,
};
