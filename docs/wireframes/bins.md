# Bins (F15, F16, F17, F18, F19, F34, F20)

**Status:** placing and printing bins shipped: bins are drawn in the drawing, sized, given a height
and contents, labelled, shared in links, and exported as spec STL and 3MF (F15 partial). Label tabs
shipped (F34): a Bin options switch adds a raised tab above the stacking lip to every generated bin
STL, for a stuck-on label. Not started:
dividers F18, scoop F19, magnets and screws F17, lids F16, vase mode F20.
**Demand:** D1 (bins), D2 (lids, label tabs), D3–D4 (the rest). **Slots:** S3 (toolbar), S4 (bin panel).

The job: decide which bins go where in the drawer, and get files to print them. A bin is something
you place; nothing about bins is guessed from the baseplates.

## Where it goes

Bins live in the drawing. The toolbar above it (S3) adds, fills, undoes, and clears. Selecting a bin
opens its panel under the drawing (S4). Bin rows lead the parts list, and `BinLabels` prints one label
per placed bin per drawer. New bin options become switch rows in the bin panel, never a separate card.

## Desktop

```text
┌ Results card ────────────────────────────────────────────────────────────────────┐
│ Results for 1 drawer · 22.5 × 16.5 in       [Download files] [Share link]        │
│ 6 bins · 6 baseplates · 6 spacers                                                │
│                                                                                  │
│ Drag across the grid to add a bin.  [+ Add bin] [Fill with 2 × 1] ↶ ↷ [Clear]    │
│ ┌ Drawing, to scale ─────────────────────────────────────────────────┐           │
│ │ ┌2×1───────┐┌1×1┐ ┌3×2 Screws───────┐                   │░│        │           │
│ │ │    3u    ││3u │ │       6u        │                   │░│        │           │
│ │ └──────────┘└───┘ └─────────────────■ resize handle     │░│        │           │
│ │   empty cells: drag across them to add a bin            │░│        │           │
│ │   the grid under the bins is the baseplates             │░│        │           │
│ └────────────────────────────────────────────────────────────────────┘           │
│ ┌ Bin 3 × 2 · 6u (S4, under the drawing) ────────────────────────────┐           │
│ │ Width [-] 3 [+]   Depth [-] 2 [+]   Height [-] 6u [+]      [×]     │           │
│ │ 125.5 × 83.5 mm · 45.6 mm tall with the stacking lip               │           │
│ │ Contents [Screws                                  ]                │           │
│ │ [Duplicate] [Delete]                                               │           │
│ │ later: Dividers · Scoop · Magnets · Lid (switch rows)              │           │
│ └────────────────────────────────────────────────────────────────────┘           │
│ Parts to print: bin rows first (grouped by size and height), then                │
│ baseplates and spacers                                                           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

- **Draw:** drag across empty cells. The preview snaps to cells and turns red where a bin can't go (another bin, a spacer, mixed 42 and 21 mm cells, bigger than the bed).
- **Move:** drag a bin. **Resize:** drag its corner handle, or use the Width and Depth steppers. Steppers that would collide are disabled.
- **Keyboard:** a bin is a button. Arrows move it one cell, Shift+arrows resize, Delete removes, Esc deselects, Ctrl/⌘+Z undoes, Ctrl/⌘+Shift+Z redoes. "Add bin" puts a 1 × 1 in the first free cell and focuses it.
- **Fill with …** fills every free spot with copies of the selected bin, or 1 × 1 bins when none is selected.
- New bins use the last height you set, capped by the printer's height.

## Phone

Tap a cell to add a 1 × 1 bin. Tap a bin to select it, then drag it to move it; resize with the steppers
(the corner handle is hidden on touch, and a tap there falls through to the cell). The bin panel
stacks its steppers; every target is 44 px.

## States

| State | Shows |
| --- | --- |
| No bins | Toolbar hint, and Bin labels says to add bins |
| Bin off the grid after a settings change | Red bin, "needs attention" in its name, the panel explains; left out of labels, parts, and downloads but never deleted |
| Bin bigger than the bed or taller than the printer | Same red state, with the reason in the panel |
| Half-size grid or half-size gap baseplates | Bins can sit on 21 mm cells and get 21 mm feet; a bin cannot span 42 and 21 mm cells |

## Data

- `gridfinity_bins` holds `Bin[]`: `{ id, x, y, width, depth, height, label }`. Position and size are millimetres in the drawing (multiples of 21), height is Gridfinity units (7 mm), label is at most 60 characters. `sanitizeBins` repairs what it reads.
- Pure helpers are in `src/utils/bins.ts`: `gridCells`, `tileSize`, `canPlace`, `binIssues`, `snapMove`, `snapResize`, `fillEmpty`, `groupBins`. Edits go through `useBinHistory` (last 50 steps, in memory).
- Share links are payload v2 and carry bins as `[x, y, w, d, h, label]` in 21 mm steps; labels are dropped if the link would pass 8,000 characters. v1 links still open.
- Geometry follows the Gridfinity spec via kennetek's constants: `src/utils/export/binMesh.ts`. Options belong there as parameters, each with a closed-mesh and volume test like the existing ones.

## Done when (for each new option)

- [ ] It is a switch row in the bin panel; conflicting options disable each other and say why.
- [ ] `binMesh` takes it as a parameter, with a closed, outward-facing mesh and a volume test.
- [ ] It survives share links (bump the payload version) and shows in the README of the download.
- [ ] Checked at 1440 px and 390 px, light and dark; feature-map rows updated.
