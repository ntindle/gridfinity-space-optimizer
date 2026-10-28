# Gridfinity Feature Map

Ours: [gridfinitylayout.com](https://gridfinitylayout.com/) — repo [ntindle/gridfinity-space-optimizer](https://github.com/ntindle/gridfinity-space-optimizer), baseline `main` at `c4f9e35` (Phase 0 PRs #70–#75, #79 merged, 2026-10-14). This file supersedes the map files of PR #72 (merged) and PR #76 (unmerged): it keeps #76's 7 jobs, 45 rows, demand ranks, and parity formula, and expands its tool columns from a representative set to every tool in the researcher inventory. It does not touch the harness or the scoreboard. Refreshed 2026-10-16 on rebase onto main: Ours F35 (printable / embossed label generation) flipped to ✅ after PRs #86 (printable bin labels) and #87 (three label styles: paper card, Cullenect 36.4×11mm insert, bin-width 25mm) shipped; andymai's F35 cell flipped to ✅ on its CHANGELOG evidence for multiple label systems. Eight more tools noted on main's narrow map 2026-10-16 (GridScribe, gridlabelstudio.com, STLKit3D, GridPilot, Pocketry, GridPitch, automaat/gridfinity-generator, Perplexing Labs hub systems) are not columns here yet; see the Honesty log.

## How to read

- Legend: ✅ = shipped, verified from the primary source linked in the cell. 🟡 = partially shipped / partial support. ❌ = not present, verified absent or out of scope. — = not claimed in the cited page, or not applicable to this tool's class. ? = unverified: the researcher file plus a quick primary-source check did not establish it. A ? cell is never a fact: it is excluded from parity, from gap ranks, and from every claim in this file.
- Every ✅ / 🟡 / ❌ cell carries a `[src]` link to the tool's primary source (Tool index below). — and ? cells carry no link, because there is no claim to evidence.
- Ours values come from the repo source on `main`, not from marketing copy. Export shipped on 2026-10-22: Download files gives every bin, baseplate, and spacer as STL plus 3MF print plates (F14, F25, F27).
- Gap demand ranks gaps by user demand, not by count. D1 blocks a core job for most users. D2 is competitor convergence plus frequent use. D3 is valuable for a segment or next-level. D4 is differentiation or nice-to-have. Every gap row carries a one-line justification: who wants it, what job it unblocks.
- Parity counts only the Ours column over the Job-table rows: parity = (✅ + 0.5 × 🟡) / rows. Competitor columns never affect parity. CAD / code-library columns are included for completeness, but their class means most planner rows are — for them, which never counts for or against anyone. Parity is computed by the live harness `scripts/measure.mjs` from the Ours column: rows must start with `| F<n>`, Ours must be the 3rd column, and the Ours cell must start with ✅, 🟡, or ❌. Keep it that way.
- This map: 50 rows, 22 full + 3 partial + 25 missing, parity **47.0%**. The scoreboard (`docs/scoreboard.md`) still records the pre-expansion parity from the narrower map; updating it is a follow-up, intentionally not done in this PR.
- Research input: `agent_notes/competitor-map-2026-10-14.md` in the goal workspace. That file was described as 38 tools; a recount finds 35 distinct tools (10 primary web tools + 13 CAD / code-library tools + 12 adjacent / single-purpose tools). This map covers all 35: Ours plus 34 competitor columns. No tools were invented to reach 38.
- Issues are not created from this file yet. "to file" in the Issue column means the issue gets filed after this map merges.

## Tool index

Column headers are abbreviations. Each tool's primary source is the link its ✅ / 🟡 / ❌ cells cite. Two entries have no single primary URL in the researcher file: ZACK and MODELS cite gridfinity.xyz, the ecosystem index, as the closest documented source.

- **AM** — andymai Gridfinity Layout Tool — [primary source](https://github.com/andymai/gridfinity-layout-tool)
- **GS** — GridfinityStudio — [primary source](https://gridfinitystudio.com)
- **PL** — Perplexing Labs — [primary source](https://gridfinity.perplexinglabs.com/)
- **GG** — gridfinitygenerator.com — [primary source](https://gridfinitygenerator.com/)
- **GC** — GridfinityCreator — [primary source](https://gridfinity.bouwens.co)
- **EB** — extrabold.tools — [primary source](https://www.extrabold.tools/category/gridfinity)
- **TT** — Tooltrace — [primary source](https://www.tooltrace.ai)
- **GP** — GridPilot — [primary source](https://gridpilot.us/)
- **MWU** — MakerWorld Ultimate Drawer Configurator — [primary source](https://makerworld.com/en/models/2737065-ultimate-gridfinity-drawer-configurator)
- **GRIPS** — GRIPS (MakerWorld) — [primary source](https://makerworld.com/en/models/704997-grips-gridfinity-interlocking-baseplate-system)
- **SPRLS** — Spacerless baseplate generator (MakerWorld) — [primary source](https://makerworld.com/en/models/2213671-spacerless-gridfinity-baseplate-generator)
- **USHAPE** — U-shape drawer baseplate (MakerWorld) — [primary source](https://makerworld.com/en/models/2340157-parametric-gridfinity-u-shape-drawer-baseplate)
- **CLICK** — ClickFinity DrawerGen — [primary source](https://github.com/frycookvc/clickfinityDrawerGen)
- **GXWEB** — Gridfinity Extended web generator — [primary source](https://github.com/new-usemame/gridfinity_extended_generator)
- **GLBL** — gridfinitylabels.com — [primary source](https://gridfinitylabels.com)
- **GFL** — gflabel — [primary source](https://github.com/ndevenish/gflabel)
- **CULL** — Cullenect labels — [primary source](https://gridfinity.perplexinglabs.com/)
- **HALA** — halagen — [primary source](https://timmmmmmmmm.github.io/halagen)
- **GFXYZ** — gridfinity.xyz (spec / wiki) — [primary source](https://gridfinity.xyz/)
- **ZACK** — Zack Freedman original — no single primary URL in the researcher file; cells cite gridfinity.xyz, the ecosystem index
- **MODELS** — Printables / Thangs / Cults model libraries — no single primary URL in the researcher file; cells cite gridfinity.xyz, the ecosystem index
- **FUSLEO** — Fusion 360 GridfinityGenerator (Le0Michine, original) — [primary source](https://github.com/Le0Michine/FusionGridfinityGenerator)
- **FUSWS** — Gridfinity Workshop (iluvmemes) — [primary source](https://github.com/iluvmemes/GridfinityWorkshop)
- **FUSPLUS** — GridfinityGeneratorPlus (edjohnson100) — [primary source](https://github.com/edjohnson100/GridfinityGeneratorPlus)
- **VEC76** — vector76 gridfinity_openscad — [primary source](https://github.com/vector76/gridfinity_openscad)
- **KEN** — kennetek gridfinity-rebuilt-openscad — [primary source](https://github.com/kennetek/gridfinity-rebuilt-openscad)
- **OSTAT** — ostat gridfinity_extended_openscad — [primary source](https://github.com/jpypi/gridfinity_extended_openscad)
- **GPLS** — GridPlates (silversword411) — [primary source](https://github.com/silversword411/GridPlates)
- **GFTH** — PaulBone/gfthings (build123d) — [primary source](https://github.com/PaulBone/gfthings)
- **RJHU** — Ruudjhuu/gridfinity_build123d — [primary source](https://github.com/Ruudjhuu/gridfinity_build123d)
- **MHMK** — moritzmhmk/gridfinity-build123d — [primary source](https://github.com/moritzmhmk/gridfinity-build123d)
- **KMEI** — kmeisthax/gridfinity-cadquery — [primary source](https://github.com/kmeisthax/gridfinity-cadquery)
- **CQGF** — michaelgale/cq-gridfinity — [primary source](https://github.com/michaelgale/cq-gridfinity)
- **PHUSCK** — Phusck Laser/Rhino Gridfinity — [primary source](https://github.com/mozabes/phusck-laser-rhino-gridfinity)

CAD / code-library tools (FUSLEO through PHUSCK) are libraries and add-ins for people who already use CAD or Python. They are not web planners, so planner rows (drag-and-drop, share via URL, cloud sync, mobile UX, and the like) are — for them. A — in a CAD column means different product, not worse product. Their part-generation rows (bins, baseplates, lids, magnets, compartments, scoops, vase mode) carry real marks and set the ceiling for part-generation quality.

## Job 1 — Plan a drawer layout

The job: turn real drawer dimensions into a fitted Gridfinity plan.

| ID | Feature | Ours | AM | GS | PL | GG | GC | EB | TT | GP | MWU | GRIPS | SPRLS | USHAPE | CLICK | GXWEB | GLBL | GFL | CULL | HALA | GFXYZ | ZACK | MODELS | FUSLEO | FUSWS | FUSPLUS | VEC76 | KEN | OSTAT | GPLS | GFTH | RJHU | MHMK | KMEI | CQGF | PHUSCK | Gap demand | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | Drawer dims to fitted grid (auto baseplate layout) | ✅ (optimal baseplate layout for drawer size) [src][o1] | ✅ [src][am] | ✅ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ✅ [src][eb] | 🟡 [src][tt] | 🟡 [src][gp] | ✅ [src][mwu] | ✅ [src][grips] | 🟡 [src][sprls] | 🟡 [src][ushape] | ✅ [src][click] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — (we have it) | — |
| F2 | Spacer and filler math | ✅ (spacers computed for the non-42mm remainder) [src][o2] | ✅ [src][am] | ✅ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ✅ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | 🟡 [src][mwu] | — | ❌ [src][sprls] | — | 🟡 [src][click] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | 🟡 [src][cqgf] | — | — (we have it) | — |
| F3 | Half-size / 0.5u bins in the optimizer | ✅ [src][o3] | ✅ [src][am] | ? | ✅ [src][pl] | ? | ? | ? | ❌ [src][tt] | ❌ [src][gp] | ❌ [src][mwu] | — | — | — | — | ✅ [src][gxweb] | — | — | — | — | — | — | — | — | — | — | ✅ [src][vec76] | ? | — | — | — | — | — | — | — | — | — (we have it) | — |
| F4 | Printer-bed exclusion zones | ✅ (custom printer dialog, reduces printable area per side) [src][o4] | ? | ? | ? | ? | ? | ? | ? | ? | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — (we have it) | — |
| F5 | Inspect a preview piece (details panel) | ✅ (select a piece in the to-scale drawing or the parts list; type, grid size, mm/in, position, identical count) [src][o5] | ? | ? | ? | ? | ? | ? | ? | ? | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — (we have it) | — |
| F6 | Drag-and-drop visual editor | ✅ (bins: drag across the grid to draw one, drag to move, drag the corner to resize, with arrow-key moves, Shift-arrow resizes, Delete, and undo/redo; tap to add on phones; baseplates stay automatic) [src][o6] | ✅ [src][am] | ✅ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | 🟡 [src][eb] | ✅ [src][tt] | ✅ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D2 — planners who arrange by hand want to move bins, not re-enter numbers; unblocks custom arrangements our auto-layout cannot express | to file |
| F7 | 3D preview | ❌ [src][o7] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ✅ [src][gc] | ✅ [src][eb] | ✅ [src][tt] | ✅ [src][gp] | ✅ [src][mwu] | — | — | — | ✅ [src][click] | ✅ [src][gxweb] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D2 — anyone stacking or checking heights wants depth, not flat rectangles; unblocks multi-height planning | to file |
| F8 | Drawer obstacles, cutouts, custom perimeters | ❌ (printer-bed exclusion is a different feature, see above) [src][o8] | ✅ [src][am] | ✅ [src][gs] | ❌ [src][pl] | ✅ [src][gg] | ❌ [src][gc] | ✅ [src][eb] | ✅ [src][tt] | ✅ [src][gp] | ✅ [src][mwu] | — | — | ✅ [src][ushape] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D2 — owners of sink, tool, and odd drawers hit non-rectangles constantly; unblocks fitting real drawers | to file |
| F9 | Multi-layer / stacked layers | ❌ [src][o9] | ✅ [src][am] | ✅ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ❌ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D3 — deep-drawer owners want stacked layers; unblocks using full drawer depth | to file |
| F10 | Bin-contents planning (assign items to bins) | ✅ (every placed bin carries its contents, edited in the bin panel, printed on its label, listed in the parts list and the download README, and kept in share links) [src][o10] | ✅ [src][am] | ✅ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ❌ [src][eb] | ✅ [src][tt] | ✅ [src][gp] | ✅ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D2 — andymai shipped "Places" bin-contents inventory 2026-10-18 (bins carry a list of what they hold, searchable) — the top competitor just validated this job; organizers plan what goes where, not just empty boxes; unblocks going from layout to a labeled, usable drawer | to file |
| F11 | Custom grid pitch / non-42mm optimizer | ❌ [src][o11] | 🟡 [src][am] | ? | ? | ? | ? | ? | ❌ [src][tt] | ✅ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ [src][fusplus] | — | — | — | — | — | — | — | — | — | — | D3 — drawers where 42mm wastes space want a pitch that fits; unblocks near-zero-waste layouts | to file |
| F12 | Drawer presets (named furniture / toolboxes) | ❌ (no tool does this well; open lane) [src][o12] | ? | ? | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ? | ❌ [src][tt] | 🟡 [src][gp] | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D3 — new users with an IKEA Alex or Harbor Freight box want one tap, not calipers; unblocks the first layout | to file |
| F13 | Foam / shadowbox layout mode (non-printed inserts) | ❌ [src][o13] | ? | ? | ? | ? | ? | ? | ✅ [src][tt] | ❌ [src][gp] | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — foam and shadowbox users want inserts without printing; unblocks tool shadowing without a printer | to file |

## Job 2 — Generate parts

The job: produce printable bins, baseplates, and lids, not just a parts list.

| ID | Feature | Ours | AM | GS | PL | GG | GC | EB | TT | GP | MWU | GRIPS | SPRLS | USHAPE | CLICK | GXWEB | GLBL | GFL | CULL | HALA | GFXYZ | ZACK | MODELS | FUSLEO | FUSWS | FUSPLUS | VEC76 | KEN | OSTAT | GPLS | GFTH | RJHU | MHMK | KMEI | CQGF | PHUSCK | Gap demand | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F14 | Parametric baseplate generation (geometry plus STL) | ✅ (spec frame baseplates, 42 mm or 21 mm grid, 5 mm tall, for every split piece; STL and 3MF; no magnet or screw options) [src][o14] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ✅ [src][gc] | ✅ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | ✅ [src][grips] | ✅ [src][sprls] | ✅ [src][ushape] | ✅ [src][click] | ✅ [src][gxweb] | — | — | — | — | — | 🟡 [src][zack] | ❌ [src][models] | ✅ [src][fusleo] | ✅ [src][fusws] | ✅ [src][fusplus] | ✅ [src][vec76] | ✅ [src][ken] | ✅ [src][ostat] | ✅ [src][gpls] | ✅ [src][gfth] | ✅ [src][rjhu] | ✅ [src][mhmk] | ✅ [src][kmei] | ✅ [src][cqgf] | ✅ [src][phusck] | D1 — every user who owns a printer needs a printable baseplate, not just a size; unblocks printing the grid itself | to file |
| F15 | Parametric bin generation | 🟡 (spec bins at any placed size on the 42 or 21 mm grid, 2–20u tall in 7 mm units, with the stacking lip; no dividers, scoops, label tabs, magnets, or lids yet) [src][o15] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ✅ [src][gc] | ✅ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | — | — | — | — | ✅ [src][gxweb] | — | — | — | — | — | 🟡 [src][zack] | ❌ [src][models] | ✅ [src][fusleo] | ✅ [src][fusws] | ✅ [src][fusplus] | ✅ [src][vec76] | ✅ [src][ken] | ✅ [src][ostat] | ❌ [src][gpls] | ✅ [src][gfth] | ✅ [src][rjhu] | ✅ [src][mhmk] | ✅ [src][kmei] | ✅ [src][cqgf] | ✅ [src][phusck] | D1 — every user needs bins to print; unblocks printing anything that holds items | to file |
| F16 | Lid generation | ❌ [src][o16] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ? | ❌ [src][gc] | ? | ❌ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | — | — | — | — | ✅ [src][gxweb] | — | — | — | — | — | — | — | ? | ? | ? | ? | ? | ✅ [src][ostat] | ❌ [src][gpls] | ? | ? | ? | ? | ? | ❌ [src][phusck] | D2 — users who stack or transport bins need lids; unblocks stackable, portable storage | to file |
| F17 | Magnets and screw holes options | ❌ (in generated parts; printer-bed exclusion is separate) [src][o17] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ✅ [src][gc] | ✅ [src][eb] | ✅ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | ✅ [src][grips] | — | — | — | ✅ [src][gxweb] | — | — | — | — | — | — | — | ✅ [src][fusleo] | ✅ [src][fusws] | ✅ [src][fusplus] | ✅ [src][vec76] | ✅ [src][ken] | ✅ [src][ostat] | ? | ? | ? | ? | ? | ✅ [src][cqgf] | ❌ [src][phusck] | D3 — users who mount baseplates or secure bins need holes; unblocks fixed, rattle-free installs | to file |
| F18 | Compartments and dividers in generated bins | ❌ [src][o18] | ✅ [src][am] | ✅ [src][gs] | ? | ✅ [src][gg] | ✅ [src][gc] | ? | ❌ [src][tt] | ❌ [src][gp] | ? | — | — | — | — | ✅ [src][gxweb] | — | — | — | — | — | — | — | ✅ [src][fusleo] | ✅ [src][fusws] | ✅ [src][fusplus] | ✅ [src][vec76] | ✅ [src][ken] | ✅ [src][ostat] | ❌ [src][gpls] | ? | ? | ? | ? | ? | ? | D3 — users sorting small parts need dividers; unblocks one bin holding many item types | to file |
| F19 | Scoop, finger slide, label tab in generated bins | ❌ [src][o19] | ✅ [src][am] | ✅ [src][gs] | ? | ? | ✅ [src][gc] | ? | ❌ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | — | — | — | — | ✅ [src][gxweb] | — | — | — | — | — | — | — | ✅ [src][fusleo] | ✅ [src][fusws] | ✅ [src][fusplus] | ✅ [src][vec76] | ✅ [src][ken] | ✅ [src][ostat] | ❌ [src][gpls] | ? | ? | ? | ? | ✅ [src][cqgf] | ❌ [src][phusck] | D3 — users grabbing small items need scoops and slides; unblocks one-handed retrieval | to file |
| F20 | Vase-mode bins | ❌ [src][o20] | ? | ? | ? | ? | ? | ? | ❌ [src][tt] | ❌ [src][gp] | ? | — | — | — | — | ? | — | — | — | — | — | — | — | ? | ? | ? | ❌ [src][vec76] | ✅ [src][ken] | ? | ❌ [src][gpls] | ? | ? | ? | ? | ? | ❌ [src][phusck] | D4 — fast-print fans want single-wall bins; unblocks quick draft prints | to file |
| F21 | Spacerless fitting option (extend geometry instead of spacers) | ❌ [src][o21] | ? | ? | ? | ? | ? | ? | ❌ [src][tt] | ❌ [src][gp] | ? | — | ✅ [src][sprls] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D3 — users who hate filler want zero dead zones; unblocks a flush, spacer-free drawer | to file |
| F22 | Baseplate connectors / interlocking joints | ❌ [src][o22] | ? | ? | ? | ? | ? | ? | — | — | ? | ✅ [src][grips] | — | — | ✅ [src][click] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ [src][gpls] | — | — | — | — | — | — | D3 — users joining baseplates across big drawers need joints; unblocks large, multi-panel installs | to file |
| F23 | Laser-cut bins / trays (non-printed) | ❌ [src][o23] | ? | ? | ? | ? | ? | ? | ? | ? | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ [src][phusck] | D4 — laser owners want cut bins without printing; unblocks a non-printed build path | to file |
| F24 | Specialty holders (batteries, cards, tools, cartridges) | ❌ [src][o24] | ? | ? | ? | ? | ? | ? | ✅ [src][tt] | ✅ [src][gp] | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ [src][ostat] | — | — | — | — | — | — | — | D3 — users with batteries, cards, and small tools want fitted holders; unblocks organizing small items | to file |

## Job 3 — Get it printed

The job: turn the plan into filament on the build plate.

| ID | Feature | Ours | AM | GS | PL | GG | GC | EB | TT | GP | MWU | GRIPS | SPRLS | USHAPE | CLICK | GXWEB | GLBL | GFL | CULL | HALA | GFXYZ | ZACK | MODELS | FUSLEO | FUSWS | FUSPLUS | VEC76 | KEN | OSTAT | GPLS | GFTH | RJHU | MHMK | KMEI | CQGF | PHUSCK | Gap demand | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F25 | STL export | ✅ (Download files: one STL per distinct part, named with the quantity to print) [src][o25] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ✅ [src][gc] | ✅ [src][eb] | ✅ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | — | — | — | ✅ [src][click] | ✅ [src][gxweb] | — | — | — | — | — | — | — | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ✅ [src][cqgf] | — | D1 — without an STL there is nothing to print; unblocks the entire print job | to file |
| F26 | STEP export | ❌ [src][o26] | ✅ [src][am] | ? | ? | ✅ [src][gg] | ✅ [src][gc] | ? | ✅ [src][tt] | ❌ [src][gp] | ? | — | — | — | — | ? | — | — | — | — | — | — | — | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ✅ [src][cqgf] | — | D3 — CAD users who modify parts need STEP; unblocks editing parts in CAD | to file |
| F27 | 3MF export | ✅ (Download files: 3MF plates laid out for the selected printer bed, core spec, checked with lib3mf in strict mode) [src][o27] | ✅ [src][am] | ? | ? | ? | ❌ [src][gc] | ? | ✅ [src][tt] | ✅ [src][gp] | ✅ [src][mwu] | — | — | — | ✅ [src][click] | ? | — | — | — | — | — | — | — | ? | ? | ? | ? | ? | ? | ✅ [src][gpls] | ? | ? | ? | ? | ? | — | D3 — Bambu and Prusa slicer users want 3MF; unblocks one-file slicer handoff | to file |
| F28 | Print checklist / BOM (copy, download) | ✅ (Print plan card between the results and the labels: plate rows with per-plate part counts, Copy list with one line per part, plus the Download files README BOM) [src][o28] | ✅ [src][am] | ✅ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ? | ❌ [src][tt] | ❌ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D1 — every user needs a list of what to print; unblocks walking from plan to printer without retyping | #66, #5 |
| F29 | Baseplate splitting for the print bed | ✅ (layout splits by printer build volume) [src][o29] | ✅ [src][am] | ✅ [src][gs] | ? | ? | ❌ [src][gc] | ✅ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | ✅ [src][grips] | 🟡 [src][sprls] | ✅ [src][ushape] | ✅ [src][click] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ [src][gpls] | — | — | — | — | — | — | — (we have it) | — |
| F30 | Stacking / plate-packing print optimization | 🟡 (3MF plates pack parts onto the bed with 3 mm gaps and print identical plates N times; no stacking) [src][o30] | ✅ [src][am] | ✅ [src][gs] | 🟡 [src][pl] | ? | ❌ [src][gc] | ✅ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | ✅ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D1 — users printing many parts want fewer print jobs; unblocks efficient batch printing | #66, #5 |
| F31 | Filament / time / cost estimates | ✅ (Print plan card shows a rough-estimate line: ~time · ~grams · ~$cost, from the analytic volumes of the generated parts; material PLA/PETG/ABS, $/kg, and mm³/s are configurable in the card, persisted as `gridfinity_estimateSettings`, with the active assumptions stated on the card; defaults PLA 1.24 g/cm³, $20/kg, ~8 mm³/s) [src][o31] | ✅ [src][am] | ? | ? | ? | ❌ [src][gc] | ? | ❌ [src][tt] | ❌ [src][gp] | 🟡 [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D3 — budget- and time-conscious printers want a cost preview; unblocks deciding what is worth printing | to file |
| F32 | Test-fit workflow (small test print before committing) | ✅ (Test fit first switch in the Print plan card: a Test fit plate with one 1 × 1 baseplate + one edge spacer prints first and the counts include it; the test pieces ship in the Download files zip as their own STLs plus a first 3MF plate, plate-0-test-fit.3mf) [src][o32] | ? | ? | ? | ? | ? | ? | ? | ? | ✅ [src][mwu] | — | — | ✅ [src][ushape] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D2 — first-time printers fear wasting filament on a wrong fit; unblocks trusting the layout | to file |
| F33 | DXF / SVG export (laser / cutting) | ❌ [src][o33] | ? | ? | ? | ? | ? | ? | ✅ [src][tt] | ✅ [src][gp] | ? | — | — | — | — | — | — | — | — | — | — | — | — | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | D4 — laser and CNC users want vector exports; unblocks cutting parts on non-printers | to file |

## Job 4 — Label everything

The job: find the right bin without opening every bin.

| ID | Feature | Ours | AM | GS | PL | GG | GC | EB | TT | GP | MWU | GRIPS | SPRLS | USHAPE | CLICK | GXWEB | GLBL | GFL | CULL | HALA | GFXYZ | ZACK | MODELS | FUSLEO | FUSWS | FUSPLUS | VEC76 | KEN | OSTAT | GPLS | GFTH | RJHU | MHMK | KMEI | CQGF | PHUSCK | Gap demand | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F34 | Label tabs on bins | ❌ [src][o34] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ✅ [src][gc] | ? | ✅ [src][tt] | ✅ [src][gp] | ✅ [src][mwu] | — | — | — | — | ✅ [src][gxweb] | — | — | — | — | — | — | — | ✅ [src][fusleo] | ? | ? | ✅ [src][vec76] | ✅ [src][ken] | ? | — | — | — | — | — | — | — | D2 — every labeled drawer needs a place for the label; unblocks readable bins | to file |
| F35 | Printable / embossed label generation | ✅ (printable bin labels: paper card, Cullenect 36.4×11mm insert, bin-width 25mm that keeps the bin's width and prints landscape when needed; no blank trailing pages) [src][o35] | ✅ [src][amcl] | ? | ✅ [src][pl] | ? | ? | ? | ? | ✅ [src][gp] | ? | — | — | — | — | — | ✅ [src][glbl] | ✅ [src][gfl] | ✅ [src][cull] | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — (we have it) | to file |

## Job 5 — Save, share, revisit

The job: keep a layout, send it to someone, come back to it later.

| ID | Feature | Ours | AM | GS | PL | GG | GC | EB | TT | GP | MWU | GRIPS | SPRLS | USHAPE | CLICK | GXWEB | GLBL | GFL | CULL | HALA | GFXYZ | ZACK | MODELS | FUSLEO | FUSWS | FUSPLUS | VEC76 | KEN | OSTAT | GPLS | GFTH | RJHU | MHMK | KMEI | CQGF | PHUSCK | Gap demand | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F36 | Share via URL link (no account) | ✅ (versioned base64 `?share=` link, one-click copy) [src][o36] | ✅ [src][am] | ? | ❌ [src][pl] | ? | ❌ [src][gc] | ✅ [src][eb] | ❌ [src][tt] | ? | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — (we have it) | — |
| F37 | Save / persist layout locally | ✅ (settings persist in localStorage; the layout is derived from settings) [src][o37] | ✅ [src][am] | ? | ? | ? | ? | ? | ? | ? | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — (we have it) | — |
| F38 | Cloud sync / accounts | ❌ [src][o38] | ✅ [src][am] | ✅ [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ❌ [src][gc] | ? | ? | ? | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — multi-device users want layouts everywhere; unblocks phone-to-workshop handoff | to file |
| F39 | Real-time collaboration | ❌ [src][o39] | ✅ [src][am] | ? | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ❌ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — households and shops planning together want shared editing; unblocks joint layouts | to file |
| F40 | Import (JSON / CSV / STL) | ❌ [src][o40] | ? | ✅ [src][gs] | ❌ [src][pl] | ✅ [src][gg] | ❌ [src][gc] | ? | ❌ [src][tt] | ❌ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — users with existing layouts or models want to bring them in; unblocks migration | to file |
| F41 | Multi-drawer / multi-project management | 🟡 (duplicate-drawer multiplier; no named projects) [src][o41] | ✅ [src][am] | ? | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ❌ [src][eb] | ❌ [src][tt] | 🟡 [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — whole-workshop organizers want named projects; unblocks planning more than one drawer at a time | to file |

## Job 6 — Measure and learn

The job: measure correctly, learn the system, trust the result.

| ID | Feature | Ours | AM | GS | PL | GG | GC | EB | TT | GP | MWU | GRIPS | SPRLS | USHAPE | CLICK | GXWEB | GLBL | GFL | CULL | HALA | GFXYZ | ZACK | MODELS | FUSLEO | FUSWS | FUSPLUS | VEC76 | KEN | OSTAT | GPLS | GFTH | RJHU | MHMK | KMEI | CQGF | PHUSCK | Gap demand | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F42 | Measurement guidance (how to measure your drawer) | ✅ (collapsible how-to-measure guide under the drawer width and depth inputs) [src][o42] | ? | ? | ? | ? | ? | ? | ✅ [src][tt] | ✅ [src][gp] | ? | — | — | — | — | — | — | — | — | — | ✅ [src][gfxyz] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — (we have it) | to file |
| F43 | Tutorials / onboarding | ✅ (How it works section + in-app "How to measure your drawer" guide (2026-10-17) + guided tour via the "Take the tour" button in the calculator, 5 anchored steps with keyboard/Escape support (2026-10-20)) [src][o43] | ✅ [src][am] | ? | ✅ [src][pl] | ? | ❌ [src][gc] | ✅ [src][eb] | ✅ [src][tt] | ✅ [src][gp] | ✅ [src][mwu] | — | — | — | — | — | — | — | — | — | ✅ [src][gfxyz] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D3 — new users want a guided first run; unblocks first-time success | to file |
| F44 | Inspiration gallery / examples | ❌ [src][o44] | ✅ [src][am] | ? | ? | ? | ? | ? | ? | ? | ? | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — blank-drawer users want starting points; unblocks the cold start | to file |

## Job 7 — Cross-cutting

The job: use the tool anywhere, by anyone, fast.

| ID | Feature | Ours | AM | GS | PL | GG | GC | EB | TT | GP | MWU | GRIPS | SPRLS | USHAPE | CLICK | GXWEB | GLBL | GFL | CULL | HALA | GFXYZ | ZACK | MODELS | FUSLEO | FUSWS | FUSPLUS | VEC76 | KEN | OSTAT | GPLS | GFTH | RJHU | MHMK | KMEI | CQGF | PHUSCK | Gap demand | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F45 | Mobile UX (usable on a phone) | ✅ (2026-10-22 redesign: settings above the fold, collapsible sections that show their current value, sticky results bar that only sticks while editing, 44px touch targets, 16px inputs, safe-area insets; tap-target-safe list selection from #69) [src][o45] | ? | ? | ? | ? | ? | ? | ? | ? | ❌ [src][mwu] | — | — | — | — | — | ✅ [src][glbl] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D2 — workshop users measure at the drawer with a phone; unblocks measuring and checking on site | to file |
| F46 | Accessibility (tests plus statements) | ✅ (Axe, Pa11y, contrast checks in CI; tap-target fix in #69; published accessibility statement; focus trap + step renumbering in the guided tour; explicit focus-visible rings; label sheet hidden from screen readers with a counts summary; selected-piece styling; heading outline fixed; Lighthouse accessibility 100 on mobile and desktop after the 2026-10-22 redesign) [src][o46] | ? | ? | ? | ? | ? | ? | ? | ? | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D3 — keyboard and screen-reader users need full access; unblocks use for everyone | to file |
| F47 | Offline / PWA | ❌ [src][o47] | ✅ [src][am] | ? | ❌ [src][pl] | ? | ❌ [src][gc] | ? | ❌ [src][tt] | ❌ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | ✅ [src][glbl] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — workshop Wi-Fi is often bad; unblocks use without a connection | to file |
| F48 | AI-assistant integration (MCP) | ❌ [src][o48] | ❌ [src][am] | ❌ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ✅ [src][eb] | ❌ [src][tt] | ❌ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D4 — agent users want describe what you need, get a baseplate link; unblocks agent-driven planning | to file |
| F49 | Photo to custom holder | ❌ [src][o49] | ❌ [src][am] | ❌ [src][gs] | ❌ [src][pl] | ❌ [src][gg] | ❌ [src][gc] | ❌ [src][eb] | ✅ [src][tt] | ✅ [src][gp] | ❌ [src][mwu] | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | D3 — users with odd-shaped tools want zero-measuring onboarding; unblocks custom holders without CAD | to file |
| F50 | Free, no account, no paywall | ✅ (no backend, no login, share via URL) [src][o50] | ✅ [src][am] | 🟡 [src][gs] | ✅ [src][pl] | ✅ [src][gg] | ✅ [src][gc] | ✅ [src][eb] | 🟡 [src][tt] | 🟡 [src][gp] | ✅ [src][mwu] | ✅ [src][grips] | ✅ [src][sprls] | ✅ [src][ushape] | ✅ [src][click] | ✅ [src][gxweb] | ✅ [src][glbl] | ✅ [src][gfl] | ? | — | ✅ [src][gfxyz] | ✅ [src][zack] | 🟡 [src][models] | ✅ [src][fusleo] | ✅ [src][fusws] | ✅ [src][fusplus] | ✅ [src][vec76] | ✅ [src][ken] | ✅ [src][ostat] | ✅ [src][gpls] | ✅ [src][gfth] | ✅ [src][rjhu] | ✅ [src][mhmk] | ✅ [src][kmei] | ✅ [src][cqgf] | ✅ [src][phusck] | — (we have it; keep) | — |

## Rows added by the full tool set

Five rows were added because the full 35-tool inventory reveals features the 45-row map did not track. Each addition is a real, evidenced feature with at least one tool that has it. All five are missing in Ours, so parity moves from 27.8% (45 rows) to 25.0% (50 rows) on the same counting rule.

- Foam / shadowbox layout mode (F13): Tooltrace ships a Foam mode alongside its Gridfinity mode. A layout tool that only plans printed grids misses the foam-insert job.
- Baseplate connectors / interlocking joints (F22): GRIPS jigsaw tabs, ClickFinity joiner tabs and connector strips, and GridPlates locking tabs. Joining baseplate panels is a distinct feature from generating them.
- Laser-cut bins / trays (F23): Phusck Laser/Rhino is the non-printed build path. Tracking it keeps the map honest about manufacturing options beyond printing.
- Specialty holders (F24): ostat's item holder (memory cards, batteries, tools) and Tooltrace / GridPilot photo-traced custom holders. Fitted holders for specific items are a different job from generic bins.
- DXF / SVG export (F33): Tooltrace and GridPilot export DXF (and Tooltrace SVG) for laser / cutting workflows. STL / STEP / 3MF do not cover vector cutting formats.

## What ours does that most competitors do not (keep)

- Zero-config drawer to parts list in seconds. The fastest path in the set; andymai and Studio are more powerful but heavier.
- Spacer math done for you. Most generators leave filler to the user; Spacerless rejects spacers entirely. Our position: spacers computed, spacerless optional.
- Printer build-volume splitting built into the calc. Shared with andymai, MakerWorld configurator, and extrabold.tools; absent from most generators.
- No account, no paywall, no backend. Share via URL with no login matches andymai's account-optional stance and beats Studio, GridPilot, and Tooltrace paywalls.
- Half-size bin handling in the optimizer. Rare; most tools are full-cell only.
- Printer-bed exclusion zones. Distinct from drawer obstacles; most planners do not expose print-bed keepouts.

## Honesty log

- Mobile UX and accessibility for competitors: no surveyed homepage or README makes verifiable claims this pass could confirm without running each app. This map does not cite those as facts.
- Pricing for Tooltrace, GridPilot, GridfinityStudio, and gridfinitygenerator.com comes from vendor or comparison pages, not from a checkout. Pricing is not a row in this map.
- Perplexing Labs option lists (vase mode, M3 holes, thumbscrews, wall patterns, lip styles) come from a secondary summary; homepage navigation confirms system breadth, not every option. Its ? cells stay ?.
- andymai feature claims come from repo README plus release notes via search; the app itself was not driven click-by-click in this pass.
- gridfinitylabels.com was a pointer in the researcher file; this pass verified it against its repo (SvelteKit label generator: fastener and general labels, batch mode, PNG export, QR codes, mobile-responsive, offline after first load). Its cells are upgraded from ? to ✅ on that evidence. halagen remains a pointer (its site URL was confirmed to exist); its ? cell stays ?.
- GRIPS was a pointer in the researcher file (MakerWorld model 704997); this pass verified its listing (parametric baseplates, auto-cut pieces sized for the printer, jigsaw tabs, optional magnet support). Its cells are upgraded from ? to ✅ on that evidence.
- The Gridfinity Extended web generator README was re-read this pass: it confirms STL generation via OpenSCAD CLI, a Three.js 3D preview, bins 0.5–8u, baseplates 1–10u, lid options, and finger slide plus label tab. Its STL and 3D-preview cells are ✅ on that evidence; STEP and 3MF stay ? (README claims STL only).
- ZACK and MODELS have no single primary URL in the researcher file; their ✅ / 🟡 / ❌ cells cite gridfinity.xyz, the ecosystem index. MODELS is one grouped column for three marketplaces (Printables, Thangs, Cults), not three columns.
- build123d libraries (PaulBone, Ruudjhuu, moritzmhmk) and the kmeisthax CadQuery port: existence confirmed via gridfinity.xyz; feature details unverified beyond bins and baseplates. Their ? cells stay ?.
- No tools were installed, run, or purchased in this pass. All claims are from public pages, docs, and repos cited above.
- 2026-10-16 rebase: Ours F35 flipped to ✅ (PRs #86/#87 shipped printable labels in three styles); andymai's F35 cell flipped to ✅ on its CHANGELOG evidence for multiple label systems.
- 2026-10-18 refresh: andymai shipped "Places" bin-contents inventory in 4.517.0 (bins carry a list of what they hold, searchable from the command palette and mobile layouts sheet) — F10 gap justification updated; Ours F10 flipped to 🟡 on the per-group contents slice. No verifiable changes since 2026-10-16 at GridfinityStudio, Tooltrace, GridPilot, or gridfinitygenerator.com (no public changelogs; gridfinitygenerator's "New" Cutout generator undated). gridfinitylabels.com confirmed as kamilpajak/gridfinity-label-generator (latest release 3.1.1, 2026-09-19 — no new label features). Unmapped-tool triage: gridlabelstudio.com, stlkit3d.com, automaat/gridfinity-generator, and the Perplexing Labs hub systems are new-column candidates (no new rows); gridpitch.io (any-pitch designer) is a new column and its pitch-rebasing may deserve its own row; pocketry.xyz unverifiable (site would not load).
- 2026-10-19 refresh: andymai shipped 4.517.0 (Places: find a bin from the mobile layouts sheet — per-bin inventory search), 4.518.0/4.519.0 (Slant section in the bin designer — CAD-side, no planner-row impact). Ours F10 flipped to ✅ on the per-bin contents slice. No verifiable changes since 2026-10-18 at GridfinityStudio, Tooltrace, GridPilot, or gridfinitygenerator.com (no public changelogs). The eight unmapped tools in the honesty log remain unmapped (separate follow-up).
- 2026-10-17: Ours F42 flipped to ✅ (measurement-guidance PR: collapsible how-to-measure guide beside the drawer dimension inputs). Spot re-check of the top gaps: no competitor moved on F42, F32, or F34 overnight; the eight unmapped tools in the honesty log remain unmapped (separate follow-up).
- 2026-10-20 refresh: andymai shipped 4.519.0 (2026-10-19: slant bins in the bin designer, carried onto placed bins in 2D and 3D, size brush, end-support reservation) plus 4.519.1–4.519.3 slant fixes — CAD/bin-designer side, no planner-row impact. gridfinity-label-generator still v3.1.1 (2026-09-20). No verifiable changes since 2026-10-19 at GridfinityStudio, Tooltrace, GridPilot, or gridfinitygenerator.com (no public changelogs). Ours F43 flipped to ✅ (guided tour via the "Take the tour" button in the calculator: 5 anchored steps covering drawer dims, printer, bin options, results, share/labels). The eight unmapped tools in the honesty log remain unmapped (separate follow-up).
- Nine tools noted on main's narrow map 2026-10-16 plus SlantTools (2026-10-22) are not columns in this file yet: kamilpajak/gridfinity-label-generator ("GridScribe"), gridlabelstudio.com, stlkit3d.com ("STLKit3D"), gridpilot.us ("GridPilot"), pocketry.xyz ("Pocketry"), gridpitch.io ("GridPitch"), automaat/gridfinity-generator, the Perplexing Labs generator hub systems, and SlantTools (create.slant3d.com). Mapping them as columns is a follow-up.
- 2026-10-21 refresh: andymai shipped 4.520.0 (2026-10-21: screw plates where four pockets meet, no added height) plus 4.519.5/4.519.4 bug fixes (custom-shaped bin split export, half-grid bin feet, cloud-share compat, hinged-lid pin holes) — all bin-designer/baseplate-side, no planner-row impact; no F1–F50 cell changes for any tool. gridfinity-label-generator still v3.1.1 (2026-09-20).
- 2026-10-21 refresh: no verifiable changes since 2026-10-20 at GridfinityStudio, Tooltrace, GridPilot, or gridfinitygenerator.com (no public changelogs; homepages re-verified, "New" Cutout still undated). automaat/gridfinity-generator: dep-only bumps (vite 8.3.5, oxlint 1.89.0); latest release still v0.6.0 (2026-07-20). pocketry.xyz still unverifiable (fetch 2026-10-21 returned no content).
- 2026-10-21 new-tool scan: 3DPrintCAD published a Tray Generator guide (2026-10-15) and a Tool Insert Generator guide (2026-10-17) — parametric trays/bins/baseplates with labels, lids, magnets, stacking, STL/multi-color 3MF export; photo-to-traced-outline inserts with a Gridfinity 42mm mode (tool launch dates unverified, guide dates are the evidence). Tracefinity (photo-to-custom-gridfinity-bin, self-hosted) is a genuine index gap — repo created 2026-02-05, first release 0.1.0 2026-04-23, latest 0.10.0 2026-10-07 — but not new in the last 2 weeks; proposed for the unmapped list.
- 2026-10-21 demand signals: gridlabelstudio.com FAQ states embossed STL label relief (0.4mm, two-colour filament change) is "the next thing on the list" (not shipped; deepens F35, already ✅ Ours). gridpitch.io lists magnets and tool-shaped cutouts as "Coming soon to Pro" (announced, not shipped). stlkit3d.com ships a Filament Density & Cost Calculator (F31 competitor signal, tool still unmapped as a column) — F31 demand noted for a future slice; rejected for this run because estimate accuracy is unverifiable without bin-height/profile inputs, and the natural surface (print list) is blocked behind open PR #66.
- 2026-10-22 refresh: andymai shipped 4.521.0 (2026-10-22: print layout labels on linked blank-caption bins — label-side, F35 already ✅ for andymai, no new row) and 4.520.1 (2026-10-21: detachable feet seat flush — bin-designer bug fix, no planner-row impact). No F1–F50 cell changes for any tool. gridfinity-label-generator still 3.1.1 (2026-09-19); GridfinityStudio / Tooltrace / GridPilot / gridfinitygenerator.com unchanged since 2026-10-21; gridlabelstudio embossed-STL relief and gridpitch magnets/cutouts still "coming soon"; automaat/gridfinity-generator still v0.6.0; pocketry.xyz still unverifiable. NEW TOOL (unmapped candidate): SlantTools (create.slant3d.com, launched 2026-10-15 per Fabbaloo) — Gridfinity Organizer + Gridfinity Tool Organizer instant model generators, part-generation side, reinforces F15/F24 convergence. Ours F46 flipped to ✅ (accessibility statement published + tour focus trap/step renumbering/auto-expand + focus-visible rings + label-sheet screen-reader summary + selected-piece styling + heading outline fix). The unmapped tools (now nine, incl. SlantTools) remain unmapped (separate follow-up).
- 2026-10-22 ours: bins are now placed in the drawing (draw, move, resize, keyboard, undo/redo; contents per bin, in share links), and Download files exports every bin, baseplate, and spacer as STL plus 3MF plates packed for the printer bed. Ours F6, F14, F25, F27 flipped to ✅, F15 to 🟡 (no dividers, scoops, tabs, magnets, or lids), F30 stays 🟡 with plate packing and no stacking. Geometry follows kennetek gridfinity-rebuilt-openscad's spec constants; meshes are tested closed and outward-facing, and the 3MF plates read with zero warnings in lib3mf 2.5 strict mode. Parity 34.0% to 42.0%.
- 2026-10-26 refresh: andymai shipped 4.523.1 (2026-10-25, 3MF multi-color fix) and 4.523.2 (2026-10-26, lid slider, design-linking quick export, split-bin seam gap) — all bin-designer/export-side, no planner-row impact; no F1–F50 cell changes for any tool. gridfinity-label-generator still 3.1.1 (2026-09-20). gridlabelstudio embossed-STL relief still "coming soon". gridpitch magnets and tool cutouts still "Coming soon to Pro". SlantTools unchanged since its 2026-10-15 launch. GridfinityStudio, Tooltrace, GridPilot, gridfinitygenerator.com (automaat still v0.6.0, dep-only bumps) — no verifiable changes; pocketry.xyz still unverifiable. No new Gridfinity tool found launched in the last ~2 weeks. Ours F32 flipped to ✅ (one-click test-piece download shipped: the test-fit pieces are in the Download files zip as their own STLs plus a first 3MF test-fit plate; the test-fit switch state moved into the shared settings so the download follows it). Parity 44.0% to 45.0%.
- 2026-10-27 refresh: andymai still 4.523.2 (2026-10-26, already recorded); gridfinity-label-generator still 3.1.1 (2026-09-20); automaat/gridfinity-generator still v0.6.0 (2026-07-20); no F1–F50 cell changes for any tool. No new Gridfinity tool found launched in the last ~2 weeks (Mod Grid is an EDC-scale modular system at ~5.5 mm cells, not a 42 mm Gridfinity planner; 3DPrintCAD Tray Generator already noted 2026-10-21). Ours F31 flipped to ✅ (rough print estimates shipped on the Print plan card: ~time · ~grams PLA · ~$cost from the analytic volumes of the generated parts, fixed assumptions PLA 1.24 g/cm³, $20/kg, ~8 mm³/s stated on the card). Parity 45.0% to 47.0%.
- 2026-10-28 refresh: andymai still 4.523.2 (2026-10-26, GitHub API); gridfinity-label-generator still 3.1.1 (2026-09-20); automaat/gridfinity-generator still v0.6.0 (2026-07-20); no F1–F50 cell changes for any tool. No new Gridfinity planner tool found (Mod Grid is EDC-scale, already noted; the MakerWorld configurator guide PDF restates its own preset bin layouts, already mapped). Ours F31 stays ✅: estimate settings shipped (material PLA/PETG/ABS, $/kg, mm³/s configurable in the Print plan card, persisted as `gridfinity_estimateSettings`). Parity unchanged at 47.0%. F12 BLOCKED 2026-10-28: drawer-preset research found only 1 of 7+ candidates verifiable from a primary manufacturer source — IKEA publishes overall dims only (interior dims are community-measured blogs with noted manufacturing variation) and Harbor Freight publishes overall dims + volume only, no interior W×D; the wireframe's source-URL rule ("no guessed sizes") blocks shipping presets on those numbers, and a wrong preset prints a wrong baseplate. F44 examples are blocked by the same rule (projects.md: examples "must use real, sourced drawer sizes"). Revisit if manufacturers publish interior dims.
- 2026-10-25 refresh: andymai shipped 4.523.0 (2026-10-23: floor text for hollow bins, drainage-hole and detachable-foot fixes — bin-designer side, no planner-row impact); no F1–F50 cell changes for any tool. gridfinity-label-generator still 3.1.1 (2026-09-20). gridlabelstudio embossed-STL relief still "coming soon". gridpitch magnets and tool cutouts still "Coming soon to Pro". SlantTools unchanged since its 2026-10-15 launch. GridfinityStudio, Tooltrace, GridPilot, gridfinitygenerator.com (automaat still v0.6.0, dep-only bumps) — no verifiable changes; pocketry.xyz still unverifiable. No new Gridfinity tool found launched in the last ~2 weeks. Ours F32 flipped to 🟡 (Test fit first switch shipped: 1 × 1 baseplate + edge spacer as a first plate in the Print plan card, counts include it; one-click test-piece download remains the next slice). Parity 43.0% to 44.0%.
- 2026-10-23 refresh: andymai shipped 4.521.1 (2026-10-23: treating Safari's canceled kernel import as a stale asset — generation-side bug fix, no planner-row impact); no F1–F50 cell changes for any tool. gridfinity-label-generator still 3.1.1 (2026-09-19). gridlabelstudio embossed-STL relief still "coming soon". gridpitch magnets and tool cutouts still "Coming soon to Pro". SlantTools unchanged since its 2026-10-15 launch. GridfinityStudio, Tooltrace, GridPilot, gridfinitygenerator.com (automaat still v0.6.0, dep-only bumps) — no verifiable changes; pocketry.xyz still unverifiable. No new Gridfinity tool found launched in the last ~2 weeks. Ours F28 flipped to ✅ (Print plan card shipped: plate rows with per-plate part counts plus Copy list, one line per part; CSV/JSON download, test fit, and estimates remain later slices per docs/wireframes/print-and-export.md). Parity 42.0% to 43.0%.

## Sources

Per-tool primary sources are in the Tool index above; every ✅ / 🟡 / ❌ cell links to its tool's primary source. Ours sources are the repo links in the Ours cells.

[am]: https://github.com/andymai/gridfinity-layout-tool
[amcl]: https://github.com/andymai/gridfinity-layout-tool/blob/HEAD/CHANGELOG.md
[gs]: https://gridfinitystudio.com
[pl]: https://gridfinity.perplexinglabs.com/
[gg]: https://gridfinitygenerator.com/
[gc]: https://gridfinity.bouwens.co
[eb]: https://www.extrabold.tools/category/gridfinity
[tt]: https://www.tooltrace.ai
[gp]: https://gridpilot.us/
[mwu]: https://makerworld.com/en/models/2737065-ultimate-gridfinity-drawer-configurator
[grips]: https://makerworld.com/en/models/704997-grips-gridfinity-interlocking-baseplate-system
[sprls]: https://makerworld.com/en/models/2213671-spacerless-gridfinity-baseplate-generator
[ushape]: https://makerworld.com/en/models/2340157-parametric-gridfinity-u-shape-drawer-baseplate
[click]: https://github.com/frycookvc/clickfinityDrawerGen
[gxweb]: https://github.com/new-usemame/gridfinity_extended_generator
[glbl]: https://gridfinitylabels.com
[gfl]: https://github.com/ndevenish/gflabel
[cull]: https://gridfinity.perplexinglabs.com/
[hala]: https://timmmmmmmmm.github.io/halagen
[gfxyz]: https://gridfinity.xyz/
[zack]: https://gridfinity.xyz/
[models]: https://gridfinity.xyz/
[fusleo]: https://github.com/Le0Michine/FusionGridfinityGenerator
[fusws]: https://github.com/iluvmemes/GridfinityWorkshop
[fusplus]: https://github.com/edjohnson100/GridfinityGeneratorPlus
[vec76]: https://github.com/vector76/gridfinity_openscad
[ken]: https://github.com/kennetek/gridfinity-rebuilt-openscad
[ostat]: https://github.com/jpypi/gridfinity_extended_openscad
[gpls]: https://github.com/silversword411/GridPlates
[gfth]: https://github.com/PaulBone/gfthings
[rjhu]: https://github.com/Ruudjhuu/gridfinity_build123d
[mhmk]: https://github.com/moritzmhmk/gridfinity-build123d
[kmei]: https://github.com/kmeisthax/gridfinity-cadquery
[cqgf]: https://github.com/michaelgale/cq-gridfinity
[phusck]: https://github.com/mozabes/phusck-laser-rhino-gridfinity
[o1]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts
[o2]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts
[o3]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts
[o4]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/CustomPrinterDialog.tsx
[o5]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityVisualPreview.tsx
[o6]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityVisualPreview.tsx
[o7]: https://github.com/ntindle/gridfinity-space-optimizer
[o8]: https://github.com/ntindle/gridfinity-space-optimizer
[o9]: https://github.com/ntindle/gridfinity-space-optimizer
[o10]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/BinDetails.tsx
[o11]: https://github.com/ntindle/gridfinity-space-optimizer
[o12]: https://github.com/ntindle/gridfinity-space-optimizer
[o13]: https://github.com/ntindle/gridfinity-space-optimizer
[o14]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/export/gridfinityMesh.ts
[o15]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/export/binMesh.ts
[o16]: https://github.com/ntindle/gridfinity-space-optimizer
[o17]: https://github.com/ntindle/gridfinity-space-optimizer
[o18]: https://github.com/ntindle/gridfinity-space-optimizer
[o19]: https://github.com/ntindle/gridfinity-space-optimizer
[o20]: https://github.com/ntindle/gridfinity-space-optimizer
[o21]: https://github.com/ntindle/gridfinity-space-optimizer
[o22]: https://github.com/ntindle/gridfinity-space-optimizer
[o23]: https://github.com/ntindle/gridfinity-space-optimizer
[o24]: https://github.com/ntindle/gridfinity-space-optimizer
[o25]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/export/stl.ts
[o26]: https://github.com/ntindle/gridfinity-space-optimizer
[o27]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/export/threeMf.ts
[o28]: https://github.com/ntindle/gridfinity-space-optimizer/pull/66
[o29]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts
[o30]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/printPlan.ts
[o31]: https://github.com/ntindle/gridfinity-space-optimizer
[o32]: https://github.com/ntindle/gridfinity-space-optimizer
[o33]: https://github.com/ntindle/gridfinity-space-optimizer
[o34]: https://github.com/ntindle/gridfinity-space-optimizer
[o35]: https://github.com/ntindle/gridfinity-space-optimizer
[o36]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/ShareLayoutButton.tsx
[o37]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/hooks/usePersistedState.ts
[o38]: https://github.com/ntindle/gridfinity-space-optimizer
[o39]: https://github.com/ntindle/gridfinity-space-optimizer
[o40]: https://github.com/ntindle/gridfinity-space-optimizer
[o41]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/DrawerOptions.tsx
[o42]: https://github.com/ntindle/gridfinity-space-optimizer
[o43]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/HowItWorks.tsx
[o44]: https://github.com/ntindle/gridfinity-space-optimizer
[o45]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityVisualPreview.tsx
[o46]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/.github/workflows/accessibility.yml
[o47]: https://github.com/ntindle/gridfinity-space-optimizer
[o48]: https://github.com/ntindle/gridfinity-space-optimizer
[o49]: https://github.com/ntindle/gridfinity-space-optimizer
[o50]: https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/ShareLayoutButton.tsx

