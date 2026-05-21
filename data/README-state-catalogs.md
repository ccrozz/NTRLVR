# State designer plant catalogs

| State | Curated modules | Zones |
|-------|-----------------|-------|
| Florida | `plants.seed.ts` + `fl-*.ts` | 8b–11 |
| Tennessee | `tn-food-forest-plants.ts` + `comprehensive` + `tn-food-forest-master.ts` | 6a–8a |
| Connecticut | `ct-food-forest-plants.ts` + `comprehensive` + `ct-food-forest-master.ts` | 5b–7a |

Runtime catalog: `lib/state-designer-catalog.ts` merges seeds with SQLite (`for_my_area` + state).

## Bulk import (open web — not Trefle-only)

Primary pipeline pulls species from **iNaturalist**, **GBIF**, and **USDA PLANTS**, then enriches each row from **Wikipedia**, **USDA profiles**, and **iNaturalist/Wikimedia** photos (`enrichPlantFromWeb`).

```bash
# Full web harvest + enrich + photos (TN or CT or both)
npm run harvest:web:tn
npm run harvest:web:ct
npm run harvest:web:both

# Discover only (no DB writes)
npm run harvest:web:discover

# Lighter test run
npx tsx scripts/harvest-web-state-catalog.ts --state=TN --inat-max=200 --gbif-max=200 --import-max=50 --images

# After large imports
npm run db:tag-state-plants
npm run images:fetch:tn
npm run images:fetch:ct
```

Optional Trefle-only path (small edible API): `npm run import:state:trefle:tn`

Curated seeds: `npm run seeds:build-state-comprehensive` → `npm run db:sync-state-seeds`

**Tennessee / Connecticut master lists** (edit TSV, rebuild, sync):

```bash
# Tennessee
npm run seeds:build-tn-master
npm run db:sync-state-seeds
npx tsx scripts/backfill-designer-profiles.ts --state=TN

# Connecticut

```bash
# Edit data/ct-catalog.tsv, then:
npm run seeds:build-ct-master
npm run db:sync-state-seeds
npx tsx scripts/backfill-designer-profiles.ts --state=CT
```
