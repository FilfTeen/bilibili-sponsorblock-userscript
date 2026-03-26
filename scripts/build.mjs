import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "dist");
const outFile = path.join(outDir, "bilibili-sponsorblock.user.js");

const version =
  process.env.GITHUB_REF_NAME?.replace(/^refs\/tags\//u, "") ||
  process.env.npm_package_version ||
  "0.1.0";

function getRepositoryUrl() {
  if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY) {
    return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`;
  }

  return "https://github.com/FilfTeen/bilibili-sponsorblock-userscript";
}

const repositoryUrl = getRepositoryUrl();
const releaseAssetUrl = `${repositoryUrl}/releases/latest/download/bilibili-sponsorblock.user.js`;

const userscriptBanner = `// ==UserScript==
// @name         Bilibili SponsorBlock Core
// @namespace    ${repositoryUrl}
// @version      ${version}
// @description  Tampermonkey core script for skipping sponsor segments on Bilibili.
// @author       FilfTeen
// @license      GPL-3.0-only
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @match        https://www.bilibili.com/bangumi/*
// @match        https://www.bilibili.com/festival/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-start
// @noframes
// @downloadURL  ${releaseAssetUrl}
// @updateURL    ${releaseAssetUrl}
// ==/UserScript==`;

await mkdir(outDir, { recursive: true });

await esbuild.build({
  absWorkingDir: rootDir,
  entryPoints: ["src/main.ts"],
  outfile: outFile,
  bundle: true,
  format: "iife",
  target: "es2022",
  platform: "browser",
  sourcemap: false,
  legalComments: "none",
  logLevel: "info",
  banner: {
    js: userscriptBanner
  },
  define: {
    __BUILD_REPOSITORY_URL__: JSON.stringify(repositoryUrl),
    __BUILD_VERSION__: JSON.stringify(version)
  }
});
