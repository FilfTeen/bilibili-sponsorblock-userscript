import { describe, expect, it, vi } from "vitest";
import { ConfigStore } from "../src/core/config-store";
import { PersistentCache } from "../src/core/cache";
import { ThumbnailLabelController } from "../src/features/thumbnail-labels";

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

    const controller = new ThumbnailLabelController(new ConfigStore(), new PersistentCache());
    Reflect.set(controller, "client", {
      getVideoLabel: vi.fn(async () => "sponsor")
    });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    const label = wrapper.querySelector<HTMLElement>(".sponsorThumbnailLabel");
    expect(label).toBeTruthy();
    expect(label?.classList.contains("sponsorThumbnailLabelVisible")).toBe(true);
    expect(label?.textContent).toContain("广告");
    expect(wrapper.querySelector(".bsb-tm-panel-backdrop")).toBeNull();
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

    const controller = new ThumbnailLabelController(new ConfigStore(), new PersistentCache());
    const getVideoLabel = vi.fn(async () => null);
    Reflect.set(controller, "client", { getVideoLabel });

    const refresh = Reflect.get(controller, "refresh") as () => Promise<void>;
    await refresh.call(controller);

    expect(wrapper.querySelector(".sponsorThumbnailLabelVisible")).toBeNull();
    expect(wrapper.querySelector(".bili-video-card")?.hasAttribute("data-bsb-thumbnail-processed")).toBe(false);

    await refresh.call(controller);
    expect(getVideoLabel).toHaveBeenCalledTimes(2);
  });
});
