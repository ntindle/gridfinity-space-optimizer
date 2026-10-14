#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const dist = resolve(process.argv[2] || "dist");
const assets = join(dist, "assets");
const names = readdirSync(assets).sort();
const files = [];
let totalRaw = 0;
let totalGzip = 0;
for (const name of names) {
  if (name.endsWith(".js") === false && name.endsWith(".css") === false) {
    continue;
  }
  const buf = readFileSync(join(assets, name));
  const raw = buf.length;
  const gzipped = gzipSync(buf).length;
  totalRaw += raw;
  totalGzip += gzipped;
  files.push({ file: name, bytes: raw, gzipBytes: gzipped });
}
console.log(
  JSON.stringify(
    { totalBytes: totalRaw, totalGzipBytes: totalGzip, files },
    null,
    2,
  ),
);
