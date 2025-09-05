import { regexMap } from "./consts";
import type { getLogParams } from "./modules/access-logs/types";

const accessKeys = Array.from(regexMap.keys());

export { accessKeys, type getLogParams };
