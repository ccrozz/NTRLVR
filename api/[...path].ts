/**
 * Catch-all for every /api/* route. Must use Web `fetch` export — Vercel ignores
 * a default function that returns Response (causes 60s timeout).
 */
import "../data/state-seed-catalog.js";
import { app } from "../server/app.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default {
  fetch(request: Request, env: unknown): Response | Promise<Response> {
    return app.fetch(request, env);
  },
};
