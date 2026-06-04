/** Client-safe companion name matching (no DB imports). */

const COMPANION_ALIASES: Record<string, string[]> = {
  corn: ["sweet corn", "florida sweet corn", "dent corn"],
  beans: ["fava beans", "pole beans", "green beans", "bush beans"],
  marigold: ["french marigold", "marigold"],
  peas: ["southern peas", "pigeon pea", "snow peas"],
  basil: ["genovese basil", "sweet basil", "thai basil"],
  squash: ["summer squash", "zucchini", "seminole pumpkin"],
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function scoreCommonNameMatch(plantName: string, query: string): number {
  const cn = plantName.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!cn || !q) return 0;
  if (cn === q) return 100;
  if (cn.endsWith(` ${q}`)) return 85;
  const words = cn.split(/\s+/);
  if (words.includes(q)) return 75;
  const wordRe = new RegExp(`\\b${escapeRegExp(q)}\\b`);
  if (wordRe.test(cn)) return 70;
  const aliases = COMPANION_ALIASES[q];
  if (aliases?.some((a) => cn === a || cn.endsWith(` ${a}`) || cn.includes(a))) {
    return 80;
  }
  if (q.length >= 4 && cn.includes(q)) return 65;
  if (q.includes(cn)) return 50;
  return 0;
}
