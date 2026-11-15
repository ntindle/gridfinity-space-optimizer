# Gridfinity Layout verification map

This directory is the maintained source for verifying the user-facing behavior of the Gridfinity Layout app. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch the app at the lane URL (local `http://localhost:8080`, a Netlify deploy preview, or production `https://gridfinitylayout.com/`).
- Start from a clean browser profile with empty `localStorage`, unless a recipe says otherwise.
- Seed the calculator with drawer width 15, drawer height 12 (inches), printer Bambu Lab A1, unless a recipe says otherwise. Establish the baseline by driving the enter-dimensions-and-printer recipe first; each feature file then asserts the seeded state.
- Run the Doctor check from the skill and require the expected URL, heading through the browser, serving process, and HTTP 200.
- Never drive an instance that was not started by this verification run, except the deploy-preview and production lanes, where the instance is the deploy itself.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position.
- Treat every command as literal. Keep quoted names and flags unchanged.
- Run browser actions through the live-browser route.
- Restore seeded state after a mutation. Do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes a screenshot with the app identity visible and the visible result text.
- Mutation proof includes a read-only second view of the stored value (reload, or a fresh browser context).
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with the live browser` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Enter drawer dimensions and printer](./enter-dimensions-and-printer.md) covers drawer size, printer choice, custom printer, unit toggle, duplicate drawers, and the resulting layout.
- [Adjust the grid and see the preview update](./adjust-grid-preview.md) covers half-size bin options, uniform baseplates, and preview plus results updates.
- [Export the design for printing](./export-design.md) covers the export journey. Read it first: no export control exists yet, and the file records that honestly.
- [Share the layout with a link](./share-link.md) covers copying a share link, applying it in a fresh context, and the copy-failure fallback.
- [Preview piece details](./preview-piece-details.md) covers the pieces list, the details panel, clearing selection, and selection clearing on layout change.
