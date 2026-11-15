# Wireframes for upcoming features

Low-fidelity frames for the features that are not built yet. Each one shows where the feature
goes in the current UI, what to build it from, and when it counts as done. Read this page and the
frame before writing code. If a frame and the code disagree, the code wins; fix the frame in the
same PR.

## The app today

```text
┌ Header ─────────────────────────────────────────────────────────────────────────────────────┐
│ ▣ Gridfinity Layout                                                    [S6]  GitHub  Donate │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
┌ Settings column (aside, sticky on lg) ─┐ ┌ Results column ──────────────────────────────────┐
│ h1 · intro · [Take the tour]           │ │ Card: results                                    │
│ Card: settings                         │ │  Results for N drawers [Download] [Share link]   │
│  Drawer                      [in|mm]   │ │  4 bins · 6 baseplates · 6 spacers               │
│   Width [    in]  Depth [    in]       │ │  [S3] bin toolbar: Add · Fill · ↶ ↷ · Clear      │
│   › How to measure your drawer         │ │  ┌ Drawing: bins on the baseplates ───────┐      │
│   Identical drawers       [-] 1 [+]    │ │  │ [2×1][1×1] on ▦ 6×6 │ ▦ 6×6 │▦│░       │      │
│  Printer [Bambu Lab A1          ⇕]     │ │  └────────────────────────────────────────┘      │
│   10.08 × 10.08 in bed · pieces 6×6    │ │  Parts to print                 Quantity         │
│  Grid                                  │ │   ▢ Bin 2 × 1 · 3u ×2, ▦ Baseplate 6 × 6 ×2      │
│   Half-size grid               (○ )    │ │     [S4] bin panel or piece details, inline      │
│   Fill gaps with half-size     (○ )    │ │ [S5] new cards go here                           │
│   Uniform baseplates           (○ )    │ │ Card: Bin labels                                 │
│  [S1] new settings sections            │ └──────────────────────────────────────────────────┘
└────────────────────────────────────────┘
About · Accessibility · Footer
Phone: one column; settings collapse to "Title · current value ⌄" rows; sticky results bar.
```

## Slots: where new UI is allowed to go

| Slot | Where | File | Use for |
| --- | --- | --- | --- |
| S1 | New `CollapsibleCard` inside the settings `Card`, or a new row inside an existing section | `src/components/GridfinityCalculator.tsx` | Inputs that change the layout |
| S2 | Next to "Download files" and "Share link" (the `action` prop of `GridfinityResults`) | `GridfinityCalculator.tsx`, `GridfinityResults.tsx` | One more action on the whole layout, at most |
| S3 | The bin toolbar directly above the drawing | `src/components/BinToolbar.tsx`, `GridfinityVisualPreview.tsx` | Editing tools and view modes for the drawing |
| S4 | The bin panel (`BinDetails.tsx`, under the drawing) or `PieceDetails` (under a parts-list row) | `BinDetails.tsx`, `GridfinityVisualPreview.tsx` | Settings for one bin or one part |
| S5 | A new `Card` between the results card and Bin labels | `GridfinityCalculator.tsx` | A new output: print plan, bins, files |
| S6 | Header, left of GitHub | `src/components/Header.tsx` | Project-level navigation |

Do not add sections above the tool, new pages, or modals that open on load.

## Rules every feature follows

1. **Build from what exists.** `Card`, `Button` (`default` for the one primary action, `outline`, `ghost`; sizes `sm`, `default`, `icon`), `Input` with a unit suffix (copy `DimensionField` in `DrawerDimensions.tsx`), `Stepper` (small whole numbers), `SegmentedControl` (2–4 short options), switch rows (copy `OptionRow` in `BinOptions.tsx`), `CollapsibleCard`, `Dialog` (forms with several fields), `Popover` + `Command` (long searchable lists, copy `PrinterSettings.tsx`), `PieceSwatch`, `toast` from `sonner` (async results only), `vaul` drawer (phone sheets). Files go through `saveFile` in `src/utils/download.ts`; heavy work goes behind `import()` like `DownloadButton.tsx`.
2. **Formatting.** Sizes and lengths go through `formatSize`, `formatLength`, `formatDrawerSize`, `pluralize` in `src/utils/format.ts`. Use `×` not `x`, sentence case, `tabular-nums` on numbers, a unit on every measurement.
3. **Math.** Every calculation uses `unitMath` (`src/services/unitMath.ts`). Layout logic lives in `src/utils/`, not in components.
4. **Color.** Tokens only (`bg-card`, `text-muted-foreground`, `border-border`, `bg-brand-soft`, …). `brand` means selected, active, or focused; it is not decoration. Check light and dark.
5. **Motion.** `Button` already scales on press. Anything else: 150–250 ms, `ease-out`, `transform` or `opacity`, with a `motion-reduce:` fallback. No animation on keyboard actions or on things that update while typing.
6. **Phone.** Check at 390 px with touch. 44 px targets come from `pointer-coarse:` variants, and inputs are 16 px on touch. If a tool cannot work on a phone, hide it on phones; do not show a disabled stub.
7. **Accessibility.** Every control has a visible label. Toggles use `aria-pressed`. Async status goes in a live region. Focus returns to the trigger when a dialog closes. In the drawing, baseplates and spacers are `aria-hidden` and bins are buttons with full names and keyboard controls; anything else shown in the drawing must also be in the parts list or the card you add.
8. **State.** Persist with `usePersistedState('gridfinity_<name>', default)`. Put a field in share links only if it changes the layout: add it to `src/utils/shareLayout.ts`, bump the payload version, and keep older links opening.
9. **No dead ends.** Never ship "Coming soon" buttons or disabled placeholders. Unfinished UI renders only under `import.meta.env.DEV` or stays off `main`.
10. **Tests.** Vitest + Testing Library next to the component, querying by role and name. Test every state in the frame. `scripts/smoke.mjs` must still pass: parts-list button text starts with `Bin`, `Baseplate`, `Half-size baseplate`, or `Spacer`.
11. **Code style.** No comments in TS/TSX (`local/no-comments` lint), `@/` imports, `npm run lint` with zero warnings.
12. **Bookkeeping.** When a feature ships, update its row in `docs/feature-map.md` (Ours column) and the **Status** line of its frame.

## Index

| Frame | Features (feature-map IDs) | Slots | Highest demand |
| --- | --- | --- | --- |
| [print-and-export.md](print-and-export.md) | STL/3MF shipped (F25/F27); print list copy/CSV F28, print plan card F30, test-fit F32, estimates F31, STEP F26 | S2, S5 | D1 |
| [bins.md](bins.md) | Placed bins and spec bin files shipped (F15 partial); lids F16, magnets/screws F17, dividers F18, scoop and label tab F19/F34, vase F20 | S3, S4 | D1 |
| [drawer-shape.md](drawer-shape.md) | Obstacles and cutouts F8, drawer presets F12, custom grid pitch F11, spacerless fit F21 | S1, S3 | D2 |
| [layout-editor.md](layout-editor.md) | Bin drag and drop, undo/redo, shortcuts shipped (F6); baseplate edits and layers F9 | S3, S4 | D2 |
| [preview-3d.md](preview-3d.md) | 3D preview F7 | S3 | D2 |
| [projects.md](projects.md) | Several drawers per project F41, JSON import/export F40, examples F44, offline/PWA F47, sync F38 | S6 | D3 |

Build order that keeps each step useful on its own: print list (F28) → test-fit (F32) → print plan card (F30) → bin options (F18, F19, F17) → drawer presets (F12) → obstacles (F8) → 3D (F7) → projects (F41).
