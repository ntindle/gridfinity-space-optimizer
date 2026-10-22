# Bins (F15, F16, F17, F18, F19, F34, F20)

**Status:** not started. **Demand:** D1 (bins), D2 (lids, label tabs), D3–D4 (the rest).
**Slots:** S5 (new card), S4 (per-part shortcut).

The job: decide which bins go in the drawer, and get files to print them. Today the app only plans
baseplates; bins are new data, not a view of the existing layout.

## Where it goes

A new `BinsCard` goes in S5, after the print plan. Each bin design opens in a `Dialog` on desktop
and a full-height `vaul` sheet on phones. Piece details (S4) for a baseplate get one link,
"Add bins for this baseplate", which opens the dialog with the footprint prefilled.

## Desktop

```text
┌ Card: Bins ───────────────────────────────────────────────────────────────┐
│ Bins                                                        [+ Add a bin] │
│ 5 bins fill 30 of 72 cells                                                │
│                                                                           │
│ ▢ 2 × 1 × 6u   Scoop · Label tab · 2 dividers        Screws        ×3  ⋯  │
│ ▢ 1 × 1 × 3u   Magnets                               Washers       ×2  ⋯  │
└───────────────────────────────────────────────────────────────────────────┘

Dialog: New bin
┌───────────────────────────────────────────────┐
│ New bin                                     × │
│ Footprint   [2] × [1] cells      Height [6] u │
│ Contents    [Screws                         ] │
│ Quantity    [-] 3 [+]                         │
│ ───────────────────────────────────────────── │
│ Dividers    across [1]  front to back [0]     │
│ Scoop                                    (● ) │
│ Label tab                                (● ) │
│ Magnet holes (6 × 2 mm)                  (○ ) │
│ Screw holes (M3)                         (○ ) │
│ Lid                                      (○ ) │
│ Vase mode (single wall)                  (○ ) │
│ ───────────────────────────────────────────── │
│ ┌ top view, to scale ─┐  83.5 × 41.5 × 42 mm  │
│ └─────────────────────┘                       │
│                           [Cancel] [Add bin]  │
└───────────────────────────────────────────────┘
```

- Footprint and height use the stepper from `DrawerOptions.tsx`. Height is in Gridfinity units (7 mm each); show the result in mm next to it with `formatLength`.
- Options are switch rows (copy `OptionRow`). Switches that conflict disable each other and say why: vase mode turns off dividers, magnets, and screw holes.
- The top view reuses the drawing styles (`.piece`, `.piece-plate`). The 3D view arrives with [preview-3d.md](preview-3d.md).
- Contents reuse `BinContentsInput`, so a bin's name prints on its label exactly like baseplate names do today.

## Phone

`BinsCard` stays one column, and the `⋯` menu becomes a sheet. The dialog becomes a full-height
`vaul` sheet with a sticky footer holding [Cancel] [Add bin].

## States

| State | Shows |
| --- | --- |
| No bins | One line, "No bins yet. Add one to plan what goes in the drawer.", plus the [+ Add a bin] button |
| More cells used than the drawer has | Summary turns `text-destructive`: "38 of 36 cells: 2 too many" |
| Bin wider than the bed | Inline error under Footprint, and Add is disabled |

## Data

- `gridfinity_bins`: `BinDesign[]` with `{ id, widthUnits, depthUnits, heightUnits, quantity, contents, dividers: { x, y }, scoop, labelTab, magnets, screws, lid, vase }`.
- Bins are not in share links until share payload v2 (see README rule 8).
- Geometry and STL generation (F15/F25) belong in `src/utils/binGeometry.ts`, are pure, and run in a Web Worker if a big drawer takes longer than 50 ms. Follow the Gridfinity spec on gridfinity.xyz for the profile; do not guess dimensions.

## Done when

- [ ] Add, edit, duplicate, and delete bins, persisted and tested.
- [ ] The cell-usage summary is correct, with a test for overfilling.
- [ ] Conflicting options are disabled with a reason, and tested.
- [ ] Bin names print on labels, extending the existing `BinLabels` tests.
- [ ] Checked at 1440 px and 390 px, light and dark; feature-map rows updated.
