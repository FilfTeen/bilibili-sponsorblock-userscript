import type { PageSnapshot, VideoContext } from "../types";
import { avidToBvid, isBvid } from "./bvid";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readIdentifier(value: unknown): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readAid(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === "string") {
    const normalized = value.replace(/^av/iu, "");
    const parsed = Number.parseInt(normalized, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

function readBvid(value: unknown): string | null {
  const bvid = readString(value);
  return bvid && isBvid(bvid) ? bvid : null;
}

function firstNonNull<T>(...values: Array<T | null>): T | null {
  for (const value of values) {
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function resolvePages(initialState: Record<string, unknown> | null): Record<string, unknown>[] {
  const videoData = asRecord(initialState?.videoData);
  const videoInfo = asRecord(initialState?.videoInfo);
  const rawPages = (videoData?.pages ?? videoInfo?.pages) as unknown;
  if (!Array.isArray(rawPages)) {
    return [];
  }
  return rawPages.map((entry) => asRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry));
}

export function extractBvidFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/BV1[a-zA-Z0-9]{9}/u);
    if (pathMatch?.[0] && isBvid(pathMatch[0])) {
      return pathMatch[0];
    }

    const searchParam = parsed.searchParams.get("bvid");
    return readBvid(searchParam);
  } catch {
    return null;
  }
}

export function extractAidFromUrl(url: string): number | null {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/(?:^|\/)av(\d+)(?:\/|$)/iu);
    if (pathMatch?.[1]) {
      return readAid(pathMatch[1]);
    }

    return firstNonNull(readAid(parsed.searchParams.get("aid")), readAid(parsed.searchParams.get("avid")));
  } catch {
    return null;
  }
}

export function extractPageFromUrl(url: string): number {
  try {
    const parsed = new URL(url);
    const rawPage = Number(parsed.searchParams.get("p") ?? "1");
    return Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  } catch {
    return 1;
  }
}

function extractCidFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return readIdentifier(parsed.searchParams.get("cid"));
  } catch {
    return null;
  }
}

function resolveCidFromPages(initialState: Record<string, unknown> | null, page: number): string | null {
  for (const entry of resolvePages(initialState)) {
    const pageNumber = readNumber(entry.page);
    const cid = readIdentifier(entry.cid);
    if (pageNumber === page && cid) {
      return cid;
    }
  }
  return null;
}

function resolveTitle(initialState: Record<string, unknown> | null): string | null {
  return firstNonNull(
    readString(initialState?.h1Title),
    readString(asRecord(initialState?.videoData)?.title),
    readString(asRecord(initialState?.videoInfo)?.title),
    readString(asRecord(initialState?.epInfo)?.title),
    readString(asRecord(initialState?.epInfo)?.longTitle),
    readString(asRecord(initialState?.mediaInfo)?.title)
  );
}

function resolvePage(snapshot: PageSnapshot, initialState: Record<string, unknown> | null): number {
  const fromUrl = extractPageFromUrl(snapshot.url);
  if (fromUrl > 1) {
    return fromUrl;
  }

  return firstNonNull(
    readNumber(snapshot.playerManifest?.p),
    readNumber(asRecord(initialState?.videoData)?.p),
    readNumber(asRecord(initialState?.videoInfo)?.p),
    1
  ) as number;
}

function resolveBvid(snapshot: PageSnapshot, initialState: Record<string, unknown> | null): string | null {
  const directBvid = firstNonNull(
    readBvid(initialState?.bvid),
    readBvid(asRecord(initialState?.videoData)?.bvid),
    readBvid(asRecord(initialState?.videoInfo)?.bvid),
    readBvid(asRecord(initialState?.epInfo)?.bvid),
    readBvid(snapshot.playerManifest?.bvid),
    extractBvidFromUrl(snapshot.url)
  );
  if (directBvid) {
    return directBvid;
  }

  const aid = firstNonNull(
    readAid(initialState?.aid),
    readAid(asRecord(initialState?.videoData)?.aid),
    readAid(asRecord(initialState?.videoInfo)?.aid),
    readAid(asRecord(initialState?.epInfo)?.aid),
    readAid(snapshot.playerManifest?.aid),
    readAid(asRecord(snapshot.playInfo)?.aid),
    readAid(asRecord(asRecord(snapshot.playInfo)?.data)?.aid),
    extractAidFromUrl(snapshot.url)
  );

  return aid ? avidToBvid(aid) : null;
}

function resolveCid(snapshot: PageSnapshot, initialState: Record<string, unknown> | null, page: number): string | null {
  return firstNonNull(
    readIdentifier(initialState?.cid),
    readIdentifier(asRecord(initialState?.videoData)?.cid),
    readIdentifier(asRecord(initialState?.videoInfo)?.cid),
    readIdentifier(asRecord(initialState?.epInfo)?.cid),
    readIdentifier(snapshot.playerManifest?.cid),
    extractCidFromUrl(snapshot.url),
    resolveCidFromPages(initialState, page)
  );
}

export function resolveVideoContext(snapshot: PageSnapshot | null): VideoContext | null {
  if (!snapshot) {
    return null;
  }

  const initialState = asRecord(snapshot.initialState);
  const page = resolvePage(snapshot, initialState);
  const bvid = resolveBvid(snapshot, initialState);

  if (!bvid) {
    return null;
  }

  return {
    bvid,
    cid: resolveCid(snapshot, initialState, page),
    page,
    title: resolveTitle(initialState),
    href: snapshot.url
  };
}
