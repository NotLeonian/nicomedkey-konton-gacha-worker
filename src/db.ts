import type { GachaRun, PointSummary } from "./types";

export async function reserveNormal(
	db: D1Database,
	slotKey: string,
	commandText: string,
	now: number,
): Promise<GachaRun | null> {
	const result = await db
		.prepare(`
			INSERT OR IGNORE INTO gacha_runs (
				kind,
				slot_key,
				command_text,
				status,
				reserved_at
			)
			VALUES (
				'normal',
				?,
				?,
				'reserved',
				?
			)
		`)
		.bind(slotKey, commandText, now)
		.run();

	if (result.meta.changes !== 1) {
		return null;
	}

	return db
		.prepare(`
			SELECT *
			FROM gacha_runs
			WHERE kind = 'normal'
				AND slot_key = ?
			LIMIT 1
		`)
		.bind(slotKey)
		.first<GachaRun>();
}

export async function reservePremium(
	db: D1Database,
	triggerReplyNoteId: string,
	commandText: string,
	now: number,
): Promise<GachaRun | null> {
	const result = await db
		.prepare(`
			INSERT OR IGNORE INTO gacha_runs (
				kind,
				trigger_reply_note_id,
				command_text,
				status,
				reserved_at
			)
			VALUES (
				'premium',
				?,
				?,
				'reserved',
				?
			)
		`)
		.bind(triggerReplyNoteId, commandText, now)
		.run();

	if (result.meta.changes !== 1) {
		return null;
	}

	return db
		.prepare(`
			SELECT *
			FROM gacha_runs
			WHERE kind = 'premium'
				AND trigger_reply_note_id = ?
			LIMIT 1
		`)
		.bind(triggerReplyNoteId)
		.first<GachaRun>();
}

export async function markWaitingReply(
	db: D1Database,
	runId: number,
	commandNoteId: string,
	now: number,
): Promise<void> {
	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				command_note_id = ?,
				status = 'waiting_reply',
				sent_at = ?,
				error = NULL
			WHERE id = ?
		`)
		.bind(commandNoteId, now, runId)
		.run();
}

export async function listWaitingRuns(db: D1Database): Promise<GachaRun[]> {
	const result = await db
		.prepare(`
				SELECT *
				FROM gacha_runs
				WHERE status = 'waiting_reply'
				ORDER BY sent_at ASC
				LIMIT 20
			`)
		.all<GachaRun>();

	return result.results;
}

export async function touchRun(
	db: D1Database,
	runId: number,
	now: number,
): Promise<void> {
	await db
		.prepare(`
			UPDATE gacha_runs
			SET last_checked_at = ?
			WHERE id = ?
		`)
		.bind(now, runId)
		.run();
}

export async function markCompleted(
	db: D1Database,
	runId: number,
	replyNoteId: string,
	replyText: string,
	points: PointSummary,
	now: number,
): Promise<void> {
	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				status = 'completed',
				response_note_id = ?,
				response_text = ?,
				gained_points = ?,
				current_points = ?,
				completed_at = ?,
				error = NULL
			WHERE id = ?
		`)
		.bind(replyNoteId, replyText, points.gained, points.current, now, runId)
		.run();
}

export async function markCooldown(
	db: D1Database,
	runId: number,
	replyNoteId: string,
	replyText: string,
	now: number,
): Promise<void> {
	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				status = 'completed_cooldown',
				response_note_id = ?,
				response_text = ?,
				completed_at = ?
			WHERE id = ?
		`)
		.bind(replyNoteId, replyText, now, runId)
		.run();
}

export async function markUnparsed(
	db: D1Database,
	run: GachaRun,
	replyNoteId: string,
	replyText: string,
	now: number,
): Promise<void> {
	const status =
		run.kind === "premium" ? "manual_review" : "completed_unparsed";

	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				status = ?,
				response_note_id = ?,
				response_text = ?,
				completed_at = ?,
				error = ?
			WHERE id = ?
		`)
		.bind(
			status,
			replyNoteId,
			replyText,
			now,
			"Could not parse point summary",
			run.id,
		)
		.run();
}

export async function markSendError(
	db: D1Database,
	runId: number,
	status: "send_failed" | "manual_review",
	error: string,
): Promise<void> {
	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				status = ?,
				error = ?
			WHERE id = ?
		`)
		.bind(status, error.slice(0, 2000), runId)
		.run();
}

export async function cleanupStaleRuns(
	db: D1Database,
	reservedBefore: number,
	normalReplyBefore: number,
): Promise<void> {
	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				status = 'manual_review',
				error = 'Reserved run became stale'
			WHERE
				status = 'reserved'
				AND reserved_at < ?
		`)
		.bind(reservedBefore)
		.run();

	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				status = 'reply_timeout',
				error = 'Normal reply timed out'
			WHERE
				kind = 'normal'
				AND status = 'waiting_reply'
				AND sent_at < ?
		`)
		.bind(normalReplyBefore)
		.run();

	await db
		.prepare(`
			UPDATE gacha_runs
			SET
				status = 'manual_review',
				error = 'Premium reply timed out'
			WHERE
				kind = 'premium'
				AND status = 'waiting_reply'
				AND sent_at < ?
		`)
		.bind(normalReplyBefore)
		.run();
}
