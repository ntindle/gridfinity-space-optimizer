# Scoreboard

Hill = feature parity × speed × ease of use. Measured with `npm run measure` (builds, serves `dist/` with `vite preview`, drives headless Chromium with Playwright, runs Lighthouse). `node scripts/measure.mjs --url=<url>` measures a deployed site instead. Output lands in `measurements/latest.json`.

Method, frozen at baseline:
- Parity: (✅ + ½·🟡) / rows of `docs/feature-map.md`, `Ours` column.
- Lighthouse: performance category, default mobile simulated throttling, median of 3 runs. TTI is the `interactive` audit.
- Input-to-preview: edit drawer width (fill + Tab), time from the edit until the preview's piece list changes in the DOM (MutationObserver, `performance.now`), median of N=15, alternating 18 and 26 in.
- Core tasks: scripted steps (fills, clicks) and wall time from a fresh page with cleared storage, median of N=15.
  1. Layout: enter width and height, pick a printer, wait for baseplates.
  2. Adjust grid: same as input-to-preview.
  3. Export: passes only if an export/download control exists.
  4. Share: click "Copy share link", read the clipboard, check it holds `share=`.

## Baseline, 2026-10-14, main at a486b37

Local build on the box, three full runs; values are identical or within the spread shown.

| Metric | Local preview | Live gridfinitylayout.com |
| --- | --- | --- |
| Parity | 33.3% (11 ✅ + 2 🟡 / 36) | same |
| Lighthouse perf | 93 | 95 |
| TTI | 2557–2562 ms | 2319 ms |
| Input-to-preview (median) | 23–32 ms | 25 ms |
| Layout task | 4 steps, 330–335 ms | 4 steps, 338 ms |
| Adjust-grid task | 1 edit, 23–32 ms | 1 edit, 25 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 46–49 ms | 1 click, 68 ms |

Noise: input-to-preview varies about ±5 ms between runs, so a change must beat that to count. Biggest speed lever seen in the build: the 634 KB `math-vendor` (mathjs) chunk.
