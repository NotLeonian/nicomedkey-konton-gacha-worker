CREATE TABLE gacha_runs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	kind TEXT NOT NULL CHECK (kind IN ('normal', 'premium')),
	slot_key TEXT,
	trigger_reply_note_id TEXT,
	command_text TEXT NOT NULL,
	command_note_id TEXT UNIQUE,
	status TEXT NOT NULL CHECK (
		status IN (
			'reserved',
			'waiting_reply',
			'completed',
			'completed_cooldown',
			'completed_unparsed',
			'send_failed',
			'reply_timeout',
			'manual_review',
			'abandoned'
		)
	),
	response_note_id TEXT UNIQUE,
	response_text TEXT,
	gained_points INTEGER,
	current_points INTEGER,
	reserved_at INTEGER NOT NULL,
	sent_at INTEGER,
	completed_at INTEGER,
	last_checked_at INTEGER,
	error TEXT
);

CREATE UNIQUE INDEX uq_normal_slot ON gacha_runs (slot_key)
WHERE kind = 'normal';

CREATE UNIQUE INDEX uq_premium_trigger ON gacha_runs (trigger_reply_note_id)
WHERE kind = 'premium';

CREATE UNIQUE INDEX uq_active_premium ON gacha_runs (kind)
WHERE
	kind = 'premium'
	AND status IN ('reserved', 'waiting_reply', 'manual_review');

CREATE INDEX ix_waiting_reply ON gacha_runs (status, sent_at);
