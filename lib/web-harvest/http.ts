const USER_AGENT =
  process.env.WEB_HARVEST_USER_AGENT ??
  "Naturelover/1.0 (food forest plant guide; educational use)";

export async function webGet<T>(
  url: string,
  init?: RequestInit,
): Promise<T | null> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      ...init?.headers,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
