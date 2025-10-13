import { regexMap } from "./consts";
import type {
	IMetricDomainOptions,
	TAccessLogMetricsResponse,
	TMetricDomainItem,
} from "./modules/access-logs/metrics/types";
import type { getLogParams, TAccessLog } from "./modules/access-logs/types";

const accessKeys = Array.from(regexMap.keys());

export {
	accessKeys,
	type getLogParams,
	type TAccessLog,
	type TAccessLogMetricsResponse,
	type TMetricDomainItem,
	type IMetricDomainOptions,
};
