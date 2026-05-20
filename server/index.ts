import { serve } from "@hono/node-server";
import { loadEnv } from "../lib/load-env.js";
import { app } from "./app.js";
import { DB_PATH } from "../db/client.js";

loadEnv();

const port = parseInt(process.env.PORT ?? "3001", 10);

console.log(`Naturelover API listening on http://localhost:${port}`);
console.log(`Database: ${DB_PATH}`);

serve({ fetch: app.fetch, port });
