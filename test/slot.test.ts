import { describe, expect, it } from "vitest";

import { getJstSlot } from "../src/slot";

describe("getJstSlot", () => {
	it("11:58 and 12:02 are different slots", () => {
		const a = getJstSlot(Date.parse("2026-08-27T02:58:00Z"));
		const b = getJstSlot(Date.parse("2026-08-27T03:02:00Z"));
		expect(a.key).toBe("2026-08-27T10");
		expect(b.key).toBe("2026-08-27T12");
	});

	it("10:58 and 11:02 are the same slot", () => {
		const a = getJstSlot(Date.parse("2026-08-27T01:58:00Z"));
		const b = getJstSlot(Date.parse("2026-08-27T02:02:00Z"));
		expect(a.key).toBe("2026-08-27T10");
		expect(b.key).toBe("2026-08-27T10");
	});
});
