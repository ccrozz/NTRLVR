import { TrefleAuthError, TrefleRateLimitError } from "./errors.js";
import type {
  TreflePlantDetailResponse,
  TreflePlantsListResponse,
} from "./types.js";

const BASE = "https://trefle.io/api/v1";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class TrefleClient {
  private requestCount = 0;
  private windowStart = Date.now();

  constructor(
    private readonly token: string,
    private readonly minDelayMs = 550,
    private readonly maxPerMinute = 110,
  ) {}

  private async throttle(): Promise<void> {
    const now = Date.now();
    if (now - this.windowStart > 60_000) {
      this.windowStart = now;
      this.requestCount = 0;
    }
    if (this.requestCount >= this.maxPerMinute) {
      const wait = 60_000 - (now - this.windowStart) + 50;
      await sleep(wait);
      this.windowStart = Date.now();
      this.requestCount = 0;
    }
    if (this.minDelayMs > 0) await sleep(this.minDelayMs);
    this.requestCount++;
  }

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(path.startsWith("http") ? path : `${BASE}${path}`);
    url.searchParams.set("token", this.token);
    for (const [k, v] of Object.entries(params)) {
      if (v !== "") url.searchParams.set(k, v);
    }
    return url.toString();
  }

  private async fetchJson<T>(url: string, label: string): Promise<T> {
    await this.throttle();
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (res.status === 429) throw new TrefleRateLimitError();
    if (res.status === 401 || res.status === 403) {
      throw new TrefleAuthError(
        `Trefle auth failed (${res.status}) for ${label} — check TREFLE_API_TOKEN in .env`,
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Trefle ${label}: HTTP ${res.status} ${body.slice(0, 200)}`);
    }

    return (await res.json()) as T;
  }

  async fetchPlantsPage(
    page: number,
    filters: Record<string, string> = {},
  ): Promise<TreflePlantsListResponse> {
    const params: Record<string, string> = { page: String(page), ...filters };
    const url = this.buildUrl("/plants", params);
    return this.fetchJson<TreflePlantsListResponse>(url, `plants page ${page}`);
  }

  async fetchPlantBySlug(slug: string): Promise<TreflePlantDetailResponse> {
    const url = this.buildUrl(`/plants/${slug}`);
    return this.fetchJson<TreflePlantDetailResponse>(url, `plant ${slug}`);
  }

  async fetchPlantById(id: number): Promise<TreflePlantDetailResponse> {
    const url = this.buildUrl(`/plants/${id}`);
    return this.fetchJson<TreflePlantDetailResponse>(url, `plant id ${id}`);
  }

  async searchPlants(
    query: string,
    extra: Record<string, string> = {},
  ): Promise<TreflePlantsListResponse> {
    const params: Record<string, string> = { q: query, ...extra };
    const url = this.buildUrl("/plants", params);
    return this.fetchJson<TreflePlantsListResponse>(url, `search "${query}"`);
  }

  async fetchDistributionPlantsPage(
    zoneSlug: string,
    page = 1,
  ): Promise<TreflePlantsListResponse> {
    const url = this.buildUrl(`/distributions/${zoneSlug}/plants`, {
      page: String(page),
    });
    return this.fetchJson<TreflePlantsListResponse>(
      url,
      `distribution ${zoneSlug} page ${page}`,
    );
  }

  /** Parse last page number from links.last, e.g. /api/v1/plants?page=21005 */
  static parseLastPage(links: { last?: string }): number | null {
    const last = links.last;
    if (!last) return null;
    const m = last.match(/page=(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }
}
