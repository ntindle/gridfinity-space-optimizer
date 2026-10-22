# Backlog

Still-valid items carried over from `CLAUDE.md` and `REFACTOR_PLAN.md`, checked against `main` at a486b37 on 2026-10-14. Items already shipped were dropped.

## Dropped as done or stale

- Share configurations via URL: shipped in #68 (`src/utils/shareLayout.ts`).
- Phase 4 service layer: the plan lists `services/storage.ts`, `calculation.ts`, `validation.ts`, `export.ts` as done, but none exist in `src/services/`. The claim is stale; the work lives in hooks and `gridfinityUtils.ts`. Not carried over as a goal on its own.
- Floating-point precision and the half-size spacer bug: fixed.
- STL and 3MF export: shipped 2026-10-22 as Download files (`src/utils/export/`).
- Drag-and-drop editing, undo/redo, and keyboard shortcuts: shipped 2026-10-22 for bins in the drawing.

## Product

| Item | Source | Notes |
| --- | --- | --- |
| Export the parts list as CSV/JSON and a print plan view | REFACTOR_PLAN Phase 5.2 | STL and 3MF shipped; see `docs/wireframes/print-and-export.md` for the rest. |
| Stackable prints export with model links | issue #5, draft PR #66 | Highest-demand open issue. |
| Presets for common drawer sizes, saved configurations | REFACTOR_PLAN Phase 5.1 | |
| 3D preview | REFACTOR_PLAN Phase 5.3 | Drag-and-drop editing and dimension labels shipped. |
| Multi-drawer layouts, cost and print-time estimates | REFACTOR_PLAN Future | |
| Responsive mobile layout | REFACTOR_PLAN Success metrics | Unchecked. |

## Engineering

| Item | Source | Notes |
| --- | --- | --- |
| Error boundary around the calculator | REFACTOR_PLAN Tech debt 1 | None in `src/`. |
| Edge-case input handling and loading states | REFACTOR_PLAN Tech debt 2, 3 | |
| Clear remaining `no-explicit-any` and ESLint warnings | REFACTOR_PLAN Success metrics | |
| Component restructure into `Calculator/`, `InputSections/`, `Results/` | REFACTOR_PLAN Phase 4.3 | Only if it pays for a feature. |
| Memoization, lazy-load the preview, bundle trim | REFACTOR_PLAN Phase 6 | `math-vendor` chunk is 620 KB (mathjs). Biggest speed lever. |
| Keep legacy localStorage migration working | CLAUDE.md Known issues | Invariant, not a task. |
| Test memory pressure on large layouts | CLAUDE.md Known issues | |
| Update `CLAUDE.md` refactor status (Phases 5 and 6 are partly done) | CLAUDE.md | |
