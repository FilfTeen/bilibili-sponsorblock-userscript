import type { PageSnapshot, VideoContext } from "../types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
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

export function extractBvidFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/BV1[a-zA-Z0-9]{9}/u);
    if (pathMatch?.[0]) {
      return pathMatch[0];
    }
    const searchParam = parsed.searchParams.get("bvid");
    return searchParam?.match(/^BV1[a-zA-Z0-9]{9}$/u)?.[0] ?? null;
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

function resolvePages(initialState: Record<string, unknown> | null): Record<string, unknown>[] {
  const videoData = asRecord(initialState?.videoData);
  const videoInfo = asRecord(initialState?.videoInfo);
  const rawPages = (videoData?.pages ?? videoInfo?.pages) as unknown;
  if (!Array.isArray(rawPages)) {
    return [];
  }
  return rawPages.map((entry) => asRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry));
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
  return (
    readString(initialState?.h1Title) ||
    readString(asRecord(initialState?.videoData)?.title) ||
    readString(asRecord(initialState?.videoInfo)?.title) ||
    readString(asRecord(initialState?.epInfo)?.title)
  );
}

export function resolveVideoContext(snapshot: PageSnapshot | null): VideoContext | null {
  if (!snapshot) {
    return null;
  }

  const initialState = asRecord(snapshot.initialState);
  const page = extractPageFromUrl(snapshot.url);
  const bvid =
    readString(initialState?.bvid) ||
    readString(asRecord(initialState?.videoData)?.bvid) ||
    readString(asRecord(initialState?.videoInfo)?.bvid) ||
    readString(asRecord(initialState?.epInfo)?.bvid) ||
    readString(snapshot.playerManifest?.bvid) ||
    extractBvidFromUrl(snapshot.url);

  if (!bvid) {
    return null;
  }

  const cid =
    readIdentifier(initialState?.cid) ||
    readIdentifier(asRecord(initialState?.videoData)?.cid) ||
    readIdentifier(asRecord(initialState?.videoInfo)?.cid) ||
    readIdentifier(snapshot.playerManifest?.cid) ||
    resolveCidFromPages(initialState, page);

  return {
    bvid,
    cid,
    page,
    title: resolveTitle(initialState),
    href: snapshot.url
  };
}
