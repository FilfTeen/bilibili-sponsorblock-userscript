import { REQUEST_TIMEOUT_MS } from "../constants";
import { gmXmlHttpRequest } from "../platform/gm";
import type {
  ActionType,
  Category,
  FetchResponse,
  SponsorTime,
  SponsorTimeHashedID,
  StoredConfig,
  VideoContext
} from "../types";
import { getHashPrefix } from "../utils/hash";
import { PersistentCache } from "../core/cache";
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

const VALID_ACTION_TYPES = new Set<ActionType>(["skip", "mute", "full", "poi"]);

function buildUrl(serverAddress: string, path: string): string {
  return `${serverAddress.replace(/\/+$/u, "")}${path}`;
}

function isSegmentRecord(value: unknown): value is SponsorTimeHashedID {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as SponsorTimeHashedID).videoID === "string" &&
    Array.isArray((value as SponsorTimeHashedID).segments)
  );
}

function sanitizeSegments(value: unknown): SponsorTime[] {
  if (!Array.isArray(value)) {
    return [];
  }

  // Only keep allow-listed categories/actions and sane numeric ranges from the remote payload.
  return value.filter((entry) => {
    if (typeof entry !== "object" || entry === null) {
      return false;
    }

    const candidate = entry as Partial<SponsorTime>;
    const secondPoint = candidate.segment?.[1];
    return (
      typeof candidate.UUID === "string" &&
      typeof candidate.category === "string" &&
      VALID_CATEGORIES.has(candidate.category as Category) &&
      typeof candidate.actionType === "string" &&
      VALID_ACTION_TYPES.has(candidate.actionType as ActionType) &&
      Array.isArray(candidate.segment) &&
      (candidate.segment.length === 1 || candidate.segment.length === 2) &&
      Number.isFinite(candidate.segment[0]) &&
      (secondPoint === undefined || (Number.isFinite(secondPoint) && secondPoint >= candidate.segment[0]))
    );
  }) as SponsorTime[];
}

export class SponsorBlockClient {
  private readonly inFlightRequests = new Map<string, Promise<FetchResponse>>();

  constructor(private readonly cache: PersistentCache<FetchResponse>) {}

  async getSegments(video: VideoContext, config: StoredConfig): Promise<SponsorTime[]> {
    const hashPrefix = await getHashPrefix(video.bvid, 4);
    const normalizedServer = normalizeServerAddress(config.serverAddress) ?? config.serverAddress;
    const cacheKey = `segments:${normalizedServer}:${hashPrefix}`;

    let response: FetchResponse | undefined;
    if (config.enableCache) {
      response = await this.cache.get(cacheKey);
    }

    if (!response) {
      response = await this.fetchWithDedup(
        cacheKey,
        buildUrl(normalizedServer, `/api/skipSegments/${hashPrefix}`)
      );

      if (config.enableCache && (response.status === 200 || response.status === 404)) {
        await this.cache.set(cacheKey, response);
      }
    }

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`SponsorBlock API returned ${response.status}`);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(response.responseText);
    } catch (_error) {
      throw new Error("SponsorBlock API returned invalid JSON");
    }

    if (!Array.isArray(payload)) {
      throw new Error("SponsorBlock API returned an unexpected payload shape");
    }

    const records = payload.filter(isSegmentRecord);
    const record = records.find((entry) => entry.videoID === video.bvid);
    return sanitizeSegments(record?.segments ?? []);
  }

  private async fetchWithDedup(cacheKey: string, url: string): Promise<FetchResponse> {
    const existing = this.inFlightRequests.get(cacheKey);
    if (existing) {
      return existing;
    }

    const request = this.fetchWithRetry(url).finally(() => {
      this.inFlightRequests.delete(cacheKey);
    });
    this.inFlightRequests.set(cacheKey, request);
    return request;
  }

  private async fetchWithRetry(url: string): Promise<FetchResponse> {
    const attempts = 2;
    let lastError: Error | null = null;

    for (let index = 0; index < attempts; index += 1) {
      try {
        // Retry once on transient 5xx failures so short upstream hiccups do not break playback UX.
        const response = await gmXmlHttpRequest({
          method: "GET",
          url,
          headers: {
            Accept: "application/json"
          },
          timeout: REQUEST_TIMEOUT_MS
        });

        if (response.ok || response.status === 404 || response.status < 500 || index === attempts - 1) {
          return response;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown request error");
        if (index === attempts - 1) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error("Request failed");
  }
}
