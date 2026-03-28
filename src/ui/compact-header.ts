import { createProfileIcon } from "./icons";

type SearchSeed = {
  placeholder: string;
  value: string;
};

type ProfileSeed = {
  href: string;
  label: string;
  avatarSrc: string | null;
};

const GENERIC_PROFILE_LABELS = new Set([
  "",
  "个人主页",
  "个人空间",
  "大会员",
  "消息",
  "动态",
  "收藏",
  "历史",
  "创作中心",
  "投稿"
]);

const SEARCH_INPUT_SELECTORS = [
  ".bili-header__bar.mini-header .nav-search-input",
  ".bili-header__bar.mini-header input[type='search']",
  ".nav-search-input",
  "input[type='search']"
] as const;

const PROFILE_ROOT_SELECTORS = [
  ".bili-header__bar.mini-header .right-entry",
  ".bili-header .right-entry",
  ".mini-header .right-entry"
] as const;

const PROFILE_SELECTORS = [
  ".header-entry-avatar a",
  ".header-avatar-wrap a",
  ".header-entry-mini a",
  ".right-entry-item--profile a"
] as const;

function normalizeAvatarUrl(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return trimmed;
}

function coerceProfileSeed(candidate: unknown): ProfileSeed | null {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  const avatarSrc = normalizeAvatarUrl(
    typeof record.face === "string"
      ? record.face
      : typeof record.avatar === "string"
        ? record.avatar
        : typeof record.avatarUrl === "string"
          ? record.avatarUrl
          : typeof record.img_url === "string"
            ? record.img_url
            : null
  );
  if (!avatarSrc) {
    return null;
  }

  const uid =
    typeof record.mid === "number" || typeof record.mid === "string"
      ? String(record.mid)
      : typeof record.uid === "number" || typeof record.uid === "string"
        ? String(record.uid)
        : "";
  const label =
    typeof record.uname === "string"
      ? record.uname.trim()
      : typeof record.name === "string"
        ? record.name.trim()
        : typeof record.nickname === "string"
          ? record.nickname.trim()
          : "个人主页";

  return {
    href: uid ? `https://space.bilibili.com/${uid}` : "https://space.bilibili.com/",
    label: label || "个人主页",
    avatarSrc
  };
}

function resolveProfileSeedFromGlobals(): ProfileSeed | null {
  const scopedWindow = window as unknown as Record<string, unknown>;
  const candidates = [
    scopedWindow.__BILI_USER_INFO__,
    scopedWindow.__BILI_LOGIN_USER__,
    scopedWindow.__BILI_HEADER_LOGIN_USER_INFO__,
    (scopedWindow.__INITIAL_STATE__ as Record<string, unknown> | undefined)?.headerInfo,
    (scopedWindow.__INITIAL_STATE__ as Record<string, unknown> | undefined)?.loginInfo,
    (scopedWindow.__NAV__ as Record<string, unknown> | undefined)?.userInfo,
    (scopedWindow.__NAV__ as Record<string, unknown> | undefined)?.user
  ];

  for (const candidate of candidates) {
    const seed = coerceProfileSeed(candidate);
    if (seed) {
      return seed;
    }
  }

  return null;
}

function resolveSearchSeed(): SearchSeed {
  for (const selector of SEARCH_INPUT_SELECTORS) {
    const input = document.querySelector(selector);
    if (input instanceof HTMLInputElement) {
      return {
        placeholder: input.placeholder?.trim() || "搜索 B 站内容",
        value: input.value?.trim() || ""
      };
    }
  }

  return {
    placeholder: "搜索 B 站内容",
    value: ""
  };
}

function resolveProfileSeed(): ProfileSeed {
  for (const rootSelector of PROFILE_ROOT_SELECTORS) {
    const root = document.querySelector(rootSelector);
    if (!(root instanceof HTMLElement)) {
      continue;
    }

    for (const selector of PROFILE_SELECTORS) {
      const anchor = root.querySelector(selector);
      if (!(anchor instanceof HTMLAnchorElement)) {
        continue;
      }

      const label = anchor.getAttribute("aria-label")?.trim() || anchor.textContent?.trim() || "个人主页";
      if (GENERIC_PROFILE_LABELS.has(label)) {
        continue;
      }

      return {
        href: anchor.href || "https://www.bilibili.com/",
        label,
        avatarSrc: null
      };
    }
  }

  return {
    href: "https://www.bilibili.com/",
    label: "个人主页",
    avatarSrc: null
  };
}

function createSearchForm(seed: SearchSeed): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "bsb-tm-video-header-fallback-search";

  const input = document.createElement("input");
  input.type = "search";
  input.placeholder = seed.placeholder;
  input.value = seed.value;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", "搜索 B 站内容");

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "搜索";
  button.setAttribute("aria-label", "执行搜索");

  form.append(input, button);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const keyword = input.value.trim();
    if (!keyword) {
      return;
    }
    window.open(
      `https://search.bilibili.com/all?keyword=${encodeURIComponent(keyword)}`,
      "_blank",
      "noopener,noreferrer"
    );
  });

  return form;
}

function createProfileLink(seed: ProfileSeed): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = "bsb-tm-video-header-profile-link";
  link.href = seed.href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", seed.label);
  link.title = seed.label;

  if (seed.avatarSrc) {
    const image = document.createElement("img");
    image.className = "bsb-tm-video-header-avatar";
    image.alt = seed.label;
    image.src = seed.avatarSrc;
    link.appendChild(image);
    return link;
  }

  const fallback = document.createElement("span");
  fallback.className = "bsb-tm-video-header-profile-fallback";
  fallback.appendChild(createProfileIcon());

  link.appendChild(fallback);
  return link;
}

export class CompactVideoHeader {
  private readonly root = document.createElement("div");
  private readonly bar = document.createElement("div");
  private readonly searchSlot = document.createElement("div");
  private readonly profileSlot = document.createElement("div");
  private retryTimerId: number | null = null;
  private retriesRemaining = 0;
  private mounted = false;
  private profileObserver: MutationObserver | null = null;
  private lastResolvedProfileSeed: ProfileSeed | null = null;
  private remoteProfileSeed: ProfileSeed | null = null;
  private remoteProfilePromise: Promise<void> | null = null;

  constructor() {
    this.root.className = "bsb-tm-video-header-shell";
    this.bar.className = "bsb-tm-video-header-bar";
    this.searchSlot.className = "bsb-tm-video-header-search";
    this.profileSlot.className = "bsb-tm-video-header-profile";
    this.bar.append(this.searchSlot, this.profileSlot);
    this.root.appendChild(this.bar);
  }

  mount(): void {
    this.mounted = true;
    if (!this.root.isConnected) {
      document.body.prepend(this.root);
    }
    document.documentElement.classList.add("bsb-tm-video-header-compact");
    this.retriesRemaining = 10;
    this.sync();
  }

  sync(): void {
    if (!this.mounted) {
      return;
    }

    const searchSeed = resolveSearchSeed();
    const resolvedProfileSeed = resolveProfileSeed();
    const globalProfileSeed = resolveProfileSeedFromGlobals();
    // Only trust logged-in user sources for avatars. DOM avatars on video pages can
    // belong to the current UP or recommendation cards and are not stable enough.
    const authoritativeProfileSeed =
      globalProfileSeed?.avatarSrc ? globalProfileSeed : this.remoteProfileSeed?.avatarSrc ? this.remoteProfileSeed : null;
    if (authoritativeProfileSeed?.avatarSrc) {
      this.lastResolvedProfileSeed = authoritativeProfileSeed;
    }
    const profileSeed = authoritativeProfileSeed ?? this.lastResolvedProfileSeed ?? resolvedProfileSeed;
    this.searchSlot.replaceChildren(createSearchForm(searchSeed));
    this.profileSlot.replaceChildren(createProfileLink(profileSeed));
    this.syncProfileObserver(profileSeed);
    void this.ensureRemoteProfileSeed();
    this.scheduleRetry();
  }

  unmount(): void {
    this.mounted = false;
    if (this.retryTimerId !== null) {
      window.clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }
    this.profileObserver?.disconnect();
    this.profileObserver = null;
    this.lastResolvedProfileSeed = null;
    this.remoteProfileSeed = null;
    this.remoteProfilePromise = null;
    this.root.remove();
    document.documentElement.classList.remove("bsb-tm-video-header-compact");
  }

  destroy(): void {
    this.unmount();
  }

  private scheduleRetry(): void {
    if (!this.mounted || this.retriesRemaining <= 0 || this.retryTimerId !== null) {
      return;
    }

    this.retriesRemaining -= 1;
    this.retryTimerId = window.setTimeout(() => {
      this.retryTimerId = null;
      if (!this.mounted) {
        return;
      }
      this.sync();
    }, 400);
  }

  private syncProfileObserver(profileSeed: ProfileSeed): void {
    if (!this.mounted) {
      return;
    }

    if (profileSeed.avatarSrc) {
      this.profileObserver?.disconnect();
      this.profileObserver = null;
      return;
    }

    if (this.profileObserver) {
      return;
    }

    this.profileObserver = new MutationObserver(() => {
      if (!this.mounted) {
        return;
      }

      const nextSeed = resolveProfileSeed();
      const mergedSeed =
        nextSeed.avatarSrc
          ? nextSeed
          : resolveProfileSeedFromGlobals() ?? this.remoteProfileSeed ?? this.lastResolvedProfileSeed ?? nextSeed;
      if (!mergedSeed?.avatarSrc) {
        return;
      }

      this.profileObserver?.disconnect();
      this.profileObserver = null;
      this.lastResolvedProfileSeed = mergedSeed;
      this.profileSlot.replaceChildren(createProfileLink(mergedSeed));
    });

    this.profileObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "href", "aria-label", "alt"]
    });
  }

  private async ensureRemoteProfileSeed(): Promise<void> {
    if (this.remoteProfileSeed?.avatarSrc || this.remoteProfilePromise || !this.mounted || typeof fetch !== "function") {
      return;
    }

    this.remoteProfilePromise = (async () => {
      try {
        const response = await fetch("https://api.bilibili.com/x/web-interface/nav", {
          credentials: "include",
          headers: {
            Accept: "application/json"
          }
        });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { code?: number; data?: unknown };
        if (payload.code !== 0) {
          return;
        }

        const seed = coerceProfileSeed(payload.data);
        if (!seed?.avatarSrc) {
          return;
        }

        this.remoteProfileSeed = seed;
        this.lastResolvedProfileSeed = seed;
        if (!this.mounted) {
          return;
        }

        const currentSeed = resolveProfileSeed();
        const currentAvatar = normalizeAvatarUrl(currentSeed.avatarSrc);
        const remoteAvatar = normalizeAvatarUrl(seed.avatarSrc);
        if (!currentAvatar || !remoteAvatar || currentAvatar !== remoteAvatar) {
          this.profileSlot.replaceChildren(createProfileLink(seed));
        }
      } catch (_error) {
        // Ignore avatar fetch failures and keep the compact header usable without network-dependent UI.
      } finally {
        this.remoteProfilePromise = null;
      }
    })();

    await this.remoteProfilePromise;
  }
}
