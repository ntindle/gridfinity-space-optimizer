# Projects (F41, F40, F44, F47, F38)

**Status:** not started. **Demand:** D4 (D3 for presets and examples). **Slots:** S6, S5.

The job: plan a whole cabinet, not one drawer at a time, and keep it.

## Where it goes

A project switcher in the header (S6) and a drawer tab strip above the workspace grid in
`GridfinityCalculator.tsx`. Each drawer keeps exactly the settings the app has today.

## Desktop

```text
▣ Gridfinity Layout  /  Workshop cabinet ⇕                          GitHub  Donate
                         ┌ Popover ─────────────────────────────┐
                         │ ✓ Workshop cabinet   3 drawers       │
                         │   Kitchen junk drawer                │
                         │ ──────────────────────────────────── │
                         │ + New project                        │
                         │   Start from an example…        F44  │
                         │   Import from file…             F40  │
                         │   Export this project           F40  │
                         └──────────────────────────────────────┘

[Top drawer] [Middle drawer] [Bottom drawer] [+]          drawer tabs, above the workspace

(settings column and results card unchanged)

┌ Card: Project total (only with 2+ drawers) ──────┐
│ 3 drawers · 31 baseplates · 18 spacers           │
│ 4 plate files · 54 labels   [Print all labels]   │
└──────────────────────────────────────────────────┘
                                        S5, after the results card
```

- The switcher copies the printer picker (`Popover` + `Command`). Rename and delete live in a `⋯` menu on each row. Deleting needs confirmation, the only confirmation in this feature.
- Drawer tabs are buttons with `aria-pressed`, scroll sideways when they overflow, and support double-click (or `⋯` → Rename) to rename.
- "Print all labels" reuses `BinLabels` print styles across every drawer, with drawer names on the labels.

## Phone

The switcher shows only the project name. Drawer tabs scroll sideways under the header. The
collapsed settings summary starts with the drawer name.

## Data

- `gridfinity_projects`: `{ version: 1, activeProjectId, projects: [{ id, name, drawers: [{ id, name, settings }] }] }`, where `settings` is today's settings plus `binContents`.
- On first load, wrap the current flat `gridfinity_*` keys into "My project / Drawer 1". Leave the flat keys in place for one release, so a rollback loses nothing.
- File format (F40): one project as JSON with `"format": "gridfinity-layout/project@1"`, validated like `shareLayout.ts` (reject unknown versions, clamp numbers, cap at 50 drawers). The same file comes out of Download ▾ → Layout (JSON) in [print-and-export.md](print-and-export.md).
- Share links still share one drawer.
- Examples (F44) live in `src/lib/exampleProjects.ts` and must use real, sourced drawer sizes (see `drawerPresets.ts` in [drawer-shape.md](drawer-shape.md)).
- Offline (F47): add `vite-plugin-pwa` to cache the app shell. No install banner. Add one line to About once it works offline.
- Sync (F38): out of scope until there is a backend. Nothing here may assume an account.

## Done when

- [ ] Migration test: flat keys become one project with one drawer, with nothing lost.
- [ ] Import rejects bad files with a toast; export → import round-trips exactly.
- [ ] Switching drawers keeps each drawer's selection, contents, and labels separate (tested).
- [ ] Checked at 1440 px and 390 px, light and dark; feature-map rows updated.
