#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2];
if (url === undefined) {
  console.error("Usage: node scripts/metrics/lighthouse.mjs <url>");
  process.exit(1);
}
const dir = mkdtempSync(join(tmpdir(), "gridfinity-lighthouse-"));
const outPath = join(dir, "report.json");
const result = spawnSync(
  "npx",
  [
    "--no-install",
    "lighthouse",
    url,
    "--only-categories=performance,accessibility",
    "--output=json",
    "--output-path=" + outPath,
    "--chrome-flags=--headless=new --no-sandbox --disable-gpu",
  ],
  { encoding: "utf8", stdio: "inherit" },
);
if (result.status !== 0) {
  console.error("Lighthouse did not run. Install it first, then re-run this script.");
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}
const report = JSON.parse(readFileSync(outPath, "utf8"));
const audits = report.audits || {};
const categories = report.categories || {};
const summary = {
  url,
  performance: categories.performance ? categories.performance.score : null,
  accessibility: categories.accessibility ? categories.accessibility.score : null,
  interactiveMs: audits.interactive ? audits.interactive.numericValue : null,
  largestContentfulPaintMs: audits["largest-contentful-paint"]
    ? audits["largest-contentful-paint"].numericValue
    : null,
  cumulativeLayoutShift: audits["cumulative-layout-shift"]
    ? audits["cumulative-layout-shift"].numericValue
    : null,
  totalBlockingTimeMs: audits["total-blocking-time"]
    ? audits["total-blocking-time"].numericValue
    : null,
};
console.log(JSON.stringify(summary, null, 2));
rmSync(dir, { recursive: true, force: true });
