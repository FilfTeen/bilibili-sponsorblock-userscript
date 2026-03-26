import { beforeEach } from "vitest";

beforeEach(() => {
  document.documentElement.innerHTML = "<head></head><body></body>";
  window.history.replaceState({}, "", "/");
});
