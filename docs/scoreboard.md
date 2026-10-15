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
  5. Labels: scroll to the Bin labels section, confirm one label card per bin (spacers excluded), click "Print labels", confirm the print dialog/preview shows the label-only sheet.

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

## 2026-10-15, PR #86 (printable bin labels + half-size results fix)

Local preview, branch vs trunk measured back-to-back on the same box. TTI/Lighthouse are noisy run-to-run here (trunk alone swung 2696–3282 ms across two same-day runs), so the gate reads the overlap, not single points.

| Metric | Branch (4 runs) | Trunk (2 runs, same box/day) |
| --- | --- | --- |
| Parity | 36.1% (12 ✅ + 2 🟡 / 36) | 33.3% |
| Lighthouse perf | 84–91 | 81–92 |
| TTI | 2920–3157 ms | 2696–3282 ms |
| Input-to-preview (median) | 38.9–47.4 ms | 40.9–42.6 ms |
| Layout task | 4 steps, 430–465 ms | 4 steps, 445–470 ms |
| Adjust-grid task | 1 edit, 38.9–47.4 ms | 1 edit, 40.9–42.6 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 77–95 ms | 1 click, 71–78 ms |
| Labels task (new core task 5) | 1 click, print dialog opens label-only sheet | not supported |

Verdict: no regression past noise on any speed metric; parity +2.8pp; labels job new. Bundle delta: index chunk 157.27 → 158.91 kB (+1%).
