import {
	NORMAL_COMMAND,
	NORMAL_REPLY_TIMEOUT_MS,
	PREMIUM_COMMAND,
	PREMIUM_THRESHOLD,
	STALE_RESERVED_MS,
} from "./constants";

import {
	cleanupStaleRuns,
	listWaitingRuns,
	markCompleted,
	markCooldown,
	markSendError,
	markUnparsed,
	markWaitingReply,
	reserveNormal,
	reservePremium,
	touchRun,
} from "./db";

import {
	createNote,
	findKontonReply,
	getChildren,
	MisskeyApiError,
} from "./misskey";

import { looksLikeCooldown, parsePointSummary } from "./points";

import { getJstSlot } from "./slot";

import type { Env, GachaRun, MisskeyNote } from "./types";

async function sendReservedRun(
	env: Env,
	run: GachaRun,
	now: number,
): Promise<void> {
	try {
		const note = await createNote(env, run.command_text);
		await markWaitingReply(env.DB, run.id, note.id, now);

		console.log(
			JSON.stringify({
				event: "command_posted",
				runId: run.id,
				kind: run.kind,
				noteId: note.id,
			}),
		);
	} catch (error) {
		if (
			error instanceof MisskeyApiError &&
			error.status >= 400 &&
			error.status < 500
		) {
			await markSendError(env.DB, run.id, "send_failed", error.message);
		} else {
			await markSendError(env.DB, run.id, "manual_review", String(error));
		}

		throw error;
	}
}

async function maybePostPremium(
	env: Env,
	triggerReplyNoteId: string,
	points: number,
	now: number,
): Promise<void> {
	if (points < PREMIUM_THRESHOLD) {
		return;
	}

	const run = await reservePremium(
		env.DB,
		triggerReplyNoteId,
		PREMIUM_COMMAND,
		now,
	);

	if (!run) {
		return;
	}

	await sendReservedRun(env, run, now);
}

async function processReply(
	env: Env,
	run: GachaRun,
	now: number,
): Promise<void> {
	if (!run.command_note_id) {
		return;
	}

	let children: MisskeyNote[];

	try {
		children = await getChildren(env, run.command_note_id);
	} catch (error) {
		console.error(
			JSON.stringify({
				event: "children_fetch_failed",
				runId: run.id,
				error: String(error),
			}),
		);

		return;
	}

	await touchRun(env.DB, run.id, now);

	const reply = findKontonReply(children, run.command_note_id);

	if (!reply) {
		return;
	}

	const text = reply.text ?? "";
	const points = parsePointSummary(text);

	if (points) {
		await markCompleted(env.DB, run.id, reply.id, text, points, now);

		console.log(
			JSON.stringify({
				event: "gacha_completed",
				runId: run.id,
				kind: run.kind,
				gained: points.gained,
				current: points.current,
			}),
		);

		await maybePostPremium(env, reply.id, points.current, now);
		return;
	}

	if (run.kind === "normal" && looksLikeCooldown(text)) {
		await markCooldown(env.DB, run.id, reply.id, text, now);
		return;
	}

	await markUnparsed(env.DB, run, reply.id, text, now);
}

async function ensureNormalGacha(env: Env, now: number): Promise<void> {
	const slot = getJstSlot(now);

	if (now < slot.eligibleAtMs) {
		return;
	}

	const run = await reserveNormal(env.DB, slot.key, NORMAL_COMMAND, now);
	if (!run) {
		return;
	}

	await sendReservedRun(env, run, now);
}

export async function runTick(env: Env, now: number): Promise<void> {
	if (env.ENABLED !== "true") {
		console.log(
			JSON.stringify({
				event: "disabled",
			}),
		);

		return;
	}

	await cleanupStaleRuns(
		env.DB,
		now - STALE_RESERVED_MS,
		now - NORMAL_REPLY_TIMEOUT_MS,
	);

	await ensureNormalGacha(env, now);
	const waiting = await listWaitingRuns(env.DB);

	for (const run of waiting) {
		await processReply(env, run, now);
	}
}
