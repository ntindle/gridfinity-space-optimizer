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
│ Card: settings                         │ │  Results for N drawers   [S2] [Share link]       │
│  Drawer                      [in|mm]   │ │  6 baseplates · 6 spacers                        │
│   Width [    in]  Depth [    in]       │ │  [S3] toolbar (none yet)                         │
│   › How to measure your drawer         │ │  ┌ Drawing, to scale (aria-hidden) ───────┐      │
│   Identical drawers       [-] 1 [+]    │ │  │ ▦ 6×6 │ ▦ 6×6 │▦│░                     │      │
│  Printer [Bambu Lab A1          ⇕]     │ │  └────────────────────────────────────────┘      │
│   10.08 × 10.08 in bed · pieces 6×6    │ │  Parts list                     Quantity         │
│  Bins                                  │ │   ▦ Baseplate 6 × 6  9.92 × 9.92 in  ×2 ⌄        │
│   Half-size bins only          (○ )    │ │     [S4] piece details, inline when open         │
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
| S2 | Next to "Share link" (the `action` prop of `GridfinityResults`) | `GridfinityCalculator.tsx`, `GridfinityResults.tsx` | One or two actions on the whole layout |
| S3 | A toolbar row directly above the drawing | `src/components/GridfinityVisualPreview.tsx` | View modes and editing tools for the drawing |
| S4 | Inside `PieceDetails` (opens under a selected part) | `GridfinityVisualPreview.tsx` | Settings for one part |
| S5 | A new `Card` between the results card and Bin labels | `GridfinityCalculator.tsx` | A new output: print plan, bins, files |
| S6 | Header, left of GitHub | `src/components/Header.tsx` | Project-level navigation |

Do not add sections above the tool, new pages, or modals that open on load.

## Rules every feature follows

1. **Build from what exists.** `Card`, `Button` (`default` for the one primary action, `outline`, `ghost`; sizes `sm`, `default`, `icon`), `Input` with a unit suffix (copy `DimensionField` in `DrawerDimensions.tsx`), `SegmentedControl` (2–4 short options), switch rows (copy `OptionRow` in `BinOptions.tsx`), `CollapsibleCard`, `Dialog` (forms with several fields), `Popover` + `Command` (long searchable lists, copy `PrinterSettings.tsx`), `PieceSwatch`, `toast` from `sonner` (async results only), `vaul` drawer (phone sheets).
2. **Formatting.** Sizes and lengths go through `formatSize`, `formatLength`, `formatDrawerSize`, `pluralize` in `src/utils/format.ts`. Use `×` not `x`, sentence case, `tabular-nums` on numbers, a unit on every measurement.
3. **Math.** Every calculation uses `unitMath` (`src/services/unitMath.ts`). Layout logic lives in `src/utils/`, not in components.
4. **Color.** Tokens only (`bg-card`, `text-muted-foreground`, `border-border`, `bg-brand-soft`, …). `brand` means selected, active, or focused; it is not decoration. Check light and dark.
5. **Motion.** `Button` already scales on press. Anything else: 150–250 ms, `ease-out`, `transform` or `opacity`, with a `motion-reduce:` fallback. No animation on keyboard actions or on things that update while typing.
6. **Phone.** Check at 390 px with touch. 44 px targets come from `pointer-coarse:` variants, and inputs are 16 px on touch. If a tool cannot work on a phone, hide it on phones; do not show a disabled stub.
7. **Accessibility.** Every control has a visible label. Toggles use `aria-pressed`. Async status goes in a live region. Focus returns to the trigger when a dialog closes. The drawing stays `aria-hidden`, so anything shown in it must also be in the parts list or the card you add.
8. **State.** Persist with `usePersistedState('gridfinity_<name>', default)`. Put a field in share links only if it changes the layout: add it to `src/utils/shareLayout.ts`, bump the payload version, and keep older links opening.
9. **No dead ends.** Never ship "Coming soon" buttons or disabled placeholders. Unfinished UI renders only under `import.meta.env.DEV` or stays off `main`.
10. **Tests.** Vitest + Testing Library next to the component, querying by role and name. Test every state in the frame. `scripts/smoke.mjs` must still pass: parts-list button text starts with `Baseplate`, `Half-size bin`, or `Spacer`.
11. **Code style.** No comments in TS/TSX (`local/no-comments` lint), `@/` imports, `npm run lint` with zero warnings.
12. **Bookkeeping.** When a feature ships, update its row in `docs/feature-map.md` (Ours column) and the **Status** line of its frame.

## Index

| Frame | Features (feature-map IDs) | Slots | Highest demand |
| --- | --- | --- | --- |
| [print-and-export.md](print-and-export.md) | Print list copy/CSV F28, print plates and stacking F30, test-fit F32, estimates F31, STL/3MF/STEP F25/F27/F26 | S2, S5 | D1 |
| [bins.md](bins.md) | Bin generation F15, lids F16, magnets/screws F17, dividers F18, scoop and label tab F19/F34, vase F20 | S5, S4 | D1 |
| [drawer-shape.md](drawer-shape.md) | Obstacles and cutouts F8, drawer presets F12, custom grid pitch F11, spacerless fit F21 | S1, S3 | D2 |
| [layout-editor.md](layout-editor.md) | Drag and drop F6, undo/redo and shortcuts, layers F9 | S3, S4 | D2 |
| [preview-3d.md](preview-3d.md) | 3D preview F7 | S3 | D2 |
| [projects.md](projects.md) | Several drawers per project F41, JSON import/export F40, examples F44, offline/PWA F47, sync F38 | S6 | D3 |

Build order that keeps each step useful on its own: print list (F28) → test-fit (F32) → print plates (F30) → drawer presets (F12) → obstacles (F8) → bins (F15) → editor (F6) → 3D (F7) → projects (F41).
