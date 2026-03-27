import { REQUEST_TIMEOUT_MS } from "../constants";
import { PersistentCache } from "../core/cache";
import { gmXmlHttpRequest } from "../platform/gm";
import type { Category, FetchResponse, StoredConfig } from "../types";
import { getHashPrefix } from "../utils/hash";
import { normalizeServerAddress } from "../utils/url";

const VALID_CATEGORIES = new Set<Category>([
  "sponsor",
  "selfpromo",
  "interaction",
  "intro",
  "outro",
  "preview",
  "padding",
  "music_offtopic",
  "poi_highlight",
  "exclusive_access"
]);

type VideoLabelResponse = Array<{
  videoID?: string;
  segments?: Array<{
    category?: string;
  }>;
}>;

function buildUrl(serverAddress: string, path: string): string {
  return `${serverAddress.replace(/\/+$/u, "")}${path}`;
}

export class VideoLabelClient {
  private readonly inFlightRequests = new Map<string, Promise<FetchResponse>>();

  constructor(private readonly cache: PersistentCache<FetchResponse>) {}

  async getVideoLabel(videoId: string, config: StoredConfig): Promise<Category | null> {
    const hashPrefix = await getHashPrefix(videoId, 4);
    const normalizedServer = normalizeServerAddress(config.serverAddress) ?? config.serverAddress;
    const cacheKey = `labels:${normalizedServer}:${hashPrefix}`;

    let response: FetchResponse | undefined;
    if (config.enableCache) {
      response = await this.cache.get(cacheKey);
    }

    if (!response) {
      response = await this.fetchWithDedup(cacheKey, buildUrl(normalizedServer, `/api/videoLabels/${hashPrefix}`));

      if (config.enableCache && (response.status === 200 || response.status === 404)) {
        await this.cache.set(cacheKey, response);
      }
    }

    if (response.status === 404 || !response.ok) {
      return null;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(response.responseText);
    } catch (_error) {
      return null;
    }

    if (!Array.isArray(payload)) {
      return null;
    }

    const record = (payload as VideoLabelResponse).find((entry) => entry.videoID === videoId);
    const category = record?.segments?.[0]?.category;
    return typeof category === "string" && VALID_CATEGORIES.has(category as Category)
      ? (category as Category)
      : null;
  }

  private async fetchWithDedup(cacheKey: string, url: string): Promise<FetchResponse> {
    const existing = this.inFlightRequests.get(cacheKey);
    if (existing) {
      return existing;
    }

    const request = gmXmlHttpRequest({
      method: "GET",
      url,
      headers: {
        Accept: "application/json"
      },
      timeout: REQUEST_TIMEOUT_MS
    }).finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });
    this.inFlightRequests.set(cacheKey, request);
    return request;
  }
}
