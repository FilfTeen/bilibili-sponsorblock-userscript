import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, "dist");
const USERSCRIPT_FILE_NAME = "bilibili-qol-core.user.js";
const outFile = path.join(outDir, USERSCRIPT_FILE_NAME);

const version =
  process.env.GITHUB_REF_NAME?.replace(/^refs\/tags\//u, "") ||
  process.env.npm_package_version ||
  "0.1.0";

function getRepositoryUrl() {
  if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY) {
    return `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}`;
  }

  return "https://github.com/FilfTeen/bilibili-qol-core-userscript";
}

function getRawUserscriptUrl() {
  if (process.env.GITHUB_REPOSITORY) {
    const updateRef = process.env.QOL_CORE_USERSCRIPT_UPDATE_REF || process.env.BSB_USERSCRIPT_UPDATE_REF || "main";
    return `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/${updateRef}/dist/${USERSCRIPT_FILE_NAME}`;
  }

  return `https://raw.githubusercontent.com/FilfTeen/bilibili-qol-core-userscript/main/dist/${USERSCRIPT_FILE_NAME}`;
}

const repositoryUrl = getRepositoryUrl();
const rawUserscriptUrl = getRawUserscriptUrl();

const userscriptBanner = `// ==UserScript==
// @name         Bilibili QoL Core
// @namespace    ${repositoryUrl}
// @version      ${version}
// @description  Local-first quality-of-life toolkit for Bilibili: SponsorBlock segments, labels, comment/dynamic signals, MBGA cleanup, and low-intrusion UI.
// @author       Hush_
// @license      GPL-3.0-only
// @match        https://www.bilibili.com/*
// @match        https://search.bilibili.com/*
// @match        https://t.bilibili.com/*
// @match        https://space.bilibili.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-start
// @homepageURL  ${repositoryUrl}
// @supportURL   ${repositoryUrl}/issues
// @downloadURL  ${rawUserscriptUrl}
// @updateURL    ${rawUserscriptUrl}
// ==/UserScript==`;

await mkdir(outDir, { recursive: true });

await esbuild.build({
  absWorkingDir: rootDir,
  entryPoints: ["src/main.ts"],
  outfile: outFile,
  bundle: true,
  format: "iife",
  target: "es2016",
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
