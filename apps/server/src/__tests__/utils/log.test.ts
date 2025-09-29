import { describe, expect, test } from "bun:test";
import { AccessLogService } from "@/modules/access-logs/service";
import { parseLogLine } from "@/utils/log";

describe("Log parsing:", () => {
	test("Should parse access log line", async () => {
		const parsed = parseLogLine(
			"1758882992.020    296 172.18.0.1 NONE_NONE/200 0 CONNECT https://static.doubleclick.net/instream/ad_status.js - HIER_DIRECT/216.58.211.238 -",
			AccessLogService.regexMap,
		);

		expect(JSON.stringify(parsed)).toBe(
			'{"timestamp":"1758882992020","duration":"296","clientIP":"172.18.0.1","resultType":"NONE_NONE","resultStatus":"200","bytes":"0","method":"CONNECT","url":"https://static.doubleclick.net/instream/ad_status.js","user":"-","hierarchyType":"HIER_DIRECT","hierarchyHost":"216.58.211.238","contentType":"text/javascript"}',
		);
	});
});
