export interface Env {
	DB: D1Database;
	NICOMEDKEY_TOKEN: string;
	ENABLED: string;
}

export type RunKind = "normal" | "premium";

export type RunStatus =
	| "reserved"
	| "waiting_reply"
	| "completed"
	| "completed_cooldown"
	| "completed_unparsed"
	| "send_failed"
	| "reply_timeout"
	| "manual_review"
	| "abandoned";

export interface GachaRun {
	id: number;

	kind: RunKind;
	slot_key: string | null;
	trigger_reply_note_id: string | null;

	command_text: string;
	command_note_id: string | null;

	status: RunStatus;

	response_note_id: string | null;
	response_text: string | null;

	gained_points: number | null;
	current_points: number | null;

	reserved_at: number;
	sent_at: number | null;
	completed_at: number | null;
	last_checked_at: number | null;

	error: string | null;
}

export interface MisskeyUser {
	id: string;
	username: string;
	host: string | null;
}

export interface MisskeyNote {
	id: string;
	createdAt: string;

	text: string | null;

	replyId: string | null;
	renoteId?: string | null;

	user: MisskeyUser;
}

export interface PointSummary {
	gained: number;
	current: number;
}
