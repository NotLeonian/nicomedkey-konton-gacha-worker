import { SLOT_DELAY_MS } from "./constants";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface JstSlot {
	key: string;
	startMs: number;
	eligibleAtMs: number;
}

function pad2(value: number): string {
	return String(value).padStart(2, "0");
}

export function getJstSlot(timestampMs: number): JstSlot {
	const jst = new Date(timestampMs + JST_OFFSET_MS);

	const year = jst.getUTCFullYear();
	const month = jst.getUTCMonth();
	const day = jst.getUTCDate();
	const hour = jst.getUTCHours();

	const slotHour = Math.floor(hour / 2) * 2;

	const key =
		`${year}-` +
		`${pad2(month + 1)}-` +
		`${pad2(day)}T` +
		`${pad2(slotHour)}`;

	const startMs =
		Date.UTC(year, month, day, slotHour, 0, 0, 0) - JST_OFFSET_MS;

	return {
		key,
		startMs,
		eligibleAtMs: startMs + SLOT_DELAY_MS,
	};
}
