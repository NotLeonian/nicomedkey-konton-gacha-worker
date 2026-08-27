import { describe, expect, it } from "vitest";

import { parsePointSummary } from "../src/points";

describe("parsePointSummary", () => {
	it("parses normal gacha", () => {
		expect(
			parsePointSummary("ガチャポイントが +27 されたよ！(現在：3599)"),
		).toEqual({
			gained: 27,
			current: 3599,
		});
	});

	it("parses premium 10 pull", () => {
		const text = `
ポイントガチャプレミアム 10連！
[ NEW! ] [ 0333 曲目 ] 『 （曲名0333） 』
[ NEW! ] [ 0988 曲目 ] 『 （曲名0988） 』
が出たよ！
コンプ率が 33.80% になったよ！
ガチャポイントが合計で +836 されたよ！(現在：883)
`;

		expect(parsePointSummary(text)).toEqual({
			gained: 836,
			current: 883,
		});
	});

	it("returns null for cooldown", () => {
		expect(parsePointSummary("次に引ける日時は12:00です")).toBeNull();
	});

	it("does not accept current points alone", () => {
		expect(parsePointSummary("現在：4000")).toBeNull();
	});
});
