import { BOT_USERNAME, NICOMEDKEY_ORIGIN } from "./constants";

import type { Env, MisskeyNote } from "./types";

export class MisskeyApiError extends Error {
	constructor(
		public readonly status: number,
		public readonly responseBody: string,
	) {
		super(`Misskey API error: ${status}`);
	}
}

async function apiPost<T>(
	env: Env,
	endpoint: string,
	body: Record<string, unknown>,
): Promise<T> {
	const response = await fetch(`${NICOMEDKEY_ORIGIN}/api/${endpoint}`, {
		method: "POST",

		headers: {
			"Content-Type": "application/json",

			Authorization: `Bearer ${env.NICOMEDKEY_TOKEN}`,
		},

		body: JSON.stringify(body),
	});

	const responseText = await response.text();

	if (!response.ok) {
		throw new MisskeyApiError(response.status, responseText);
	}

	return JSON.parse(responseText) as T;
}

export async function createNote(env: Env, text: string): Promise<MisskeyNote> {
	const result = await apiPost<{
		createdNote: MisskeyNote;
	}>(env, "notes/create", {
		text,
		visibility: "public",
	});

	return result.createdNote;
}

export async function getChildren(
	env: Env,
	noteId: string,
): Promise<MisskeyNote[]> {
	return apiPost<MisskeyNote[]>(env, "notes/children", {
		noteId,
		limit: 100,
	});
}

export function findKontonReply(
	notes: MisskeyNote[],
	commandNoteId: string,
): MisskeyNote | null {
	const matches = notes
		.filter((note) => {
			return (
				note.replyId === commandNoteId &&
				note.user.username === BOT_USERNAME &&
				note.user.host === null
			);
		})
		.sort((a, b) => {
			return Date.parse(a.createdAt) - Date.parse(b.createdAt);
		});

	return matches[0] ?? null;
}
