---
name: verify-gridfinitylayout
description: "Drive gridfinitylayout.com (the Gridfinity drawer-layout calculator, React + Vite single-page web UI) the way a user does, and capture proof. Reach for it whenever a change to the app must be proven live: on a local dev server, on a Netlify deploy preview, or as a post-merge production smoke check. It covers launch, doctor, driving with real selectors, evidence, and cleanup."
---

# Verify gridfinitylayout

This skill proves that the Gridfinity Layout app actually works in a real browser. A passing build is not proof. A proof is a real user path, driven in a live browser, with the action and the resulting state captured.

The app is a single-page web UI at one route, `/`. There is no login, no backend, and no API. Settings persist in the browser's `localStorage` under per-setting keys prefixed `gridfinity_`, such as `gridfinity_drawerSize`, `gridfinity_selectedPrinter`, `gridfinity_useHalfSize`, `gridfinity_preferHalfSize`, `gridfinity_preferUniformBaseplates`, `gridfinity_numDrawers`, `gridfinity_useMm`, and `gridfinity_customPrinterSize`, plus `gridfinity_customPrinterDimensions`. A legacy `gridfinitySettings` key is still written as a mirror; clearing only the legacy key does not give clean state. The share feature encodes the current settings into a `?share=` URL parameter.

## Baseline preconditions

- Start from a clean browser profile with empty `localStorage`, unless a recipe says otherwise. Stale settings leak into the next run. Clean means no `gridfinity_*` keys at all; the legacy `gridfinitySettings` mirror alone does not determine state.
- Establish the baseline by driving the enter-dimensions-and-printer recipe first; each feature file then asserts the seeded state.
- Seed the calculator with drawer width 15, drawer height 12 (inches), printer Bambu Lab A1, unless a recipe says otherwise. This is the baseline layout every recipe starts from.
- Never drive an instance this run did not start, except the deploy-preview and production lanes, where the instance is the deploy itself. For those lanes, confirm the deploy matches the PR head before driving.
- Treat every selector and label in this skill as literal. If the app no longer shows a named control, the recipe fails. Do not substitute a different path and call it verified.

## Driving conventions

- Drive through the live-browser route: open a browser task against the target URL with the feature file's steps, and require it to report screenshots, console errors, and the visible results.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position. Never use coordinates or tab order.
- Start every recipe from the baseline state unless its preconditions say otherwise.
- Wait for the resulting state, not a fixed sleep. Results and the preview update on state change; assert the DOM state after the change.
- Record the feature ID and entry point used with every artifact.

## Launch

### Local dev server lane

Start the app from the repo checkout:

```bash
npm ci
npm run dev
```

The dev server listens on port 8080. Ready means the Vite ready line is printed AND `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/` returns `200` AND the browser shows the `Try the Calculator` heading. A process that answers on the port but serves an error page is not ready. The heading is rendered client-side, so a raw `curl` of the page can never show it; the heading check must go through the browser.

To run a second dev instance side by side, give it its own port:

```bash
npm run dev -- --port 8081
```

### Built-bundle lane (optional)

To verify the production build locally instead of the dev server:

```bash
npm run build
npm run preview
```

Ready means `curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/` returns `200` and the browser shows the `Try the Calculator` heading.

### Deploy-preview lane

Use the Netlify deploy-preview URL from the PR's `netlify[bot]` comment, in the form `https://deploy-preview-<PR>--gridfinity-drawer-planner.netlify.app`. Wait until the Netlify `deploy-preview` check is green before driving. A preview from an older commit proves nothing about the current head.

### Production smoke lane

Target `https://gridfinitylayout.com/`. After a merge, wait for the production deploy: poll the homepage until the served JS asset hash changes from the pre-merge hash, up to 10 minutes. Then run every core recipe in the feature map. On any failure, follow the rollback rule in Cleanup.

## Doctor

Run this read-only check whenever anything looks off, before driving. All three checks must pass.

```bash
curl -s http://localhost:8080/ | grep -o '<div id="root"' | head -n 1
ps -p <DEV_SERVER_PID> -o pid,command
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/
```

Doctor answers: the page serves the SPA shell, the process on the port is the dev server this run started, and the HTTP status is 200. Confirm the `Try the Calculator` heading separately through the browser; raw `curl` output never contains it because it renders client-side. For the preview and production lanes, replace the URL with the lane URL and require the shell plus a 200 plus the heading through the browser; the process check does not apply to remote deploys. For a remote lane, also confirm the deploy matches the expected commit: compare the served asset hash against the Netlify deploy for the PR head (preview) or the post-merge deploy (production).

## Drive

Drive one feature at a time using its file in `features/`. The feature map is the maintained source for what to drive. The core recipes are:

- `enter-dimensions-and-printer.md` — set drawer dimensions and printer, get a bin layout.
- `adjust-grid-preview.md` — change grid options and watch the preview and results update.
- `export-design.md` — export the design for printing. Read this file first: it records that no export control exists yet.
- `share-link.md` — copy a share link and apply it in a fresh browser context.
- `preview-piece-details.md` — select a piece from the list and read its details.

Each feature file gives the exact handles and the observable end state. Drive the real user path: type into the labeled inputs, choose from the printer combobox, flip the named switches, click the named buttons. Never set state through internal setters, test-only endpoints, or `localStorage` writes. The one exception is seeding a share link: opening a `?share=` URL is itself the user path for that feature.

## Evidence

A proof captures the action and the resulting state, not only the final screen. For each driven feature, capture:

- The action taken, with the exact control and value used.
- A screenshot showing the app identity and the resulting state.
- The visible result text (results list, preview labels, details panel, status text).
- Console errors, verbatim, or the word `none`.
- Side effects: for the share feature, the clipboard content or the fallback input value, plus the applied state in a fresh context; for persistence, the reloaded state after a refresh.
- The feature ID, entry point, lane, target URL, and deployed commit or asset hash.

Proof artifacts go into the run's trail entry in the program workspace under `hidden_files/verification/<date>-<pr-or-run>/`, and the summary goes into the PR description. A lane without evidence is a lane not run.

Proof standards: exercise the real user path; capture the action and the resulting state; verify side effects alongside what is visible; no mocks. A skipped entry point is reported as skipped with the unmet precondition, never as verified through a different path. If a recipe's precondition is missing, the recipe reports a failure and the reason goes in that feature's Gotchas. Never weaken a journey to make it pass.

## Cleanup

Kill only what the run started, by PID. Never kill by process name.

```bash
kill <DEV_SERVER_PID>
```

After teardown, confirm the evidence still exists at the named location. A cleanup that eats the proof fails the run. Cleanup removes instances and scratch state, never the evidence.

### Rollback rule (production smoke lane only)

If the production smoke lane fails after a merge: roll back to the previous Netlify deploy. API rollback uses the repo's `NETLIFY_AUTH_TOKEN` secret and `NETLIFY_SITE_ID` variable; the dashboard fallback is Netlify site `gridfinity-drawer-planner`, Deploys, previous deploy, Publish deploy. Open a revert PR, and ship nothing else until the smoke lane passes again.

## Helpers

No helper scripts ship with this skill. The Doctor check is the command sequence in the Doctor section. The evidence location is the program workspace path in the Evidence section.

## Proof status of this skill

This skill was generated from the repo as of the PR that adds it. Its own proof run (launch, doctor, drive one mapped feature, capture evidence, clean up) is performed by the first run that uses it, via the live browser, and the result is recorded in that run's trail entry. Until then, treat the skill as unproven.

## Gotchas

- The repo's `.lighthouserc.json` collects from `http://localhost:3000`, but the dev server listens on 8080. Pass the real target URL to Lighthouse; never run against the stale config URL.
- Bare `npx vitest` picks up `vite.config.js`, not `vite.config.test.js`. Always use `npm test`.
- The share `?share=` parameter is stripped from the URL after it applies. Assert the applied state, not the parameter.
- The copy button label flips to `Link copied!` for 2.5 seconds, then reverts. Capture the status within that window or assert the status text.
- Preview cells are visual divs, not buttons. Selection happens through the `Pieces in this drawer` list rows.
- The piece details panel clears whenever the layout changes, so a details assertion must come before any layout-changing step.
- The unit toggle flips input labels between inches and mm and re-renders physical sizes with the chosen unit first.
- Drawer width and height inputs commit on blur, not on change. Typing alone updates only local field state. An invalid non-empty value reverts to the previous valid value on blur; only an empty value sets 0 and clears the display. Every fill step for drawer dimensions or duplicate drawers must end with a blur, such as pressing Tab, before asserting results. The custom-printer dialog is the exception: it commits on change, so its fill step ends with Save, not a blur.
- The dev server sets a Content-Security-Policy. Blocked third-party requests are expected; only first-party console errors fail a run.
- The README claims an export feature that does not exist in the UI. The export feature file records this honestly; do not treat the README claim as a shipped feature.
