# Two plant pools

## Public catalog (`/api/plants`)

- **Used by:** Browse Plants page (`web/src/pages/BrowsePage.tsx`)
- **Data:** Full SQLite/Postgres `plants` table — your ~13k Trefle scrape plus FL seeds and enrichments
- **Default:** When you pick a state, results are filtered to that state (`for_my_area=true`: zones, natives, state tags like `tn`/`ct`/`fl`). Toggle **Show full US catalog** to see all ingested rows.
- **Not** the designer food-forest curation

## Garden designer (`/api/designer/plants`)

- **Used by:** Designer sidebar, Build For Me, companions
- **Data:** `listStateDesignerPlants()` — curated FL/TN/CT seeds + vetted DB rows for that state only
- **Never** returns the full Trefle scrape

## Production (Vercel)

Vercel uses **Supabase** when `DATABASE_URL` is set — not local `data/naturelover.db`.

If browse shows only hundreds of plants but local SQLite has 13k:

```bash
# .env must include DATABASE_URL (direct host :5432 for bulk load)
npm run db:migrate:supabase
npm run db:status:supabase
```

Check live API:

```bash
curl -s "$YOUR_SITE/api/health" | jq '.plant_count, .plants_by_source'
curl -s "$YOUR_SITE/api/plants?limit=1" | jq '.meta'
# meta.pool should be "catalog"
```

## Local dev

Without `DATABASE_URL`, the API uses `data/naturelover.db` (your Trefle sync).

With `DATABASE_URL` set in `.env`, local dev hits Supabase instead — same as production.
