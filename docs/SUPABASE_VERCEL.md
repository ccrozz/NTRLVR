# Supabase + Vercel deployment

Naturelover uses **SQLite** locally and **Supabase** in production on Vercel:

- **`DATABASE_URL`** — Postgres connection (transaction pooler on Vercel) for plant queries via `postgres`
- **`SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`** — server admin API (health check, bypasses RLS)

If `DATABASE_URL` is unset, the app uses `data/naturelover.db`.

## 1. Create Supabase project

1. [supabase.com](https://supabase.com) → New project.
2. Save the database password.

## 2. Create tables

In the Supabase **SQL Editor**, run the full contents of:

`db/schema.pg.sql`

## 3. Migrate your local plant data

In `.env` (project root), set the **Transaction pooler** URI (port **6543**), with pooling enabled:

```env
DATABASE_URL=postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

Find this under **Project Settings → Database → Connection string → URI** (choose “Transaction” mode).

Then run (use **direct** connection on port **5432** for bulk migration — pooler `:6543` often times out):

```bash
npm run db:migrate:supabase
```

If migration stops partway (e.g. `statement timeout` at ~5000 rows), resume:

```bash
npm run db:migrate:supabase:resume
```

Check progress:

```bash
npm run db:status:supabase
```

If migrate fails with `column "native_origin" of relation "plants" does not exist`, pull latest code and re-run migrate (schema patches run automatically), or in SQL Editor:

```sql
ALTER TABLE plants ADD COLUMN IF NOT EXISTS native_origin TEXT;
```

Fix bad JSONB after an old migration (`cannot extract elements from a scalar`):

```bash
npm run db:fix:supabase-json
```

This copies all rows from `data/naturelover.db` into Supabase. Local scripts (`npm run db:sync-state-seeds`, harvest, etc.) still use SQLite unless you also set `DATABASE_URL` locally.

## 4. Deploy on Vercel

1. Import the GitHub repo in Vercel.
2. **Environment variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Optional if Vercel sets `POSTGRES_URL` from the Supabase integration |
| `POSTGRES_URL` | Auto-set by Vercel ↔ Supabase link (used when `DATABASE_URL` is empty) |
| `SUPABASE_URL` | Optional — `https://[project-ref].supabase.co` (inferred from `DATABASE_URL` if omitted) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional for browse; only needed for admin tooling |
| `ANTHROPIC_API_KEY` | Optional — AI garden layout / companion reasons |
| `TREFLE_API_TOKEN` | Optional — live Trefle search |

Vercel’s Supabase integration may set `POSTGRES_URL` instead of `DATABASE_URL`; the app accepts both. `SUPABASE_URL` can be omitted if `DATABASE_URL` uses `db.[ref].supabase.co` — the project ref is inferred.

3. Build settings (already in `vercel.json`):
   - Build: `npm run build:vercel`
   - Output: `web/dist`
   - API: `api/[...path].ts` → `server/app.ts` (one Node function; must export `{ fetch }`, not a function that returns `Response`)

4. **No separate API host.** Leave `VITE_API_URL` unset in Vercel so the SPA calls same-origin `/api/...`. Use `npm run dev` locally (Vite proxies `/api` → `localhost:3001`).

## 5. Verify

- `GET https://your-app.vercel.app/api/health` → `{ "status": "ok", "database": "postgres", "plant_count": ... }`
- Open the site and browse the catalog / designer.

## Troubleshooting

### `/api/health` or `/api/plants` pending / timeout

- **`GET /api/plants`** — public catalog (DB + seed overlay)
- **`GET /api/designer/plants`** — designer (`data/` seeds + filtered DB via `listStateDesignerPlants`)
- **`GET /api/health`** — Postgres plant count

All API routes use one serverless function (`api/[...path].ts` → `server/app.ts`). Vercel must **include** `data/**` in the function bundle (see `includeFiles` in `vercel.json`). Do not exclude `data/**`. Do not add extra `api/plants.ts` files — they become separate functions and often break.

### `default export returned a Response` / 60s timeout

The catch-all must use Vercel’s Web handler shape: `export default { fetch(request) { … } }`. A default function that returns `Response` (including `handle(app)` from `hono/vercel`) is treated as legacy Node `(req, res)` — the response is **ignored** and the invocation times out at `maxDuration`.

### Plants empty in the UI but Network shows 304 on `/api/plants`

The SPA rewrite was serving **`index.html`** for `/api/*` (HTML + `etag`, so the browser cached **304** with no JSON). `vercel.json` must **not** rewrite `/api/*` to `index.html` (use a negative lookahead, e.g. `/((?!api/).*)` → `/index.html`). Redeploy, then confirm: `curl https://your-app.vercel.app/api/ping` returns JSON, not HTML.

### `/api/health` blank or times out

1. **Redeploy** with latest code (`api/[...path].ts` with `{ fetch }` export).
2. Try **`/api/ping` first** — should return JSON instantly. If ping works but health fails, `DATABASE_URL` / Supabase is the issue.
3. **Redeploy** after setting `DATABASE_URL` (pooler, port 6543, `?pgbouncer=true`, real password).
4. Check **Vercel → Deployments → Functions → Logs**.

### Health returns `database: "sqlite"` or errors

`DATABASE_URL` is missing in Vercel. Add it and redeploy. Do not rely on `.env` in the repo — Vercel does not read it unless you use `vercel env pull` locally.

### Plants empty but health OK

Run `npm run db:fix:supabase-json` locally, then confirm `npm run db:status:supabase` shows full `total` (~13k).

## Local development

| Mode | Config |
|------|--------|
| SQLite (default) | Omit `DATABASE_URL`; run `npm run dev` |
| Supabase locally | Set `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SUPABASE_URL` in `.env` |

## Notes

- **Do not** bundle `data/naturelover.db` on Vercel — serverless has no persistent disk; use Supabase only in production.
- Re-run `npm run db:migrate:supabase` after large local DB updates, or run seed/harvest scripts with `DATABASE_URL` set (future: point scripts at async repository).
- Session pooler + `prepare: false` in `db/postgres.ts` is required for Vercel serverless (see [Supabase + serverless](https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-vercel)).
