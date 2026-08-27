import type { PointSummary } from "./types";

function parseInteger(value: string): number {
	return Number(value.replaceAll(",", ""));
}

export function parsePointSummary(text: string): PointSummary | null {
	const normalized = text.normalize("NFKC");

	const gainedMatch = normalized.match(
		/ガチャポイントが(?:合計で)?\s*\+\s*([0-9][0-9,]*)\s*されたよ/u,
	);

	const currentMatches = [
		...normalized.matchAll(/現在\s*:\s*([0-9][0-9,]*)/gu),
	];

	const gained = gainedMatch?.[1];
	const current = currentMatches.at(-1)?.[1];

	if (gained === undefined || current === undefined) {
		return null;
	}

	return {
		gained: parseInteger(gained),
		current: parseInteger(current),
	};
}

export function looksLikeCooldown(text: string): boolean {
	const normalized = text.normalize("NFKC");
	return /次.{0,20}引け/u.test(normalized) || /次回/u.test(normalized);
}
