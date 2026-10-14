# Metrics harness

Reproducible measurement for the three frozen metrics in `docs/scoreboard.md`. Every script prints JSON to stdout. No script needs a paid service, an account, or a backend.

## Parity

```
npm run metrics:parity
```

Parses the Job tables in `docs/feature-map.md` (tables whose header is `Feature | Ours | …`). Counts Ours cells: ✓ = full, ◐ = partial, ✗ = none. Parity percent = `(full + partial × 0.5) / total × 100`. The scoreboard parity number must come from this script, never from a hand count. Keep Ours cells machine-readable: the first character must be exactly ✓, ◐, or ✗. Tables without an `Ours` header (for example the CAD-library section) are not counted.

## Bundle size

```
npm run build
npm run metrics:bundle
```

Sums `dist/assets/*.js` and `*.css`, raw and gzip bytes. Run the build first; the script measures what the build produced. The biggest lever at baseline is the math vendor chunk (see `docs/scoreboard.md`).

## Lighthouse / speed

```
npm run metrics:lighthouse -- <url>
```

Runs Lighthouse (performance plus accessibility) against the given URL and prints perf score, accessibility score, interactive (TTI), LCP, CLS, and total blocking time. Lighthouse is not a repo dependency; the script uses the locally installed binary and fails with install instructions if it is missing. For PR gates, run it against the PR's Netlify deploy-preview URL. For baselines, run it against production.

Known drift: the repo's `.lighthouserc.json` collects from `http://localhost:3000`, but the dev server runs on port 8080 per `vite.config.js`. Until that file is fixed, always pass an explicit URL to this script and do not rely on the repo Lighthouse CI config.

## Input-to-preview update time

This number needs a real browser, so it is measured by the parent via the verification skill (live browser task), not by a script here. Exact procedure:

1. Open the target URL (deploy preview for a PR gate, production for a baseline).
2. Complete Task 1 once (enter drawer dimensions and printer, get a layout) so the preview is rendered.
3. Change one input (Task 2: change a dimension or toggle a bin option). Start the clock at the input commit (the change event). Stop the clock when the preview DOM reflects the new layout.
4. Repeat for 5 runs. Record all 5 values plus the median.
5. Report the 5 values, the median, and the target URL plus deployed asset hash. A lane without these numbers is a lane not run.

## Ease (scripted step counts)

Measured by the parent via the verification skill (live browser task). Definitions:

- A step is one user action: typing a value, clicking a control, selecting an option. Count steps and wall time separately.
- Task 1: enter drawer dimensions and printer size, get a bin layout. Start at page load. Done when the results list shows baseplates/spacers and the preview renders.
- Task 2: adjust the grid and see the preview update. Start from a rendered layout. Done when the preview reflects the change.
- Task 3: export the design for printing. Start from a rendered layout. Done when the exported content (print list, file, or STL) matches the displayed results. If no export path exists, the task cannot complete: record FAIL, not a number.
- Adding a core task: when a new job ships (labels, STL export, bin contents, and so on), add one core task per job here, in the verification skill, and in `docs/scoreboard.md`. Never remove a core task without the owner pause-rule approval.

## Noise thresholds (perf gate)

- Speed: a regression of more than 5% on any speed metric versus trunk is a fail; investigate before merging.
- Parity: recomputed from the map every run. A PR that ships a feature must move parity, or state why it does not (for example docs-only work).
- Ease: tasks must complete. Step counts and times are compared as direction-of-travel, not a hard gate, except that a task going from completable to not-completable is a fail.

## Updating the scoreboard

Append one row to the history table in `docs/scoreboard.md` per run. Never rewrite past rows. The row records date, commit, PR, parity, speed numbers, ease numbers, and the verdict.
