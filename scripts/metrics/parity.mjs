#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const target = resolve(process.argv[2] || "docs/feature-map.md");
const text = readFileSync(target, "utf8");
const lines = text.split("\n");
let oursIndex = -1;
let inTable = false;
let total = 0;
let full = 0;
let partial = 0;
let none = 0;
for (const raw of lines) {
  const line = raw.trim();
  if (line.startsWith("|") === false) {
    inTable = false;
    oursIndex = -1;
    continue;
  }
  const cells = line.split("|").map((cell) => cell.trim());
  if (cells[1] === "Feature" && cells[2] === "Ours") {
    oursIndex = 2;
    inTable = true;
    continue;
  }
  if (inTable === false) {
    continue;
  }
  if (line.includes("---")) {
    continue;
  }
  const value = cells[oursIndex] || "";
  const mark = value.charAt(0);
  if (mark === "✓") {
    full += 1;
    total += 1;
  } else if (mark === "◐") {
    partial += 1;
    total += 1;
  } else if (mark === "✗") {
    none += 1;
    total += 1;
  }
}
const parity = total === 0 ? 0 : ((full + partial * 0.5) / total) * 100;
const out = {
  total,
  full,
  partial,
  none,
  parityPercent: Math.round(parity * 10) / 10,
};
console.log(JSON.stringify(out, null, 2));
