# Print and export (F28, F30, F32, F31, F25, F27, F26)

**Status:** STL and 3MF shipped as one **Download files** button in S2 (F25, F27, plate packing for F30). Print plan card shipped 2026-10-23 (S5): plate rows with per-plate part counts plus **Copy list** (one line per part); the card's print-list portion supersedes draft PR #66's earlier take (same part grouping, new UI). Test fit shipped 2026-10-25 (F32 🟡): "Test fit first" switch in the card, Plate 0 with 1 × 1 baseplate + edge spacer, counts include it, persisted as `gridfinity_testFit`; the test pieces are not in the Download files zip yet (next slice). Not started: CSV, layout JSON, estimates, STEP, stacking.
**Demand:** D1. **Slots:** S5 (new card), S2 (download, shipped).

The job: walk from the plan to the printer without retyping anything.

## Where it goes

A new `PrintPlanCard` sits between the results card and `BinLabels` in `GridfinityCalculator.tsx`.
It only renders when there is a layout. The results header already has `[Download files] [Share link]`;
`DownloadButton.tsx` builds one zip with everything (see "What ships today" below).

## Desktop

```text
┌ Card: Print plan ─────────────────────────────────────────────────────────┐
│ Print plan                                       [Copy list] [Download ▾] │
│ 12 parts on 4 plates for 1 drawer · Bambu Lab A1 (256 × 256 mm)           │
│                                                                           │
│ ┌ Test fit first ────────────────────────────────────────────────── (○ )┐ │
│ │ Print one corner (1 × 1 baseplate + edge spacer) before the rest.     │ │
│ └───────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│ Plate 1   ▦ Baseplate 6 × 6   ▦ Baseplate 6 × 6               2 parts     │
│ Plate 2   ▦ Baseplate 6 × 3   ▦ Baseplate 6 × 3   ▦ 1 × 6     3 parts     │
│ Plate 3   ░ Spacer 252 × 41.1 mm ×6                           6 parts     │
│ Plate 4   ▦ Baseplate 1 × 3                                   1 part      │
│                                                                           │
│ ~6 h 10 min · ~180 g PLA        estimate, from the settings in the menu ⓘ │
└───────────────────────────────────────────────────────────────────────────┘

Download files (shipped) → gridfinity-22.5x16.5in.zip
                            README.txt        every part with its count, every plate with its copies
                            stl/<part>-xN.stl one per distinct bin, baseplate, and spacer
                            3mf/plate-N-…3mf  packed for the printer bed; -xN means print it N times
Later, the card's own Download ▾ adds: Parts list (CSV), Layout (JSON)
```

- **Copy list** copies plain text, one line per part: `2 × Baseplate 6 × 6 (252 × 252 mm)`. Confirm with the same check-icon swap `ShareLayoutButton` uses.
- A plate row reuses `PieceSwatch` and the parts-list row height (`min-h-14`). Selecting a row highlights its parts in the drawing (same `selectedKey` mechanism as the parts list).
- **Test fit** is a switch row (copy `OptionRow`). When on, Plate 0 "Test fit" appears first and the counts include it.
- The estimate line appears only after F31 is built, and it says it is an estimate.

## Phone

Same card, one column. Plate rows wrap their part chips onto a second line. `Download ▾` opens a
`vaul` bottom sheet instead of a menu. The sticky results bar keeps its summary and does not
add actions.

## States

| State | Shows |
| --- | --- |
| No layout | Card not rendered |
| One plate | "1 plate", no plate numbers |
| Part bigger than the bed | Cannot happen: the layout splits pieces to fit. If it does, show the part in red text with "Larger than the bed" and log it in a test |
| Copy fails | Same manual-copy fallback as `ShareLayoutButton` |

## What ships today

- `src/utils/export/`: `gridfinityMesh.ts` (spec frame baseplates, solid 5 mm spacers), `binMesh.ts` (spec bins: feet per cell, 2.25 mm bridge, 0.95 mm walls, stacking lip with its 0.6 mm fillet), `stl.ts` (binary STL), `threeMf.ts` (core-spec 3MF package, no materials), `zip.ts` (fflate, deterministic dates), `exportFiles.ts` (the bundle and its README). The whole folder loads with `import()` on the first download, so it stays out of the main bundle.
- Meshes use native float math on purpose (`CLAUDE.md` explains the exception). Layout and plate math use `unitMath`.
- Every mesh is tested closed and outward-facing (each edge used once in each direction) and against an analytic volume. The 3MF plates read with zero warnings in lib3mf strict mode.

## Data

- Plate packing is `planPlates(parts, printerSize, { gap }) → Plate[]` in `src/utils/printPlan.ts`, with `Plate = { copies, parts: { key, count }[], placements: { key, x, y, width, depth, rotated }[] }`. It packs largest-first with a max-rects packer, keeps 3 mm between parts, stays inside the bed minus its exclusion zones, centers each plate, and merges identical plates into one plate with `copies`. `findPlateProblems` re-checks bounds and gaps. Bins are packed on their own plates.
- Stacking is not part of `planPlates`: stacked prints need slicer-specific separation, so the card should only suggest it in text.
- CSV columns, in order: `part,grid_size,width_mm,depth_mm,per_drawer,total`. Values come from `getPreviewPieceDetails` and the bin groups.
- Layout JSON is the project format from [projects.md](projects.md), so a downloaded file can be imported later.
- Only "Test fit" is persisted: `gridfinity_testFit`. The plan is derived from the layout and is never stored.

## Done when

- [x] `planPlates` has unit tests: one plate, many plates, identical plates, exclusion zones, rotation, and a part as big as the bed.
- [x] Download tested with Testing Library via a stubbed `URL.createObjectURL`. The card and copy list are still to do.
- [ ] Checked at 1440 px and 390 px, light and dark.
- [x] F28 and F30 rows in `docs/feature-map.md` updated; F32 too if the test-fit switch shipped.
  - 2026-10-25: test-fit switch shipped (F32 ❌→🟡); the test pieces are not in the Download files zip yet — one-click test-piece download is the next slice.
