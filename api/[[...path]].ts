/** Catch-all so /api/health, /api/plants, etc. hit one Hono app (not just /api). */
export { default, config } from "./handler.js";
