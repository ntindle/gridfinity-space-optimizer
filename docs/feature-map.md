# Feature map

Every Gridfinity tool we could read, compared to gridfinitylayout.com, grouped by job. Built 2026-10-14 against `main` at a486b37; refreshed 2026-10-15 (no new competitor moves on labels; andymai "labels" hits are bin-designer UI labels, not printable bin labels); refreshed 2026-10-16 (andymai label plates + click-in sockets + tweezer hole verified → F27; Perplexing Labs hub and the label-tool crop noted; gridmint.net fetch failed so gridmint cells stay as-is, unverified).

Legend: ✅ supported, 🟡 partial, ❌ we lack it, — not claimed in the source we fetched (not proof the tool lacks it). Every ✅ links the page it came from. Ours was checked by driving the built app in headless Chromium.

Parity = (✅ + ½·🟡) / rows, computed by `scripts/measure.mjs` from the `Ours` column. Rows must start with `| F<n>`.

## Layout

| ID | Feature | Ours | Gridfinity Layout Tool | Gridmint | Gridfinity Generator | Rebuilt (OpenSCAD) | Fusion Generator | Extended (OpenSCAD) | GFLabel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | Drawer size to grid units | ✅ [src](https://gridfinitylayout.com/) | ✅ [src](https://gridfinitylayouttool.com/gridfinity-calculator) | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | — | — | — | — |
| F2 | Inch and mm input | ✅ [src](https://gridfinitylayout.com/) | — | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | — | — | — | — |
| F3 | Split baseplates to fit the print bed | ✅ [src](https://gridfinitylayout.com/) | ✅ [src](https://gridfinitylayouttool.com/gridfinity-baseplate-generator) | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | — | — | — | — |
| F4 | Printer presets plus custom bed size | ✅ [src](https://gridfinitylayout.com/) | — | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | — | — | — | — |
| F5 | Fill leftover space (spacers or edge padding) | ✅ [src](https://gridfinitylayout.com/) | ✅ [src](https://gridfinitylayouttool.com/gridfinity-baseplate-generator) | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | — | — | — | — |
| F6 | Half-grid (21 mm) support | ✅ [src](https://gridfinitylayout.com/) | ✅ [src](https://gridfinitylayouttool.com/gridfinity-calculator) | — | — | — | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | — | — |
| F7 | 2D layout preview | ✅ [src](https://gridfinitylayout.com/) | ✅ [src](https://gridfinitylayouttool.com/) | ✅ [src](https://gridmint.net/en/) | — | — | — | — | — |
| F8 | 3D preview of the drawer | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | ✅ [src](https://gridmint.net/en/) | — | — | — | — | — |
| F9 | Place and resize bins in the drawer | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | ✅ [src](https://gridmint.net/en/) | ✅ [src](https://gridfinitygenerator.com/) | — | — | — | — |
| F10 | Drawer height check / tallest bin | ❌ | ✅ [src](https://gridfinitylayouttool.com/gridfinity-calculator) | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | — | — | — | — |
| F11 | Furniture presets (IKEA ALEX, HELMER, etc.) | ❌ | — | ✅ [src](https://gridmint.net/en/) | — | — | — | — | — |
| F12 | Duplicate drawer count | ✅ [src](https://gridfinitylayout.com/) | — | — | — | — | — | — | — |
| F13 | Stacked layers for deep drawers | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | — | — | — | — | — | — |
| F14 | Printer bed exclusion zones | ✅ [src](https://gridfinitylayout.com/) | — | — | — | — | — | — | — |

## Bin, baseplate, and lid generation

| ID | Feature | Ours | Gridfinity Layout Tool | Gridmint | Gridfinity Generator | Rebuilt (OpenSCAD) | Fusion Generator | Extended (OpenSCAD) | GFLabel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F15 | Generate baseplate models | ❌ | ✅ [src](https://gridfinitylayouttool.com/gridfinity-baseplate-generator) | ✅ [src](https://gridmint.net/en/) | ✅ [src](https://gridfinitygenerator.com/) | — | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | ✅ [src](https://github.com/ostat/gridfinity_extended_openscad#scripts-overview) | — |
| F16 | Magnet and screw holes | ❌ | ✅ [src](https://gridfinitylayouttool.com/gridfinity-baseplate-generator) | — | — | ✅ [src](https://github.com/kennetek/gridfinity-rebuilt-openscad#features) | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | — | — |
| F17 | Baseplate connectors (puzzle joints, nubs, pins) | ❌ | ✅ [src](https://gridfinitylayouttool.com/gridfinity-baseplate-generator) | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | — | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | — | — |
| F18 | Generate custom-size bins | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | ✅ [src](https://gridmint.net/en/) | ✅ [src](https://gridfinitygenerator.com/) | ✅ [src](https://github.com/kennetek/gridfinity-rebuilt-openscad#features) | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | ✅ [src](https://github.com/ostat/gridfinity_extended_openscad#scripts-overview) | — |
| F19 | Bin compartments and dividers | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | ✅ [src](https://gridmint.net/en/) | ✅ [src](https://gridfinitygenerator.com/) | ✅ [src](https://github.com/kennetek/gridfinity-rebuilt-openscad#features) | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | — | — |
| F20 | Scoops | ❌ | — | ✅ [src](https://gridmint.net/en/) | — | ✅ [src](https://github.com/kennetek/gridfinity-rebuilt-openscad#features) | — | — | — |
| F21 | Label tabs on bins | ❌ | ✅ [src](https://gridfinitylayouttool.com/gridfinity-baseplate-generator) | — | — | ✅ [src](https://github.com/kennetek/gridfinity-rebuilt-openscad#features) | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | — | — |
| F22 | Stacking lip and lids | ❌ | — | ✅ [src](https://gridmint.net/en/gridfinity-drawer-planner/) | — | ✅ [src](https://github.com/kennetek/gridfinity-rebuilt-openscad#features) | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | ✅ [src](https://github.com/ostat/gridfinity_extended_openscad#scripts-overview) | — |
| F23 | Custom cutouts from your own STL | ❌ | — | — | ✅ [src](https://gridfinitygenerator.com/) | — | — | — | — |
| F24 | Filament savers (vase mode, shelled, skeleton) | ❌ | — | — | — | ✅ [src](https://github.com/kennetek/gridfinity-rebuilt-openscad#features) | ✅ [src](https://github.com/Le0Michine/FusionGridfinityGenerator#features) | — | — |
| F25 | Specialty holders (drawers, sockets, silverware) | ❌ | — | — | — | — | — | ✅ [src](https://github.com/ostat/gridfinity_extended_openscad#scripts-overview) | — |

## Labels

| ID | Feature | Ours | Gridfinity Layout Tool | Gridmint | Gridfinity Generator | Rebuilt (OpenSCAD) | Fusion Generator | Extended (OpenSCAD) | GFLabel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F26 | Printable bin labels | ✅ [src](https://gridfinitylayout.com/) | — | — | — | — | — | — | ✅ [src](https://github.com/ndevenish/gflabel#label-bases) |
| F27 | Multiple label systems and styles | ✅ [src](https://gridfinitylayout.com/) | ✅ [src](https://github.com/andymai/gridfinity-layout-tool/blob/HEAD/CHANGELOG.md) | — | — | — | — | — | ✅ [src](https://github.com/ndevenish/gflabel#label-bases) |

## Export

| ID | Feature | Ours | Gridfinity Layout Tool | Gridmint | Gridfinity Generator | Rebuilt (OpenSCAD) | Fusion Generator | Extended (OpenSCAD) | GFLabel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F28 | STL export | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | — | ✅ [src](https://gridfinitygenerator.com/) | — | — | — | — |
| F29 | 3MF / STEP export | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | — | — | — | — | — | — |
| F30 | One-click open in slicer | ❌ | — | ✅ [src](https://gridmint.net/en/) | — | — | — | — | — |
| F31 | Print list / bill of materials | 🟡 [src](https://gridfinitylayout.com/) | ✅ [src](https://gridfinitylayouttool.com/) | ✅ [src](https://gridmint.net/en/) | — | — | — | — | — |
| F32 | Stack identical prints for one job (issue #5) | ❌ | — | — | — | — | — | — | — |

## Sharing and saving

| ID | Feature | Ours | Gridfinity Layout Tool | Gridmint | Gridfinity Generator | Rebuilt (OpenSCAD) | Fusion Generator | Extended (OpenSCAD) | GFLabel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F33 | Share layout via link | ✅ [src](https://gridfinitylayout.com/) | — | — | — | — | — | — | — |
| F34 | Saved projects (local or synced) | 🟡 [src](https://gridfinitylayout.com/) | — | ✅ [src](https://gridmint.net/en/) | ✅ [src](https://gridfinitygenerator.com/) | — | — | — | — |
| F35 | Installable offline app | ❌ | ✅ [src](https://gridfinitylayouttool.com/) | — | — | — | — | — | — |
| F36 | Free, no account required | ✅ [src](https://gridfinitylayout.com/) | ✅ [src](https://gridfinitylayouttool.com/) | ✅ [src](https://gridmint.net/en/) | — | — | — | — | — |

**Our parity: 13 ✅ + 2 🟡 of 36 rows = 38.9%.**

## Gaps ranked by demand

Direct demand signal is thin: the repo has one open feature issue (#5). So rank = direct user requests first, then how many tools ship the feature (a proxy for what users expect), then fit with our existing layout engine.

| Rank | ID | Gap | Tools that ship it | Direct requests |
| --- | --- | --- | --- | --- |
| 1 | F28 | STL export | 2 | README already promises export |
| 2 | F32 | Stack identical prints for one job (issue #5) | 0 | issue #5 |
| 3 | F18 | Generate custom-size bins | 6 |  |
| 4 | F15 | Generate baseplate models | 5 |  |
| 5 | F19 | Bin compartments and dividers | 5 |  |
| 6 | F22 | Stacking lip and lids | 4 |  |
| 7 | F9 | Place and resize bins in the drawer | 3 |  |
| 8 | F16 | Magnet and screw holes | 3 |  |
| 9 | F17 | Baseplate connectors (puzzle joints, nubs, pins) | 3 |  |
| 10 | F21 | Label tabs on bins | 3 |  |
| 11 | F8 | 3D preview of the drawer | 2 |  |
| 12 | F10 | Drawer height check / tallest bin | 2 |  |
| 13 | F20 | Scoops | 2 |  |
| 14 | F24 | Filament savers (vase mode, shelled, skeleton) | 2 |  |
| 15 | F29 | 3MF / STEP export | 2 |  |
| 16 | F31 | Print list / bill of materials | 2 |  |
| 17 | F34 | Saved projects (local or synced) | 2 |  |
| 18 | F11 | Furniture presets (IKEA ALEX, HELMER, etc.) | 1 |  |
| 19 | F13 | Stacked layers for deep drawers | 1 |  |
| 20 | F23 | Custom cutouts from your own STL | 1 |  |
| 21 | F25 | Specialty holders (drawers, sockets, silverware) | 1 |  |
| 22 | F30 | One-click open in slicer | 1 |  |
| 23 | F35 | Installable offline app | 1 |  |

## Tools found but not mapped

- Perplexing Labs generator (https://gridfinity.perplexinglabs.com/): page is rendered client-side and returned no readable feature text to our fetch; needs a browser pass.
- Perplexing Labs generator hub (https://gridfinity.perplexinglabs.com/) — systems: Gridfinity Rebuilt/Extended bins+bases, GridFlock drawer grids, Gridfinity Anylid snap-on lids, Cullenect printable labels, openGrid, GridPlates. Homepage copy verified 2026-10-16; in-app params unverified.
- kamilpajak/gridfinity-label-generator ("GridScribe") — SvelteKit web label generator, print-ready PNG + batch strip export. F27 relevance.
- gridlabelstudio.com — print-ready labels in PNG/SVG at exact heights. F27 relevance.
- stlkit3d.com ("STLKit3D") — free client-side browser parametric bin generator, watertight binary STL export. F18 relevance.
- gridpilot.us ("GridPilot") — AI-powered custom tray generator: photo tool detection, 3MF export. F25/F29 relevance.
- pocketry.xyz ("Pocketry") — photographs to editable outlines and bins. F18/F25 relevance.
- gridpitch.io ("GridPitch") — organizers on any grid pitch. Niche.
- automaat/gridfinity-generator — WASM CAD web worker, exportSTEP/exportSTL, presets. Possible new column.
- Zack Freedman's original Fusion models, Printables/MakerWorld bin libraries, and other OpenSCAD forks: not fetched yet.

## Open GitHub issues

- #5 support for Export Stackable prints (row F32). Draft PR #66 exists.
