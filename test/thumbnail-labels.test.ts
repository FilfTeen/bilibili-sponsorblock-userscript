import { describe, expect, it, vi } from "vitest";
import { ConfigStore } from "../src/core/config-store";
import { PersistentCache } from "../src/core/cache";
import { LocalVideoLabelStore } from "../src/core/local-label-store";
import { ThumbnailLabelController } from "../src/features/thumbnail-labels";
import type { FetchResponse } from "../src/types";

function createStartedThumbnailController(
  configStore = new ConfigStore(),
  cache: PersistentCache<FetchResponse> = new PersistentCache<FetchResponse>(),
  localLabelStore = new LocalVideoLabelStore()
): ThumbnailLabelController {
  const controller = new ThumbnailLabelController(configStore, cache, localLabelStore);
  Reflect.set(controller, "started", true);
  return controller;
}

describe("thumbnail labels", () => {
  it("labels search cards without mutating the outer layout", async () => {
    window.history.replaceState({}, "", "/");

    const wrapper = document.createElement("div");
    wrapper.className = "recommended-container_floor-aside";
    wrapper.innerHTML = `
      <div class="container">
        <article class="bili-video-card">
          <a class="bili-video-card__cover" href="//www.bilibili.com/video/BV17x411w7KC/">
            <img src="https://example.com/a.jpg" alt="cover">
          </a>
        </article>
      </div>
    `;
    document.body.appendChild(wrapper);

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => "sponsor")
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const label = wrapper.querySelector<HTMLElement>(".sponsorThumbnailLabel");
    expect(label).toBeTruthy();
    expect(label?.classList.contains("sponsorThumbnailLabelVisible")).toBe(true);
    expect(label?.dataset.glassContext).toBe("overlay");
    expect(label?.textContent).toContain("商单广告");
    expect(wrapper.querySelector(".bili-video-card > .bsb-tm-thumbnail-slot > .sponsorThumbnailLabel")).toBeTruthy();
    expect(wrapper.querySelector(".bili-video-card")?.classList.contains("bsb-tm-thumbnail-card-host")).toBe(true);
    expect(wrapper.querySelector<HTMLElement>(".bili-video-card")?.style.overflow).toBe("");
    const slot = wrapper.querySelector<HTMLElement>(".bsb-tm-thumbnail-slot");
    expect(slot?.style.getPropertyValue("--bsb-thumbnail-anchor-left")).not.toBe("");
    expect(slot?.style.getPropertyValue("--bsb-thumbnail-anchor-top")).not.toBe("");
    expect(wrapper.querySelector(".bsb-tm-panel-backdrop")).toBeNull();
  });

  it("anchors corner labels to the cover geometry for history popovers", async () => {
    window.history.replaceState({}, "", "/");

    const wrapper = document.createElement("div");
    wrapper.className = "bili-header";
    wrapper.innerHTML = `
      <div class="right-entry">
        <div class="v-popover-wrap"></div>
        <div class="v-popover-wrap"></div>
        <div class="v-popover-wrap"></div>
        <div class="v-popover-wrap"></div>
        <div class="v-popover-wrap">
          <a class="header-history-card" href="https://www.bilibili.com/video/BV17x411w7KC/">
            <div class="header-history-card__cover"></div>
            <div class="header-history-card__content"></div>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);

    const card = wrapper.querySelector<HTMLElement>(".header-history-card")!;
    const cover = wrapper.querySelector<HTMLElement>(".header-history-card__cover")!;
    vi.spyOn(card, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          left: 40,
          top: 24,
          width: 236,
          height: 76,
          right: 276,
          bottom: 100,
          x: 40,
          y: 24,
          toJSON() {}
        }) as DOMRect
    );
    vi.spyOn(cover, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          left: 48,
          top: 32,
          width: 96,
          height: 54,
          right: 144,
          bottom: 86,
          x: 48,
          y: 32,
          toJSON() {}
        }) as DOMRect
    );

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => "sponsor")
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const slot = wrapper.querySelector<HTMLElement>(".header-history-card > .bsb-tm-thumbnail-slot");
    const label = wrapper.querySelector<HTMLElement>(".header-history-card > .bsb-tm-thumbnail-slot > .sponsorThumbnailLabel");
    expect(slot?.getAttribute("data-placement")).toBe("corner");
    expect(slot?.style.getPropertyValue("--bsb-thumbnail-anchor-left")).toBe("14px");
    expect(slot?.style.getPropertyValue("--bsb-thumbnail-anchor-top")).toBe("14px");
    expect(label).toBeTruthy();
    expect(label?.querySelector(".bsb-tm-thumbnail-text-stack")).toBeTruthy();
    expect(Number.parseInt(label?.style.getPropertyValue("--bsb-thumbnail-expanded-width") ?? "0", 10)).toBeGreaterThan(
      Number.parseInt(label?.style.getPropertyValue("--bsb-thumbnail-collapsed-width") ?? "0", 10)
    );
  });

  it("retries cards that currently have no full-video label instead of marking them permanently done", async () => {
    window.history.replaceState({}, "", "/");

    const wrapper = document.createElement("div");
    wrapper.className = "recommended-container_floor-aside";
    wrapper.innerHTML = `
      <div class="container">
        <article class="bili-video-card">
          <a class="bili-video-card__cover" href="https://www.bilibili.com/video/BV17x411w7KC/">
            <img src="https://example.com/a.jpg" alt="cover">
          </a>
        </article>
      </div>
    `;
    document.body.appendChild(wrapper);

    const controller = createStartedThumbnailController();
    const getWholeVideoLabel = vi.fn(async () => null);
    Reflect.set(controller, "client", { getWholeVideoLabel });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    expect(wrapper.querySelector(".sponsorThumbnailLabelVisible")).toBeNull();
    expect(wrapper.querySelector(".bili-video-card")?.hasAttribute("data-bsb-thumbnail-processed")).toBe(false);

    await refresh.call(controller);
    expect(getWholeVideoLabel).toHaveBeenCalledTimes(2);
  });

  it("falls back to learned local labels when upstream has no whole-video tag", async () => {
    window.history.replaceState({}, "", "/");

    const wrapper = document.createElement("div");
    wrapper.className = "recommended-container_floor-aside";
    wrapper.innerHTML = `
      <div class="container">
        <article class="bili-video-card">
          <a class="bili-video-card__cover" href="https://www.bilibili.com/video/BV17x411w7KC/">
            <img src="https://example.com/a.jpg" alt="cover">
          </a>
        </article>
      </div>
    `;
    document.body.appendChild(wrapper);

    const localLabelStore = new LocalVideoLabelStore();
    Reflect.set(
      localLabelStore,
      "records",
      new Map([
        [
          "BV17x411w7KC",
          {
            category: "sponsor",
            source: "manual",
            confidence: 1,
            updatedAt: Date.now()
          }
        ]
      ])
    );

    const controller = createStartedThumbnailController(new ConfigStore(), new PersistentCache(), localLabelStore);
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => null)
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const label = wrapper.querySelector<HTMLElement>(".sponsorThumbnailLabelVisible");
    expect(label?.textContent).toContain("商单广告");
  });

  it("repositions existing labels when the same card is refreshed again", async () => {
    window.history.replaceState({}, "", "/");

    const wrapper = document.createElement("div");
    wrapper.className = "recommended-container_floor-aside";
    wrapper.innerHTML = `
      <div class="container">
        <article class="bili-video-card" style="position:relative;">
          <a class="bili-video-card__cover" href="https://www.bilibili.com/video/BV17x411w7KC/" style="display:block;position:relative;width:200px;height:120px;">
            <img src="https://example.com/a.jpg" alt="cover">
          </a>
        </article>
      </div>
    `;
    document.body.appendChild(wrapper);

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => "sponsor")
    });

    const card = wrapper.querySelector<HTMLElement>(".bili-video-card")!;
    const cover = wrapper.querySelector<HTMLElement>(".bili-video-card__cover")!;
    vi.spyOn(card, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          left: 20,
          top: 40,
          width: 280,
          height: 180,
          right: 300,
          bottom: 220,
          x: 20,
          y: 40,
          toJSON() {}
        }) as DOMRect
    );
    let coverWidth = 200;
    vi.spyOn(cover, "getBoundingClientRect").mockImplementation(
      () =>
        ({
          left: 20,
          top: 56,
          width: coverWidth,
          height: 120,
          right: 20 + coverWidth,
          bottom: 176,
          x: 20,
          y: 56,
          toJSON() {}
        }) as DOMRect
    );

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const slot = wrapper.querySelector<HTMLElement>(".bsb-tm-thumbnail-slot")!;
    const initialLeft = slot.style.getPropertyValue("--bsb-thumbnail-anchor-left");

    coverWidth = 260;

    await refresh.call(controller);

    expect(slot.style.getPropertyValue("--bsb-thumbnail-anchor-left")).not.toBe("");
    expect(slot.style.getPropertyValue("--bsb-thumbnail-anchor-left")).not.toBe(initialLeft);
  });

  it("matches the title-pill priority when full-video and label endpoints disagree", async () => {
    window.history.replaceState({}, "", "/");

    const wrapper = document.createElement("div");
    wrapper.className = "recommended-container_floor-aside";
    wrapper.innerHTML = `
      <div class="container">
        <article class="bili-video-card">
          <a class="bili-video-card__cover" href="https://www.bilibili.com/video/BV17x411w7KC/">
            <img src="https://example.com/a.jpg" alt="cover">
          </a>
        </article>
      </div>
    `;
    document.body.appendChild(wrapper);

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => "exclusive_access")
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const label = wrapper.querySelector<HTMLElement>(".sponsorThumbnailLabelVisible");
    expect(label?.textContent).toContain("独家访问/抢先体验");
  });

  it("labels video-page special sidebar cards", async () => {
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const wrapper = document.createElement("div");
    wrapper.className = "right-container";
    wrapper.innerHTML = `
      <article class="video-page-special-card-small">
        <a class="card-box" href="https://www.bilibili.com/video/BV17x411w7KC/">
          <div class="pic-box"></div>
        </a>
      </article>
    `;
    document.body.appendChild(wrapper);

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => "sponsor")
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const label = wrapper.querySelector<HTMLElement>(".video-page-special-card-small .sponsorThumbnailLabelVisible");
    expect(label).toBeTruthy();
    expect(label?.getAttribute("data-placement")).toBe("corner");
  });

  it("expands corner labels when hovering the full card host", async () => {
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const wrapper = document.createElement("div");
    wrapper.className = "right-container";
    wrapper.innerHTML = `
      <article class="video-page-card-small">
        <a class="pic-box" href="https://www.bilibili.com/video/BV17x411w7KC/">
          <img src="https://example.com/a.jpg" alt="cover">
        </a>
        <div class="meta">meta</div>
      </article>
    `;
    document.body.appendChild(wrapper);

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => "exclusive_access")
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const card = wrapper.querySelector<HTMLElement>(".video-page-card-small")!;
    const label = wrapper.querySelector<HTMLElement>(".video-page-card-small .sponsorThumbnailLabelVisible")!;
    const slot = wrapper.querySelector<HTMLElement>(".video-page-card-small .bsb-tm-thumbnail-slot")!;
    card.dispatchEvent(new Event("pointerenter", { bubbles: true }));

    expect(card.dataset.bsbHover).toBe("true");
    expect(slot.dataset.bsbExpanded).toBe("true");
    expect(label.dataset.bsbExpanded).toBe("true");
  });

  it("clears expanded thumbnail state when a visible label is hidden", async () => {
    window.history.replaceState({}, "", "/video/BV1xx411c7mD");

    const wrapper = document.createElement("div");
    wrapper.className = "right-container";
    wrapper.innerHTML = `
      <article class="video-page-card-small">
        <a class="pic-box" href="https://www.bilibili.com/video/BV17x411w7KC/">
          <img src="https://example.com/a.jpg" alt="cover">
        </a>
        <div class="meta">meta</div>
      </article>
    `;
    document.body.appendChild(wrapper);

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn().mockResolvedValueOnce("exclusive_access").mockResolvedValueOnce(null)
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const card = wrapper.querySelector<HTMLElement>(".video-page-card-small")!;
    const link = wrapper.querySelector<HTMLAnchorElement>(".video-page-card-small .pic-box")!;
    const label = wrapper.querySelector<HTMLElement>(".video-page-card-small .sponsorThumbnailLabelVisible")!;
    const slot = wrapper.querySelector<HTMLElement>(".video-page-card-small .bsb-tm-thumbnail-slot")!;
    card.dispatchEvent(new Event("pointerenter", { bubbles: true }));

    expect(slot.dataset.bsbExpanded).toBe("true");
    expect(label.dataset.bsbExpanded).toBe("true");

    const originalMatches = card.matches.bind(card);
    const matches = vi.spyOn(card, "matches").mockImplementation((selector) => {
      if (selector === ":hover") {
        return true;
      }
      return originalMatches(selector);
    });
    card.dispatchEvent(new Event("pointerleave", { bubbles: true }));
    link.href = "https://www.bilibili.com/video/BV1xx411c7mD/";
    await refresh.call(controller);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    matches.mockRestore();

    expect(wrapper.querySelector(".sponsorThumbnailLabelVisible")).toBeNull();
    expect(card.dataset.bsbHover).toBeUndefined();
    expect(slot.dataset.bsbExpanded).toBeUndefined();
    expect(label.dataset.bsbExpanded).toBeUndefined();
  });

  it("falls back to the light glass variant for near-white thumbnail overrides", async () => {
    window.history.replaceState({}, "", "/");

    const wrapper = document.createElement("div");
    wrapper.className = "recommended-container_floor-aside";
    wrapper.innerHTML = `
      <div class="container">
        <article class="bili-video-card">
          <a class="bili-video-card__cover" href="//www.bilibili.com/video/BV17x411w7KC/">
            <img src="https://example.com/a.jpg" alt="cover">
          </a>
        </article>
      </div>
    `;
    document.body.appendChild(wrapper);

    const configStore = new ConfigStore();
    const snapshot = configStore.getSnapshot();
    Reflect.set(configStore, "config", {
      ...snapshot,
      categoryColorOverrides: {
        ...snapshot.categoryColorOverrides,
        sponsor: "#ffffff"
      },
      labelTransparency: {
        ...snapshot.labelTransparency,
        thumbnailLabel: true
      }
    });

    const controller = createStartedThumbnailController(configStore);
    Reflect.set(controller, "client", {
      getWholeVideoLabel: vi.fn(async () => "sponsor")
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const label = wrapper.querySelector<HTMLElement>(".sponsorThumbnailLabelVisible");
    expect(label?.dataset.glassContext).toBe("overlay");
    expect(label?.dataset.glassVariant).toBe("light");
    expect(label?.style.getPropertyValue("--category-display-accent")).not.toBe("#ffffff");
    expect(label?.style.getPropertyValue("--category-contrast")).toBe("#0f172a");
  });

  it("cancels pending idle refresh work after stop", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("requestIdleCallback", (callback: IdleRequestCallback) =>
      window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 0)
    );
    vi.stubGlobal("cancelIdleCallback", (id: number) => window.clearTimeout(id));

    const controller = createStartedThumbnailController();
    Reflect.set(controller, "started", true);
    const refreshSpy = vi.spyOn(controller as never, "refresh" as never);

    Reflect.get(controller, "scheduleRefresh").call(controller);
    vi.advanceTimersByTime(180);
    controller.stop();
    await vi.advanceTimersByTimeAsync(1);

    expect(refreshSpy).not.toHaveBeenCalled();
    expect(Reflect.get(controller, "started")).toBe(false);
    vi.useRealTimers();
  });
});
