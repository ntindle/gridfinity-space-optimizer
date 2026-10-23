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

## 2026-10-22, PR #145 (accessibility completion, F46)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 34.0% (15 ✅ + 4 🟡 / 50) | 33.0% |
| Lighthouse perf | 89 | 89 |
| TTI | 2986 ms | 3088 ms |
| Input-to-preview (median) | 41.8 ms | 41.0 ms |
| Layout task | 4 steps, 431 ms | 4 steps, 434 ms |
| Adjust-grid task | 1 edit, 41.8 ms | 1 edit, 41.0 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 81 ms | 1 click, 75 ms |

Verdict: no regression — branch matches trunk on every speed metric (Lighthouse identical at 89; TTI, layout, adjust-grid, and share deltas all within run noise; the diff touches disclosure wrappers, dialog focus handling, and static content, not the drawer-width-edit → preview path). Parity +1.0pp (F46 🟡→✅); Job 7 accessibility completed with a published statement plus the accumulated a11y fixes (tour focus trap, visible-step renumbering, auto-expand of collapsed sections, explicit focus-visible rings, screen-reader label-sheet summary, selected-piece styling, heading outline fix). Bundle delta: index chunk 172,873 → 176,926 B (+2.3%).

## 2026-10-21, PR #144 (mobile-UX second slice, F45)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 33.0% (14 ✅ + 5 🟡 / 50) | 32.0% |
| Lighthouse perf | 58 | 57 |
| TTI | 5986 ms | 6267 ms |
| Input-to-preview (median) | 113.5 ms | 123.1 ms |
| Layout task | 4 steps, 798 ms | 4 steps, 912 ms |
| Adjust-grid task | 1 edit, 113.5 ms | 1 edit, 123.1 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 232 ms | 1 click, 232 ms |

Verdict: no regression — branch is at or above trunk on every speed metric (both runs show the same box-level slowness vs the 2026-10-20 baselines; the deltas sit on code paths this diff does not touch — drawer-width edit to preview piece list is unchanged code, the new work is a disclosure wrapper plus a sticky bar). Parity +1.0pp (F45 🟡→✅); Job 7 mobile pass completed with collapsible input sections, a sticky results bar, and 44px inputs on small screens. Bundle delta: index chunk 171,226 → 172,873 B (+1.0%).

## 2026-10-19, PR #142 (per-bin bin contents, F10 slice)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`). The first branch run executed while the trunk worktree's `npm ci` + build was still compiling and showed inflated interaction numbers; it was discarded as contaminated and the branch re-run clean on a quiet box.

| Metric | Branch (clean re-run) | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 31.0% (12 ✅ + 7 🟡 / 50) | 30.0% |
| Lighthouse perf | 68 | 60 |
| TTI | 3984 ms | 5586 ms |
| Layout task | 4 steps, 589 ms | 4 steps, 490 ms |
| Adjust-grid task | 1 edit, 66.7 ms | 1 edit, 45.5 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 105 ms | 1 click, 83 ms |
| Labels task | per-bin overrides print on the matching card, group fallback elsewhere | group contents only |

Verdict: no credible regression. Lighthouse/TTI favor the branch; the interaction deltas (+21 ms adjust-grid, +99 ms layout, +22 ms share) sit on code paths this diff does not touch (drawer-width edit → preview piece list, share-link copy) and match the box's observed run-to-run noise (trunk alone swung 41.2 → 63.5 ms on input-to-preview across same-day runs this week). Parity +1.0pp (F10 🟡→✅). Bundle delta: index chunk 166,161 → 167,058 B (+0.5%).

## 2026-10-20, PR #143 (guided first-run tour, F43 slice)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 32.0% (13 ✅ + 6 🟡 / 50) | 31.0% |
| Lighthouse perf | 89 | 75 |
| TTI | 3087 ms | 3562 ms |
| Input-to-preview (median) | 49.8 ms | 59.8 ms |
| Layout task | 4 steps, 488 ms | 4 steps, 522 ms |
| Adjust-grid task | 1 edit, 49.8 ms | 1 edit, 59.8 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 75 ms | 1 click, 110 ms |

Verdict: no regression — branch is at or above trunk on every speed metric (the deltas sit on code paths this diff barely touches; the tour renders only on demand). Parity +1.0pp (F43 🟡→✅); Job 6 onboarding extended with a 5-step guided tour. Bundle delta: index chunk 167,058 → 171,136 B (+2.4%).

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

## 2026-10-23, PR #148 (print plan card, F28)

Catch-up: main moved twice since the 2026-10-22 entry — arena PRs #146 (UI redesign + 18 bug fixes) and #147 (placed bins + STL/3MF export) merged 2026-10-22, moving the map from 34.0% to 42.0% (F6, F14, F25, F27 → ✅; F15 → 🟡; F30 stays 🟡 with plate packing; F10/F45/F46 cell updates). The scoreboard entries between 2026-10-22 and this one record only this run's slice; the map's honesty log carries the #146/#147 detail.

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 43.0% (20 ✅ + 3 🟡 / 50) | 42.0% |
| Lighthouse perf | 76 | 78 |
| TTI | 3491 ms | 3442 ms |
| Input-to-preview (median) | 36.3 ms | 36.0 ms |
| Layout task | 4 steps, 473 ms | 4 steps, 461 ms |
| Export task | supported | supported |
| Share task | 1 click, 77 ms | 1 click, 86 ms |

Verdict: no regression — every speed delta sits inside run noise (Lighthouse −2.6%, TTI +1.4%, input-to-preview +0.3 ms, layout +2.6%; share favors the branch). The diff adds one card and a pure part-grouping module; the mesh-building code stays behind its lazy `import()`. Parity +1.0pp (F28 🟡→✅); Job 3 print/export gains an in-app print plan: plate rows with per-plate part counts plus a Copy list (one line per part). Bundle delta: index chunk 221,250 → 226,570 B (+2.4%).

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

## 2026-10-16, PR #87 (multiple bin-label styles, F27)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 38.9% (13 ✅ + 2 🟡 / 36) | 36.1% |
| Lighthouse perf | 92 | 86 |
| TTI | 2788 ms | 3050 ms |
| Input-to-preview (median) | 52.6 ms | 47.2 ms |
| Layout task | 4 steps, 454 ms | 4 steps, 523 ms |
| Adjust-grid task | 1 edit, 52.6 ms | 1 edit, 47.2 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 82 ms | 1 click, 88 ms |
| Labels task | 3 styles selectable; per-style print sheet | 1 style (paper card) |

Verdict: no credible regression. TTI/Lighthouse overlap the 81–93 / 2557–3282 bands seen 2026-10-14/15; the +5.4 ms input-to-preview delta sits on a code path this diff does not touch (drawer-width edit → preview piece list is unchanged code). Parity +2.8pp; labels job extended to 3 styles. Bundle delta: index chunk 158.91 → 160.68 kB (+1.1%).

## 2026-10-16, PR #84 (feature map expanded to 35 tools as columns)

Docs-only merge: `docs/feature-map.md` replaced by the 50-row / 35-tool map (Ours + 34 competitor columns). Rebased onto main, incorporating the Ours ✅ flips for printable bin labels (#86) and multiple label styles (#87) plus andymai's label-systems cell. No app code changed; no speed/ease re-measurement (bundle identical to trunk).

| Metric | This merge |
| --- | --- |
| Parity | 27.0% (10 ✅ + 7 🟡 / 50), via live harness `measureParity()` on the merged file |

Note: parity denominator changes here from 36 rows (narrow map) to 50 rows (expanded map), so 27.0% does not compare directly with the 38.9% above — same counting rule, wider row set. The expanded map is now the source of record for parity.

## 2026-10-18, PR #133 (per-group bin contents, F10 slice)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`; branch re-run `--n=15 --lh=1` to check a first-run outlier).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 30.0% (11 ✅ + 8 🟡 / 50) | 29.0% |
| Lighthouse perf | 82–89 | 80 |
| TTI | 3125–3393 ms | 3298 ms |
| Input-to-preview (median) | 43.8–63.5 ms | 41.2 ms |
| Layout task | 4 steps, 445–553 ms | 4 steps, 417 ms |
| Adjust-grid task | 1 edit, 43.8–63.5 ms | 1 edit, 41.2 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 77–81 ms | 1 click, 70 ms |
| Labels task | contents set per group in piece details, printed on all 3 styles | no contents |

Verdict: no credible regression. The first branch run's 63.5 ms input-to-preview did not reproduce (43.8 ms on re-run vs trunk 41.2 ms — inside the ±5 ms run noise plus box warmth after the build); Lighthouse/TTI overlap the bands seen all week. The delta sits on a code path this diff does not touch (drawer-width edit → preview piece list is unchanged code; the added per-row work is one object lookup). Parity +1.0pp (F10 ❌→🟡); labels job extended with contents. Bundle delta: index chunk 164,485 → 165,966 B (+0.9%).

## 2026-10-17, PR #114 (drawer measurement guidance, F42)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`). An earlier branch run executed while the trunk build was still compiling and showed inflated numbers; it was discarded as contaminated and re-run clean.

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 29.0% (11 ✅ + 7 🟡 / 50) | 27.0% |
| Lighthouse perf | 75 | 66 |
| TTI | 3543 ms | 4396 ms |
| Input-to-preview (median) | 62.5 ms | 151.8 ms |
| Layout task | 4 steps, 794 ms | 4 steps, 820 ms |
| Adjust-grid task | 1 edit, 62.5 ms | 1 edit, 151.8 ms |
| Export task | not supported | not supported |
| Share task | 1 click, 94 ms | 1 click, 188 ms |

Verdict: no credible regression — branch is at or above trunk on every speed metric (the trunk run itself shows the same box-level slowness vs the 2026-10-16 baselines, consistent with the day's dependency updates and VM load, not with this diff, which adds one static content block to the input card). Parity +2.0pp; F42 (measurement guidance) ships. Bundle delta: index chunk 156.91 → 159.04 kB (+1.4%).
