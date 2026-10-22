# Print and export (F28, F30, F32, F31, F25, F27, F26)

**Status:** not started. Draft PR #66 has an earlier take on the print list and stacking; reuse its
logic and ignore its UI. **Demand:** D1. **Slots:** S5 (new card), S2 (one download action).

The job: walk from the plan to the printer without retyping anything.

## Where it goes

A new `PrintPlanCard` sits between the results card and `BinLabels` in `GridfinityCalculator.tsx`.
It only renders when there is a layout. The results header gets one more action next to
"Share link": `Download ▾`.

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
│ Plate 3   ░ Spacer ×6, stacked 3 high                         6 parts     │
│ Plate 4   ▦ Baseplate 1 × 3                                   1 part      │
│                                                                           │
│ ~6 h 10 min · ~180 g PLA        estimate, from the settings in the menu ⓘ │
└───────────────────────────────────────────────────────────────────────────┘

Download ▾  →  Parts list (CSV)
               Layout (JSON)
               ─────────────
               Baseplates (STL)   only when F25 exists
               Plate files (3MF)  only when F27 exists
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

## Data

- Plate packing is a pure function in `src/utils/printPlan.ts`: `planPlates(groups, printerSize, options) → Plate[]`, where `Plate = { parts: { key: string; count: number }[] }`. Use first-fit decreasing on footprint and `unitMath` for every size. Spacers stack: `stackHeight` is limited by the printer's `z`.
- CSV columns, in order: `part,grid_size,width_mm,depth_mm,per_drawer,total`. Values come from `getPreviewPieceDetails`.
- Layout JSON is the project format from [projects.md](projects.md), so a downloaded file can be imported later.
- Only "Test fit" is persisted: `gridfinity_testFit`. The plan is derived from the layout and is never stored.

## Done when

- [ ] `planPlates` has unit tests: one plate, many plates, spacers stacking, and a part as big as the bed.
- [ ] Card and copy/download tested with Testing Library (download via a stubbed `URL.createObjectURL`).
- [ ] Checked at 1440 px and 390 px, light and dark.
- [ ] F28 and F30 rows in `docs/feature-map.md` updated; F32 too if the test-fit switch shipped.
