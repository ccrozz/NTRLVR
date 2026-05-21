import { Hono } from "hono";
import { handle } from "hono/vercel";
import { dbBackend } from "../db/db-config.js";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

const boot = new Hono();

/** Instant — proves the serverless function is alive (no heavy imports). */
boot.get("/api/ping", (c) =>
  c.json({
    ok: true,
    database: dbBackend(),
    has_database_url: Boolean(process.env.DATABASE_URL?.trim()),
  }),
);

boot.get("/ping", (c) =>
  c.json({
    ok: true,
    database: dbBackend(),
    has_database_url: Boolean(process.env.DATABASE_URL?.trim()),
  }),
);

async function dbHealth() {
  const { countPlants } = await import("../db/plant-repository.js");
  const plant_count = await Promise.race([
    countPlants(),
    new Promise<number>((_, reject) =>
      setTimeout(() => reject(new Error("Database query timed out (12s)")), 12_000),
    ),
  ]);
  return { status: "ok" as const, database: dbBackend(), plant_count };
}

boot.get("/api/health", async (c) => {
  if (!process.env.DATABASE_URL?.trim()) {
    return c.json(
      {
        status: "error",
        message: "DATABASE_URL is not set on Vercel",
        database: dbBackend(),
      },
      500,
    );
  }
  try {
    return c.json(await dbHealth());
  } catch (err) {
    console.error("[health]", err);
    return c.json(
      {
        status: "error",
        database: dbBackend(),
        message: err instanceof Error ? err.message : String(err),
      },
      500,
    );
  }
});

boot.get("/health", async (c) => {
  if (!process.env.DATABASE_URL?.trim()) {
    return c.json(
      {
        status: "error",
        message: "DATABASE_URL is not set on Vercel",
        database: dbBackend(),
      },
      500,
    );
  }
  try {
    return c.json(await dbHealth());
  } catch (err) {
    console.error("[health]", err);
    return c.json(
      {
        status: "error",
        database: dbBackend(),
        message: err instanceof Error ? err.message : String(err),
      },
      500,
    );
  }
});

let mainApp: Hono | null = null;

async function getMainApp(): Promise<Hono> {
  if (!mainApp) {
    const { app } = await import("../server/app.js");
    mainApp = app;
  }
  return mainApp;
}

boot.all("*", async (c) => {
  const app = await getMainApp();
  return app.fetch(c.req.raw, c.env);
});

export default handle(boot);
