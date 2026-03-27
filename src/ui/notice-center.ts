import type { NoticeOptions } from "../types";

export class NoticeCenter {
  private readonly root: HTMLDivElement;
  private readonly notices = new Map<string, HTMLDivElement>();
  private readonly timers = new Map<string, number>();
  private host: HTMLElement | null = null;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "bsb-tm-notice-root is-floating";
  }

  private ensureAttached(): void {
    const parent = this.host?.isConnected ? this.host : document.documentElement;
    if (this.root.parentElement !== parent) {
      parent.appendChild(this.root);
    }
    this.root.classList.toggle("is-floating", parent === document.documentElement);
  }

  setHost(host: HTMLElement | null): void {
    this.host = host;
    if (host) {
      host.classList.add("bsb-tm-player-host");
    }
    if (this.root.isConnected && this.notices.size > 0) {
      this.ensureAttached();
    }
  }

  show(options: NoticeOptions): void {
    this.ensureAttached();
    this.dismiss(options.id);

    const notice = document.createElement("div");
    notice.className = "bsb-tm-notice";
    notice.dataset.noticeId = options.id;

    const title = document.createElement("div");
    title.className = "bsb-tm-notice-title";
    title.textContent = options.title;

    const message = document.createElement("div");
    message.className = "bsb-tm-notice-message";
    message.textContent = options.message;

    const body = document.createElement("div");
    body.className = "bsb-tm-notice-body";
    body.append(title, message);

    const actions = document.createElement("div");
    actions.className = "bsb-tm-notice-actions";

    for (const action of options.actions ?? []) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `bsb-tm-button ${action.variant ?? "secondary"}`;
      button.textContent = action.label;
      button.addEventListener("click", () => action.onClick());
      actions.appendChild(button);
    }

    notice.appendChild(body);
    if (actions.childElementCount > 0) {
      notice.appendChild(actions);
    }

    this.root.appendChild(notice);
    this.notices.set(options.id, notice);

    if (!options.sticky) {
      const duration = options.durationMs ?? 4000;
      const timerId = window.setTimeout(() => {
        this.dismiss(options.id);
      }, duration);
      this.timers.set(options.id, timerId);
    }
  }

  dismiss(id: string): void {
    const timerId = this.timers.get(id);
    if (timerId) {
      window.clearTimeout(timerId);
      this.timers.delete(id);
    }

    const notice = this.notices.get(id);
    if (!notice) {
      return;
    }

    notice.remove();
    this.notices.delete(id);
    if (this.notices.size === 0) {
      this.root.remove();
    }
  }

  clear(): void {
    for (const id of [...this.notices.keys()]) {
      this.dismiss(id);
    }
  }
}
