# Layout editor (F6, F9, undo/redo, shortcuts)

**Status:** drag and drop, keyboard moves, and undo/redo shipped for **bins** (see [bins.md](bins.md)),
which covers F6. Not started: moving or re-splitting the automatic baseplate pieces by hand, and
layers (F9). **Demand:** D2 (drag and drop), D3 (layers). **Slots:** S3 (toolbar), S4.

The job: start from the automatic layout and move pieces by hand when it is not what you want.

## Where it goes

A toolbar row above the drawing in `GridfinityVisualPreview.tsx` (S3). Editing happens in the
drawing. The same moves are available from piece details (S4), so the drawing can stay `aria-hidden`.

## Desktop

```text
[View | Arrange]   ↶  ↷   Reset to automatic                     ⌨ Shortcuts
┌───────────────────────────────────────────────────────────────┐
│ ▦ 6×6 │ ▦ 6×6 │▦│░                                            │
│ ┌ ─ ─ ─ ┐                                                     │  dragging: piece follows the
│ ╎ 6×3 ╎ │ ▦ 6×3 │▦│░                                          │  pointer 1:1, snaps to cells
│ └ ─ ─ ─ ┘                                                     │  on drop; overlap → red outline,
│ ░░░░░░░░│░░░░░░░│░│░                                          │  drop refused, piece returns
└───────────────────────────────────────────────────────────────┘
Layers (F9):  [Layer 1 | Layer 2]  [+ Add layer]   Layer 2 sits 42 mm up

Piece details (S4), while Arrange is on:
  Position   column [-] 6 [+]   row [-] 0 [+]
  [Rotate 90°]   [Remove (becomes spacer)]
```

- Use `@dnd-kit/core` (Emil's pick for drag and drop). Pointer capture during the drag, no lift animation, and a 150 ms `ease-out` settle on drop. Under `prefers-reduced-motion`, skip the settle.
- **Keyboard:** arrows move the selected piece one cell, Shift+arrow moves it to the edge, `R` rotates, `Delete` removes, ⌘/Ctrl+Z undoes, ⌘/Ctrl+Shift+Z redoes, Esc deselects. Keyboard moves are instant, never animated.
- **Undo/redo:** keep the last 50 arrange edits in memory. Settings changes (drawer size, printer) clear the history and drop any edits that no longer fit, with a toast: "Drawer changed, so 2 manual moves were reset."
- **Reset to automatic** asks for confirmation only if there are more than 5 edits.

## Phone

Hide `Arrange` and the layer controls below `md`. View mode is unchanged. Do not show a disabled
toggle (README rule 9).

## Data

- Edits are a diff on top of the automatic layout, never a copy of it: `gridfinity_layoutEdits` holds `{ key, index, x, y, rotated, removed }[]`, in grid units.
- `applyLayoutEdits(layout, edits, drawer) → { layout, rejected }` and `validateLayout(layout, drawer) → Problem[]` (overlap, out of bounds) are pure functions in `src/utils/layoutEdits.ts`, using `unitMath`.
- Spacers are recomputed after edits, so the drawer stays filled.
- Layers: `gridfinity_layers` holds `{ id, heightMm, edits }[]`; layer 1 is the automatic layout.
- Edits change the layout, so they go into share payload v2.

## Done when

- [ ] `applyLayoutEdits` and `validateLayout` tests: move, rotate, remove, overlap rejected, out of bounds rejected, edits dropped when the drawer shrinks.
- [ ] Drag, keyboard, and piece-details moves produce the same edit records (tested).
- [ ] The parts list, labels, and print plan all reflect edited layouts.
- [ ] `smoke.mjs` still passes in View mode. Checked at 1440 px, light and dark; feature-map row updated.
