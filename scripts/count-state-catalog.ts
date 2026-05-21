import { getDb } from "../db/client.js";
import { stateByCode } from "../lib/us-states.js";

for (const st of ["TN", "CT"] as const) {
  const zones = stateByCode(st)?.hardiness_zones ?? [];
  const zoneParts = zones
    .map(
      (z) =>
        `EXISTS (SELECT 1 FROM json_each(florida_hardiness_zones) WHERE LOWER(value) = '${z}')`,
    )
    .join(" OR ");
  const overlap = (
    getDb()
      .prepare(`SELECT COUNT(*) AS n FROM plants WHERE (${zoneParts})`)
      .get() as { n: number }
  ).n;
  const tagged = (
    getDb()
      .prepare(`SELECT COUNT(*) AS n FROM plants WHERE tags LIKE '%${st.toLowerCase()}%'`)
      .get() as { n: number }
  ).n;
  const taggedImg = (
    getDb()
      .prepare(
        `SELECT COUNT(*) AS n FROM plants WHERE tags LIKE '%${st.toLowerCase()}%' AND image_url IS NOT NULL AND image_url != ''`,
      )
      .get() as { n: number }
  ).n;
  console.log(
    `${st}: ${overlap} zone-overlap in DB | ${tagged} tagged | ${taggedImg} tagged with photos`,
  );
}
