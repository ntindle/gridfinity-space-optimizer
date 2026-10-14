# Scoreboard

Frozen metrics for gridfinitylayout.com. The hill is parity × speed × ease of use, measured against the whole ecosystem in `docs/feature-map.md`.

## Definitions (frozen)

- **Parity** = share of feature-map rows we support. Counting rule: `(✓ rows + 0.5 × ◐ rows) / total rows × 100`, where ✓ = shipped on main, ◐ = partially shipped or an open PR delivers part of it, ✗ = not on main. The number must come from `npm run metrics:parity`, which parses the Job tables in `docs/feature-map.md`. Tables without an `Ours` header (the CAD-library section) do not count. A PR that ships a feature must move parity, or state why it does not.
- **Speed** = Lighthouse performance score, TTI (the `interactive` audit), and input-to-preview update time (median of N=5, per the procedure in `scripts/metrics/README.md`). Bundle size is tracked alongside as the main speed lever. Noise rule: a regression of more than 5% on any speed metric versus trunk is a fail.
- **Ease** = scripted step/click count plus wall time for each core task, measured by the parent via the verification skill (live browser task). A task that cannot complete records FAIL, not a number. Core tasks: (1) enter drawer dimensions and printer size, get a bin layout; (2) adjust the grid and see the preview update; (3) export the design for printing. Add one core task per new job as jobs ship; never remove a core task without owner pause-rule approval.

## Baselines — 2026-10-14, `main` at `a486b37`

| Metric | Baseline | How measured | Notes |
|---|---|---|---|
| Parity | 27.8% (45 rows: 9 full, 7 partial, 29 missing) | `npm run metrics:parity` | D1 gaps (5): parametric baseplate generation, parametric bin generation, STL export, print checklist/BOM, stacking/plate packing |
| Bundle size | 1,039,555 bytes raw / 301,770 bytes gzip | `npm run build` then `npm run metrics:bundle` | Math vendor chunk is 633,536 bytes raw / 175,885 bytes gzip — 58% of the gzip total. The top speed lever. |
| Tests | 237 passed, 11 skipped (248 total), 17 files | `npm test` | Lint, typecheck, and build all green |
| Lighthouse perf | TODO for parent | `npm run metrics:lighthouse -- https://gridfinitylayout.com/` | Lighthouse is not installed in this environment and no Chrome is present. The parent runs it live. Do not fabricate a number. |
| TTI | TODO for parent | Same Lighthouse run (`interactive` audit) | See above |
| Input-to-preview update time | TODO for parent | Browser-task procedure in `scripts/metrics/README.md`, N=5, median | The parent runs it live. Do not fabricate numbers. |
| Ease Task 1 (drawer dims plus printer, get layout) | TODO for parent | Verification skill, live browser task | See `scripts/metrics/README.md` |
| Ease Task 2 (adjust grid, preview updates) | TODO for parent | Verification skill, live browser task | See `scripts/metrics/README.md` |
| Ease Task 3 (export design for printing) | FAIL — no export path exists on main | Verification skill, live browser task | Marketing still claims "Export designs for 3D printing (Coming Soon!)" and HowItWorks lists "Export for Printing", but no export exists. Open PR #66 (print list plus model links) and the STL gap are the unblockers. |

## History

Append one row per run. Never rewrite past rows.

| Date | Commit | PR | Parity | Lighthouse perf | TTI | Input-to-preview (median, N=5) | Ease Task 1 (steps / time) | Ease Task 2 (steps / time) | Ease Task 3 (steps / time) | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-14 | `a486b37` | Phase 0 (this PR) | 27.8% | TODO | TODO | TODO | TODO | TODO | FAIL (no export path) | Baseline recorded; live numbers TODO for parent |
