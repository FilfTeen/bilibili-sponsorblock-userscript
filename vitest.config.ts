import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "https://www.bilibili.com/"
      }
    },
    setupFiles: ["./test/setup.ts"]
  }
});
