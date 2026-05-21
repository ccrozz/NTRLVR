# Supabase + Vercel deployment

Naturelover uses **SQLite** locally and **PostgreSQL (Supabase)** in production on Vercel. The API reads `DATABASE_URL`; if it is unset, the app uses `data/naturelover.db`.

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

Then run:

```bash
npm run db:migrate:supabase
```

This copies all rows from `data/naturelover.db` into Supabase. Local scripts (`npm run db:sync-state-seeds`, harvest, etc.) still use SQLite unless you also set `DATABASE_URL` locally.

## 4. Deploy on Vercel

1. Import the GitHub repo in Vercel.
2. **Environment variables** (Production + Preview):

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Supabase transaction pooler URI (above) |
| `ANTHROPIC_API_KEY` | Optional — AI garden layout / companion reasons |
| `TREFLE_API_TOKEN` | Optional — live Trefle search |

3. Build settings (already in `vercel.json`):
   - Build: `npm run build:vercel`
   - Output: `web/dist`
   - API: `api/index.ts` (Hono serverless function)

4. After deploy, set the Vite API base if needed. The web app uses `VITE_API_URL` (empty = same origin; `/api` rewrites to the function).

## 5. Verify

- `GET https://your-app.vercel.app/api/health` → `{ "status": "ok", "database": "postgres", "plant_count": ... }`
- Open the site and browse the catalog / designer.

## Local development

| Mode | Config |
|------|--------|
| SQLite (default) | Omit `DATABASE_URL`; run `npm run dev` |
| Supabase locally | Set `DATABASE_URL` in `.env`; API uses Postgres |

## Notes

- **Do not** bundle `data/naturelover.db` on Vercel — serverless has no persistent disk; use Supabase only in production.
- Re-run `npm run db:migrate:supabase` after large local DB updates, or run seed/harvest scripts with `DATABASE_URL` set (future: point scripts at async repository).
- Session pooler + `prepare: false` in `db/postgres.ts` is required for Vercel serverless (see [Supabase + serverless](https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-vercel)).
