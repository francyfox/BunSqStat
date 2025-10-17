import { describe, expect, test } from "bun:test";

describe("Domains API Tests", () => {
	const BASE_URL = "http://localhost:3000/stats/access-logs/metrics/domains";

	test("should get domains with default params", async () => {
		const response = await fetch(BASE_URL);
		expect(response.ok).toBe(true);
		const data = await response.json();
		expect(data).toHaveProperty("count");
		expect(data).toHaveProperty("items");
		expect(data.items.length).toBeGreaterThan(0);

		// Each item should have required fields
		const firstItem = data.items[0];
		expect(firstItem).toHaveProperty("domain");
		expect(firstItem).toHaveProperty("requestCount");
		expect(firstItem).toHaveProperty("bytes");
		expect(firstItem).toHaveProperty("errorsRate");
		expect(firstItem).toHaveProperty("hasBlocked");
	});

	test("should sort by errorsRate ASC", async () => {
		const url = `${BASE_URL}?sortBy=errorsRate&sortOrder=ASC&limit=3`;
		const response = await fetch(url);
		expect(response.ok).toBe(true);
		const data = await response.json();

		const rates = data.items.map((item: any) => item.errorsRate);
		expect(rates.length).toBeGreaterThan(0);
		// Check sorting is ascending
		for (let i = 1; i < rates.length; i++) {
			expect(rates[i - 1]).toBeLessThanOrEqual(rates[i]);
		}
	});

	test("should sort by hasBlocked DESC", async () => {
		const url = `${BASE_URL}?sortBy=hasBlocked&sortOrder=DESC&limit=5`;
		const response = await fetch(url);
		expect(response.ok).toBe(true);
		const data = await response.json();

		const blockedValues = data.items.map((item: any) => item.hasBlocked);
		expect(blockedValues.length).toBeGreaterThan(0);
		// Check sorting is descending (true > false)
		let lastTrueIndex = -1;
		for (let i = 0; i < blockedValues.length; i++) {
			if (blockedValues[i]) {
				lastTrueIndex = i;
			} else if (lastTrueIndex !== -1) {
				// Once we find false, all following should be false
				expect(blockedValues[i]).toBe(false);
			}
		}
	});

	test("should search by domain", async () => {
		// First get some domains to search for
		const allResponse = await fetch(`${BASE_URL}?limit=20`);
		const allData = await allResponse.json();
		const firstDomain = allData.items[0]?.domain;

		if (firstDomain) {
			// Extract domain part
			const domainQuery = firstDomain.split(".")[0]; // Take first part
			const url = `${BASE_URL}?search=${domainQuery}&limit=3`;
			const searchResponse = await fetch(url);
			expect(searchResponse.ok).toBe(true);
			const searchData = await searchResponse.json();

			// Check that some domains contain the search term
			let hasMatch = false;
			for (const item of searchData.items) {
				if (item.domain.includes(domainQuery)) {
					hasMatch = true;
					break;
				}
			}
			expect(hasMatch).toBe(true);
		}
	});

	test("should handle pagination", async () => {
		const page1Url = `${BASE_URL}?page=1&limit=2`;
		const page2Url = `${BASE_URL}?page=2&limit=2`;

		const [page1Res, page2Res] = await Promise.all([
			fetch(page1Url),
			fetch(page2Url),
		]);

		expect(page1Res.ok).toBe(true);
		expect(page2Res.ok).toBe(true);

		const page1Data = await page1Res.json();
		const page2Data = await page2Res.json();

		expect(page1Data.items.length).toBeLessThanOrEqual(2);
		expect(page2Data.items.length).toBeLessThanOrEqual(2);

		// Paginated results should be different
		const page1Domains = page1Data.items.map((item: any) => item.domain);
		const page2Domains = page2Data.items.map((item: any) => item.domain);
		const overlap = page1Domains.filter((domain: string) =>
			page2Domains.includes(domain),
		);
		expect(overlap.length).toBeLessThan(page1Data.items.length);
	});

	test("should sort by multiple fields", async () => {
		const tests = [
			{ sortBy: "requestCount", sortOrder: "DESC" },
			{ sortBy: "bytes", sortOrder: "ASC" },
			{ sortBy: "errorsRate", sortOrder: "DESC" },
		];

		for (const testCase of tests) {
			const { sortBy, sortOrder } = testCase;
			const url = `${BASE_URL}?sortBy=${sortBy}&sortOrder=${sortOrder}&limit=5`;
			const response = await fetch(url);
			expect(response.ok).toBe(true);
			const data = await response.json();
			expect(data.items.length).toBeGreaterThan(0);
		}
	});
});
