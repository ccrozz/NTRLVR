import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
type SqliteDatabase = import("better-sqlite3").Database;
type SqliteConstructor = new (filename: string) => SqliteDatabase;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
export const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(DATA_DIR, "naturelover.db");

let db: SqliteDatabase | null = null;

export function getDb(): SqliteDatabase {
  if (db) return db;

  const Database = require("better-sqlite3") as SqliteConstructor;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const conn = new Database(DB_PATH);
  conn.pragma("journal_mode = WAL");
  conn.pragma("foreign_keys = ON");

  const schemaSql = fs.readFileSync(
    path.join(__dirname, "schema.sql"),
    "utf-8",
  );
  migrate(conn);
  conn.exec(schemaSql);
  migrate(conn);

  db = conn;
  return conn;
}

function columnNames(database: SqliteDatabase): Set<string> {
  const columns = database
    .prepare("PRAGMA table_info(plants)")
    .all() as { name: string }[];
  return new Set(columns.map((c) => c.name));
}

function migrate(database: SqliteDatabase): void {
  const cols = columnNames(database);
  if (cols.size === 0) return;

  const add = (sql: string) => {
    try {
      database.exec(sql);
    } catch {
      /* column may exist */
    }
  };

  if (!cols.has("is_edible")) {
    add(
      "ALTER TABLE plants ADD COLUMN is_edible INTEGER NOT NULL DEFAULT 0",
    );
  }

  if (!cols.has("native_states")) {
    add(
      "ALTER TABLE plants ADD COLUMN native_states TEXT NOT NULL DEFAULT '[]'",
    );
  }

  if (!cols.has("grows_in_us")) {
    add(
      "ALTER TABLE plants ADD COLUMN grows_in_us INTEGER NOT NULL DEFAULT 0",
    );
    add(
      "CREATE INDEX IF NOT EXISTS idx_plants_grows_in_us ON plants(grows_in_us)",
    );
  }

  if (!cols.has("trefle_id")) {
    add("ALTER TABLE plants ADD COLUMN trefle_id INTEGER");
    add("ALTER TABLE plants ADD COLUMN trefle_slug TEXT");
    add("ALTER TABLE plants ADD COLUMN family TEXT");
    add("ALTER TABLE plants ADD COLUMN genus TEXT");
    add("ALTER TABLE plants ADD COLUMN edible_part TEXT");
    add("ALTER TABLE plants ADD COLUMN vegetable INTEGER NOT NULL DEFAULT 0");
    add("ALTER TABLE plants ADD COLUMN observations TEXT");
    add("ALTER TABLE plants ADD COLUMN synonyms TEXT NOT NULL DEFAULT '[]'");
    add("ALTER TABLE plants ADD COLUMN trefle_json TEXT");
    add(
      "CREATE INDEX IF NOT EXISTS idx_plants_trefle_slug ON plants(trefle_slug)",
    );
    add("CREATE INDEX IF NOT EXISTS idx_plants_trefle_id ON plants(trefle_id)");
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
