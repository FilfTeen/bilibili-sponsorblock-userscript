import { describe, expect, it, vi } from "vitest";
import { TitleBadge } from "../src/ui/title-badge";
import type { SegmentRecord } from "../src/types";

const fullSegment: SegmentRecord = {
  UUID: "segment-full",
  category: "exclusive_access",
  actionType: "full",
  segment: [0, 100],
  start: 0,
  end: 100,
  duration: 100,
  mode: "notice"
};

describe("title badge", () => {
  it("mounts before the video title and triggers vote callbacks", async () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <h1>测试视频</h1>
      </div>
    `;

    const onVote = vi.fn(async () => "submitted" as const);
    const onOpenSettings = vi.fn();
    const badge = new TitleBadge({ onVote, onLocalDecision: vi.fn(async () => {}), onOpenSettings });
    badge.setColorOverrides({ exclusive_access: "#228b5d" });

    badge.setSegment(fullSegment);

    const pill = document.querySelector<HTMLButtonElement>(".bsb-tm-title-pill");
    expect(pill).toBeTruthy();
    expect(document.querySelector(".video-info-container > .bsb-tm-title-accessories")?.contains(document.querySelector(".bsb-tm-title-pill-wrap"))).toBe(true);

    pill?.click();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    expect(document.querySelector<HTMLElement>(".bsb-tm-title-popover")?.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>(".bsb-tm-title-popover")?.classList.contains("open")).toBe(true);
    const upvoteButton = Array.from(document.querySelectorAll<HTMLButtonElement>(".bsb-tm-pill-action")).find(
      (button) => button.textContent?.includes("标记正确")
    );
    await upvoteButton?.click();

    expect(onVote).toHaveBeenCalledWith(fullSegment, 1);
    expect(document.querySelector(".bsb-tm-title-pill-wrap")?.getAttribute("data-category")).toBe("exclusive_access");
  });

  it("mounts inside the title without rewriting the title parent layout", () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <div class="video-info-title-inner">
          <h1 class="video-title">测试视频</h1>
        </div>
      </div>
    `;

    const badge = new TitleBadge({
      onVote: vi.fn(async () => "submitted" as const),
      onLocalDecision: vi.fn(async () => {}),
      onOpenSettings: vi.fn()
    });

    badge.setSegment(fullSegment);

    const title = document.querySelector<HTMLElement>(".video-title");
    const parent = title?.parentElement;
    expect(title?.classList.contains("bsb-tm-title-text")).toBe(false);
    expect(parent?.classList.contains("bsb-tm-title-layout")).toBe(false);
    expect(parent?.querySelector(":scope > .bsb-tm-title-accessories")).toBeTruthy();

    badge.destroy();

    expect(parent?.querySelector(":scope > .bsb-tm-title-accessories")).toBeNull();
    expect(parent?.classList.contains("bsb-tm-title-layout")).toBe(false);
  });

  it("keeps feedback buttons visible but disabled for label-only badges", async () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <h1>测试视频</h1>
      </div>
    `;

    const badge = new TitleBadge({
      onVote: vi.fn(async () => "submitted" as const),
      onLocalDecision: vi.fn(async () => {}),
      onOpenSettings: vi.fn()
    });

    badge.setSegment({
      ...fullSegment,
      UUID: "video-label:BV1test:sponsor",
      category: "sponsor"
    });

    document.querySelector<HTMLButtonElement>(".bsb-tm-title-pill")?.click();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".bsb-tm-pill-action"));
    const positive = buttons.find((button) => button.textContent?.includes("标记正确"));
    const negative = buttons.find((button) => button.textContent?.includes("标记有误"));
    expect(positive?.disabled).toBe(true);
    expect(negative?.disabled).toBe(true);
    expect(document.querySelector(".bsb-tm-title-popover-hint")?.textContent).toContain("没有可直接投票");
  });

  it("offers local keep/dismiss actions for locally inferred labels", async () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <h1>测试视频</h1>
      </div>
    `;

    const onLocalDecision = vi.fn(async () => {});
    const badge = new TitleBadge({
      onVote: vi.fn(async () => "submitted" as const),
      onLocalDecision,
      onOpenSettings: vi.fn()
    });

    badge.setSegment({
      ...fullSegment,
      UUID: "local-signal:BV1test:comment-suspicion:sponsor",
      category: "sponsor"
    });

    document.querySelector<HTMLButtonElement>(".bsb-tm-title-pill")?.click();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".bsb-tm-pill-action"));
    const keepButton = buttons.find((button) => button.textContent?.includes("保留本地标签"));
    const dismissButton = buttons.find((button) => button.textContent?.includes("忽略此视频"));
    expect(keepButton?.disabled).toBe(false);
    expect(dismissButton?.disabled).toBe(false);

    await dismissButton?.click();
    expect(onLocalDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        UUID: "local-signal:BV1test:comment-suspicion:sponsor"
      }),
      "dismiss"
    );
  });

  it("keeps all three popover actions mounted after layout changes", async () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <h1>测试视频</h1>
      </div>
    `;

    const badge = new TitleBadge({
      onVote: vi.fn(async () => "submitted" as const),
      onLocalDecision: vi.fn(async () => {}),
      onOpenSettings: vi.fn()
    });

    badge.setSegment({
      ...fullSegment,
      UUID: "local-signal:BV1test:comment-suspicion:selfpromo",
      category: "selfpromo"
    });

    document.querySelector<HTMLButtonElement>(".bsb-tm-title-pill")?.click();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".bsb-tm-title-popover .bsb-tm-pill-action"));
    expect(buttons).toHaveLength(3);
    expect(buttons[0]?.textContent).toContain("保留本地标签");
    expect(buttons[1]?.textContent).toContain("忽略此视频");
    expect(buttons[2]?.textContent).toContain("设置");
  });

  it("locks feedback buttons after a successful submission", async () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <h1>测试视频</h1>
      </div>
    `;

    const badge = new TitleBadge({
      onVote: vi.fn(async () => "submitted" as const),
      onLocalDecision: vi.fn(async () => {}),
      onOpenSettings: vi.fn()
    });

    badge.setSegment(fullSegment);

    document.querySelector<HTMLButtonElement>(".bsb-tm-title-pill")?.click();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const positive = Array.from(document.querySelectorAll<HTMLButtonElement>(".bsb-tm-pill-action")).find((button) =>
      button.textContent?.includes("标记正确")
    );
    expect(positive?.disabled).toBe(false);

    await positive?.click();

    document.querySelector<HTMLButtonElement>(".bsb-tm-title-pill")?.click();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

    const lockedPositive = Array.from(document.querySelectorAll<HTMLButtonElement>(".bsb-tm-pill-action")).find((button) =>
      button.textContent?.includes("标记正确")
    );
    expect(lockedPositive?.disabled).toBe(true);
    expect(document.querySelector(".bsb-tm-title-popover-hint")?.textContent).toContain("已在本机提交");
  });

  it("switches the title badge into transparent mode without losing host state", () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <h1>测试视频</h1>
      </div>
    `;

    const badge = new TitleBadge({
      onVote: vi.fn(async () => "submitted" as const),
      onLocalDecision: vi.fn(async () => {}),
      onOpenSettings: vi.fn()
    });

    badge.setTransparencyEnabled(true);
    badge.setSegment(fullSegment);

    const wrap = document.querySelector<HTMLElement>(".bsb-tm-title-pill-wrap");
    expect(wrap?.dataset.transparent).toBe("true");
    expect(wrap?.dataset.category).toBe("exclusive_access");
    expect(wrap?.dataset.glassContext).toBe("surface");
    expect(wrap?.dataset.glassVariant).toBe("dark");
    expect(wrap?.style.getPropertyValue("--bsb-category-contrast")).toBe("#0f172a");
  });

  it("falls back to the light glass variant for near-white category overrides", () => {
    document.body.innerHTML = `
      <div class="video-info-container">
        <h1>测试视频</h1>
      </div>
    `;

    const badge = new TitleBadge({
      onVote: vi.fn(async () => "submitted" as const),
      onLocalDecision: vi.fn(async () => {}),
      onOpenSettings: vi.fn()
    });

    badge.setColorOverrides({ exclusive_access: "#ffffff" });
    badge.setTransparencyEnabled(true);
    badge.setSegment(fullSegment);

    const wrap = document.querySelector<HTMLElement>(".bsb-tm-title-pill-wrap");
    expect(wrap?.dataset.glassContext).toBe("surface");
    expect(wrap?.dataset.glassVariant).toBe("light");
    expect(wrap?.style.getPropertyValue("--bsb-category-contrast")).toBe("#0f172a");
    expect(wrap?.style.getPropertyValue("--bsb-category-accent")).toBe("#ffffff");
  });
});
