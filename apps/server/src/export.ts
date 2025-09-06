import { regexMap } from "./consts";
import type { getLogParams, TAccessLog } from "./modules/access-logs/types";

const accessKeys = Array.from(regexMap.keys());

export { accessKeys, type getLogParams, type TAccessLog };
