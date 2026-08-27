import { runTick } from "./service";

import type { Env } from "./types";

async function health(env: Env): Promise<Response> {
	const statusCounts = await env.DB.prepare(`
				SELECT
					status,
					COUNT(*) AS count
				FROM gacha_runs
				GROUP BY status
			`).all<{
		status: string;
		count: number;
	}>();

	const manualReview =
		statusCounts.results.find((row) => row.status === "manual_review")
			?.count ?? 0;

	return Response.json({
		service: "nicomedkey-konton-gacha-worker",
		enabled: env.ENABLED === "true",
		ok: manualReview === 0,
		manualReview,
		runs: Object.fromEntries(
			statusCounts.results.map((row) => [row.status, row.count]),
		),
		now: new Date().toISOString(),
	});
}

export default {
	async scheduled(controller, env, _ctx) {
		await runTick(env, controller.scheduledTime);
	},

	async fetch(request, env) {
		const url = new URL(request.url);

		if (
			request.method === "GET" &&
			(url.pathname === "/" || url.pathname === "/health")
		) {
			return health(env);
		}

		return new Response("Not Found", {
			status: 404,
		});
	},
} satisfies ExportedHandler<Env>;
