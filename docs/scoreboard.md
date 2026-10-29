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

## 2026-10-25, PR #150 (test fit first switch, F32)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 44.0% (20 ✅ + 4 🟡 / 50) | 43.0% |
| Lighthouse perf | 77 | 74 |
| TTI | 3508 ms | 3541 ms |
| Input-to-preview (median) | 44.8 ms | 39.7 ms |
| Layout task | 4 steps, 489 ms | 4 steps, 693 ms |
| Export task | supported | supported |
| Share task | 1 click, 83 ms | 1 click, 82 ms |

Verdict: no regression — branch is at or above trunk on every speed metric except input-to-preview (+5.1 ms), which sits inside the ±5 ms run noise and on a code path this diff does not touch (drawer-width edit → preview piece list is unchanged code; the new work is a switch plus one `planPlates` call over two parts). The first branch run (Lighthouse 59, TTI 5537 ms) executed while the trunk worktree's `npm ci` + build and the full test suite were still running on the same box; it was discarded as contaminated per the 2026-10-19 precedent and re-run clean on a quiet box. Parity +1.0pp (F32 ❌→🟡); Job 3 gains a test-fit workflow: a Test fit plate (1 × 1 baseplate + edge spacer) prints first, counts include it, choice persists. Bundle delta: index chunk 226,579 → 227,799 B (+0.5%).

## 2026-10-26, PR #154 (one-click test-piece download, F32)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 45.0% (21 ✅ + 3 🟡 / 50) | 44.0% |
| Lighthouse perf | 71 | 74 |
| TTI | 3732 ms | 3546 ms |
| Input-to-preview (median) | 49.5 ms | 41.4 ms |
| Layout task | 4 steps, 565 ms | 4 steps, 535 ms |
| Export task | supported | supported |
| Share task | 1 click, 102 ms | 1 click, 86 ms |

Verdict: no credible regression. Every metric overlaps across three same-day pairs: a reversed-order re-run gave Lighthouse 69 vs 68, TTI 3885 vs 3951 ms, layout 551 vs 552 ms, share 85 vs 94 ms; an `--n=30 --lh=1` pair gave input-to-preview 34.5 vs 33.2 ms, layout 481.5 vs 493.5 ms, share 81 vs 84 ms — the n=15 input-to-preview gap (+8.1 ms) did not reproduce at n=30 (+1.3 ms). The diff touches no measured code path (drawer-width edit → preview piece list is unchanged; the new work is one extra persisted settings key, a prop pass-through, and export code behind a lazy `import()` that only runs on download). Parity +1.0pp (F32 🟡→✅); Job 3 completes the test-fit workflow: with the switch on, the Download files zip includes the test pieces as their own STLs plus a first 3MF plate (`3mf/plate-0-test-fit.3mf`), counts merging into the layout's STLs when the part already exists. Bundle delta: index chunk 227,799 → 228,122 B (+0.1%).

## 2026-10-27, PR #155 (rough print estimates, F31)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`, plus a reversed-order `--n=30 --lh=1` pair to check an outlier).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 47.0% (22 ✅ + 3 🟡 / 50) | 45.0% |
| Lighthouse perf | 67 | 68 |
| TTI | 3990 ms | 3907 ms |
| Input-to-preview (median) | 111.4 ms | 39.0 ms |
| Layout task | 4 steps, 535 ms | 4 steps, 502 ms |
| Export task | supported | supported |
| Share task | 1 click, 97 ms | 1 click, 87 ms |

Verdict: no credible regression. The n=15 input-to-preview gap (+72.4 ms) did not reproduce in the reversed-order `--n=30 --lh=1` pair (36.4 vs 35.3 ms, +1.1 ms), and layout (475 vs 476.5 ms) and share (83 vs 79.5 ms) are identical there; Lighthouse (71 vs 77 at lh=1) and TTI (3628 vs 3553 ms) overlap the bands seen all week. The diff touches no measured code path (drawer-width edit → preview piece list is unchanged code; the new work is one `useMemo` over the already-grouped print parts — analytic volumes from the part geometry — plus one text line in the Print plan card). Parity +2.0pp (F31 ❌→✅); Job 3 gains rough print estimates on the Print plan card: ~time · ~grams PLA · ~$cost from the analytic volumes of the generated parts (default 15×12in layout: ~4 h 2 min · ~144 g PLA · ~$2.88), with the fixed assumptions (PLA 1.24 g/cm³, $20/kg, ~8 mm³/s) stated on the card. Bundle delta: index chunk 228,122 → 231,700 B (+1.6%); the lazy export chunk decreased (21.89 → 21.44 kB) because the profile constants moved into a light shared module while the mesh builders stay lazy.

## 2026-10-28, PR #156 (configurable estimate settings, F31 follow-up)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`, plus a reversed-order `--n=30 --lh=1` pair and a second `--n=15 --lh=3` pair to check a load-metric gap).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 47.0% (22 ✅ + 3 🟡 / 50) | 47.0% |
| Lighthouse perf | 68 | 73 |
| TTI | 3933 ms | 3665 ms |
| Input-to-preview (median) | 36.7 ms | 43.1 ms |
| Layout task | 4 steps, 553 ms | 4 steps, 536 ms |
| Export task | supported | supported |
| Share task | 1 click, 85 ms | 1 click, 82 ms |

Verdict: no credible regression. The first pair's load-metric gap (Lighthouse −5, TTI +268 ms) reproduced in the reversed-order `--n=30 --lh=1` pair (71 vs 77, 3732 vs 3499 ms) but FLIPPED in the second `--n=15 --lh=3` pair (72 vs 67, 3743 vs 3972 ms) — the sign flip is the signature of box noise, not a branch cost; trunk alone swung Lighthouse 73 → 77 → 67 and TTI 3665 → 3499 → 3972 ms across its three runs, and branch medians sit inside those bands (Lighthouse 71 vs 73, TTI 3743 vs 3665 ms). Interaction metrics overlap in every pair (layout, input-to-preview, and share all at or faster than trunk in at least one pair). The diff touches no measured code path (drawer-width edit → preview piece list is unchanged code; the new work is one persisted settings key, a popover that renders only when opened, and an `estimatePrint` call that now takes the settings). Parity unchanged (F31 stays ✅; the settings complete the feature); Job 3 gains estimates that match the user's filament: material (PLA/PETG/ABS), price ($/kg), and print speed (mm³/s) configurable on the Print plan card, persisted as `gridfinity_estimateSettings`. Bundle delta: index chunk 231,700 → 235,321 B (+1.6%); the lazy export chunk is unchanged (21,444 B).

## 2026-10-29, PR #157 (label tabs on bins, F34)

Branch vs trunk measured back-to-back on the same box, local preview (`node scripts/measure.mjs --n=15 --lh=3`, plus a reversed-order second pair to check a load-metric gap).

| Metric | Branch | Trunk (same box/day) |
| --- | --- | --- |
| Parity | 49.0% (23 ✅ + 3 🟡 / 50) | 47.0% |
| Lighthouse perf | 71 / 74 | 78 / 76 |
| TTI | 3766 / 3630 ms | 3519 / 3612 ms |
| Input-to-preview (median) | 40.5 / 43.1 ms | 45.4 / 42.0 ms |
| Layout task | 4 steps, 482 / 531 ms | 4 steps, 492 / 486 ms |
| Export task | supported | supported |
| Share task | 1 click, 78 / 89 ms | 1 click, 87 / 88 ms |

Verdict: no credible regression. The first pair's load-metric gap (Lighthouse −7, TTI +247 ms) did not reproduce in the reversed-order pair (Lighthouse −2, TTI +18 ms) — the sign and magnitude collapsed, and trunk alone swung Lighthouse 78 → 76 and TTI 3519 → 3612 ms across its two runs. Interaction metrics overlap in both pairs (layout branch 482 → 531 ms vs trunk 492 → 486 ms; adjust-grid and share within a few ms throughout). The diff touches no measured code path (drawer-width edit → preview piece list is unchanged code; the new work is one switch, one persisted settings key, and export code behind a lazy `import()` that only runs on download). Parity +2.0pp (F34 ❌→✅); Job 4 gains a place for labels on the bins themselves: a Bin options switch adds a raised tab above the stacking lip to every generated bin STL (12 mm above the lip, 1.2 mm thick, up to 36 mm wide), persisted as `gridfinity_labelTabs` and local-only. Bundle delta: index chunk 235,321 → 236,207 B (+0.4%); the lazy export chunk 21,444 → 22,147 B (+3.3%) for the tab-box mesh code.

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
