/** Vercel Node passes `req.url` as `/api/...?query` without a host. */
export function requestSearchParams(req: Request): URLSearchParams {
  const raw = req.url;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return new URL(raw).searchParams;
  }
  const q = raw.indexOf("?");
  return new URLSearchParams(q === -1 ? "" : raw.slice(q + 1));
}
