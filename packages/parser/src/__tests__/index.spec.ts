import { describe, expect, test } from "bun:test";
import { parse } from "../parser";

describe("Log parsing:", () => {
	test("Should parse access log line", async () => {
		const parsed = parse(
			[
				"1758882992.020    296 172.18.0.1 NONE_NONE/200 0 CONNECT https://static.doubleclick.net/instream/ad_status.js - HIER_DIRECT/216.58.211.238 -",
			],
			(i): any => {
				return {
					from: "o",
				};
			},
		);

		expect(JSON.stringify(parsed[0])).toBe(
			'{"timestamp":"1758882992020","duration":"296","clientIP":"172_18_0_1","resultType":"NONE_NONE","resultStatus":"200","bytes":"0","method":"CONNECT","url":"https://static.doubleclick.net/instream/ad_status.js","user":"-","hierarchyType":"HIER_DIRECT","serverIP":"216_58_211_238","contentType":"text/javascript","from":"o"}',
		);
	});
});
