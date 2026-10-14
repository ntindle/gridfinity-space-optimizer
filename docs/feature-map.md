# Gridfinity Feature Map

Ours: [gridfinitylayout.com](https://gridfinitylayout.com/) — repo [ntindle/gridfinity-space-optimizer](https://github.com/ntindle/gridfinity-space-optimizer), baseline `main` at `a486b37` (PR #69 merged, 2026-10-14). Sibling Phase 0 PR #70 (`docs/backlog.md`) is docs, not a feature, and is not counted here. Dependabot and Snyk PRs are maintenance, not features, and are not rows.

## How to read

- Legend: ✓ = shipped on main, verified from the repo source linked in the row. ◐ = partially shipped, or an open PR delivers part of it. ✗ = not on main. `?` never appears in this file: anything unverified was left out or marked "unverified" in words.
- Ours values come from the repo source on `main`, not from marketing copy. The marketing claim "Export designs for 3D printing (Coming Soon!)" in `src/components/Features.tsx` describes a feature that does not exist; it is a dead end, not a feature.
- Source column carries the evidence for the row: the Ours link points at the repo file on `main`, the competitor link points at the primary page, repo, or listing that proves the claim.
- Gap demand ranks gaps by user demand, not by count. D1 blocks a core job for most users. D2 is competitor convergence plus frequent use. D3 is valuable for a segment or next-level. D4 is differentiation or nice-to-have. Every gap row carries a one-line justification: who wants it, what job it unblocks.
- Parity: `docs/scoreboard.md` defines the counting rule. The number is produced by `scripts/metrics/parity.mjs`, which parses the Job tables in this file. Keep Ours cells machine-readable: the first character must be exactly ✓, ◐, or ✗.
- Research input: `agent_notes/competitor-map-2026-10-14.md` in the goal workspace (38 tools, checked 2026-10-14). Where that research marked a cell `?`, this map does not present it as fact.
- Issues are not created from this file yet. "to file" in the Issue column means the issue gets filed after this map merges.

## Job 1 — Plan a drawer layout

The job: turn real drawer dimensions into a fitted Gridfinity plan.

| Feature | Ours | Best in class | Source | Gap demand | Issue |
|---|---|---|---|---|---|
| Drawer dims to fitted grid (auto baseplate layout) | ✓ (optimal baseplate layout for drawer size) | Ours, andymai Gridfinity Layout Tool | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts), [andymai](https://github.com/andymai/gridfinity-layout-tool) | — (we have it) | — |
| Spacer and filler math | ✓ (spacers computed for the non-42mm remainder) | Ours | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts) | — (we have it) | — |
| Half-size / 0.5u bins in the optimizer | ✓ | Ours, Perplexing Labs | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts), [Perplexing](https://gridfinity.perplexinglabs.com/) | — (we have it) | — |
| Printer-bed exclusion zones | ✓ (custom printer dialog, reduces printable area per side) | Ours | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/CustomPrinterDialog.tsx) | — (we have it) | — |
| Inspect a preview piece (details panel) | ✓ (list selection, type, grid size, mm/in, position, identical count) | Ours (PR #69) | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityVisualPreview.tsx) | — (we have it) | — |
| Drag-and-drop visual editor | ✗ | andymai Gridfinity Layout Tool | [andymai](https://github.com/andymai/gridfinity-layout-tool) | D2 — planners who arrange by hand want to move bins, not re-enter numbers; unblocks custom arrangements our auto-layout cannot express | to file |
| 3D preview | ✗ | andymai Gridfinity Layout Tool, GridfinityStudio | [andymai](https://github.com/andymai/gridfinity-layout-tool), [GridfinityStudio](https://gridfinitystudio.com) | D2 — anyone stacking or checking heights wants depth, not flat rectangles; unblocks multi-height planning | to file |
| Drawer obstacles, cutouts, custom perimeters | ✗ (printer-bed exclusion is a different feature, see above) | MakerWorld U-shape drawer baseplate (U-cutout for sink/siphon, mm-precise, auto-split) | [U-shape](https://makerworld.com/en/models/2340157-parametric-gridfinity-u-shape-drawer-baseplate) | D2 — owners of sink, tool, and odd drawers hit non-rectangles constantly; unblocks fitting real drawers | to file |
| Multi-layer / stacked layers | ✗ | andymai Gridfinity Layout Tool | [andymai](https://github.com/andymai/gridfinity-layout-tool) | D3 — deep-drawer owners want stacked layers; unblocks using full drawer depth | to file |
| Bin-contents planning (assign items to bins) | ✗ | andymai Gridfinity Layout Tool (categories), GridfinityStudio | [andymai](https://github.com/andymai/gridfinity-layout-tool), [GridfinityStudio](https://gridfinitystudio.com) | D2 — organizers plan what goes where, not just empty boxes; unblocks going from layout to a labeled, usable drawer | to file |
| Custom grid pitch / non-42mm optimizer | ✗ | GridfinityGeneratorPlus (Grid Optimizer recommends a pitch for a specific drawer) | [GridfinityGeneratorPlus](https://github.com/edjohnson100/GridfinityGeneratorPlus) | D3 — drawers where 42mm wastes space want a pitch that fits; unblocks near-zero-waste layouts | to file |
| Drawer presets (named furniture / toolboxes) | ✗ (no tool does this well; open lane) | None — open lane; MakerWorld configurator has printer presets, not drawer presets | [MakerWorld configurator](https://makerworld.com/en/models/2737065-ultimate-gridfinity-drawer-configurator) | D3 — new users with an IKEA Alex or Harbor Freight box want one tap, not calipers; unblocks the first layout | to file |

## Job 2 — Generate parts

The job: produce printable bins, baseplates, and lids, not just a parts list.

| Feature | Ours | Best in class | Source | Gap demand | Issue |
|---|---|---|---|---|---|
| Parametric baseplate generation (geometry plus STL) | ◐ (we compute baseplate sizes, not geometry or STLs) | Perplexing Labs, andymai Gridfinity Layout Tool | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts), [Perplexing](https://gridfinity.perplexinglabs.com/), [andymai](https://github.com/andymai/gridfinity-layout-tool) | D1 — every user who owns a printer needs a printable baseplate, not just a size; unblocks printing the grid itself | to file |
| Parametric bin generation | ✗ | Perplexing Labs, GridfinityCreator, gridfinitygenerator.com | [Perplexing](https://gridfinity.perplexinglabs.com/), [GridfinityCreator](https://gridfinity.bouwens.co), [gridfinitygenerator.com](https://gridfinitygenerator.com/) | D1 — every user needs bins to print; unblocks printing anything that holds items | to file |
| Lid generation | ✗ | Perplexing Labs (Anylid snap-on lids) | [Perplexing](https://gridfinity.perplexinglabs.com/) | D2 — users who stack or transport bins need lids; unblocks stackable, portable storage | to file |
| Magnets and screw holes options | ✗ (in generated parts; printer-bed exclusion is separate) | Perplexing Labs, GridfinityCreator | [Perplexing](https://gridfinity.perplexinglabs.com/), [GridfinityCreator](https://gridfinity.bouwens.co) | D3 — users who mount baseplates or secure bins need holes; unblocks fixed, rattle-free installs | to file |
| Compartments and dividers in generated bins | ✗ | GridfinityCreator, kennetek gridfinity-rebuilt-openscad | [GridfinityCreator](https://gridfinity.bouwens.co), [kennetek](https://github.com/kennetek/gridfinity-rebuilt-openscad) | D3 — users sorting small parts need dividers; unblocks one bin holding many item types | to file |
| Scoop, finger slide, label tab in generated bins | ✗ | GridfinityCreator, kennetek gridfinity-rebuilt-openscad | [GridfinityCreator](https://gridfinity.bouwens.co), [kennetek](https://github.com/kennetek/gridfinity-rebuilt-openscad) | D3 — users grabbing small items need scoops and slides; unblocks one-handed retrieval | to file |
| Vase-mode bins | ✗ | kennetek gridfinity-rebuilt-openscad | [kennetek](https://github.com/kennetek/gridfinity-rebuilt-openscad) | D4 — fast-print fans want single-wall bins; unblocks quick draft prints | to file |
| Spacerless fitting option (extend geometry instead of spacers) | ✗ | Spacerless baseplate generator (extends functional geometry 1–41mm in 1mm steps) | [Spacerless](https://makerworld.com/en/models/2213671-spacerless-gridfinity-baseplate-generator) | D3 — users who hate filler want zero dead zones; unblocks a flush, spacer-free drawer | to file |

## Job 3 — Get it printed

The job: turn the plan into filament on the build plate.

| Feature | Ours | Best in class | Source | Gap demand | Issue |
|---|---|---|---|---|---|
| STL export | ✗ | andymai Gridfinity Layout Tool, Perplexing Labs | [andymai](https://github.com/andymai/gridfinity-layout-tool), [Perplexing](https://gridfinity.perplexinglabs.com/) | D1 — without an STL there is nothing to print; unblocks the entire print job | to file |
| STEP export | ✗ | GridfinityCreator, gridfinitygenerator.com | [GridfinityCreator](https://gridfinity.bouwens.co), [gridfinitygenerator.com](https://gridfinitygenerator.com/) | D3 — CAD users who modify parts need STEP; unblocks editing parts in CAD | to file |
| 3MF export | ✗ | andymai Gridfinity Layout Tool, Tooltrace | [andymai](https://github.com/andymai/gridfinity-layout-tool), [Tooltrace](https://www.tooltrace.ai) | D3 — Bambu and Prusa slicer users want 3MF; unblocks one-file slicer handoff | to file |
| Print checklist / BOM (copy, download) | ◐ (open PR #66 implements a copy/download print list plus model-repository links; not merged) | andymai Gridfinity Layout Tool (Print List), GridfinityStudio (print queue plus ZIP of STLs) | [PR #66](https://github.com/ntindle/gridfinity-space-optimizer/pull/66), [andymai](https://github.com/andymai/gridfinity-layout-tool), [GridfinityStudio](https://gridfinitystudio.com) | D1 — every user needs a list of what to print; unblocks walking from plan to printer without retyping | #66, #5 |
| Baseplate splitting for the print bed | ✓ (layout splits by printer build volume) | Ours, andymai Gridfinity Layout Tool, extrabold.tools | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/utils/gridfinityUtils.ts), [andymai](https://github.com/andymai/gridfinity-layout-tool), [extrabold.tools](https://www.extrabold.tools/category/gridfinity) | — (we have it) | — |
| Stacking / plate-packing print optimization | ◐ (open PR #66 adds stacking recommendations from printer Z height; no plate packing) | andymai Gridfinity Layout Tool, GridfinityStudio | [PR #66](https://github.com/ntindle/gridfinity-space-optimizer/pull/66), [andymai](https://github.com/andymai/gridfinity-layout-tool), [GridfinityStudio](https://gridfinitystudio.com) | D1 — users printing many parts want fewer print jobs; unblocks efficient batch printing | #66, #5 |
| Filament / time / cost estimates | ✗ | andymai Gridfinity Layout Tool (Print List) | [andymai](https://github.com/andymai/gridfinity-layout-tool) | D3 — budget- and time-conscious printers want a cost preview; unblocks deciding what is worth printing | to file |
| Test-fit workflow (small test print before committing) | ✗ | MakerWorld Ultimate Drawer Configurator (bin/grid test modes) | [MakerWorld configurator](https://makerworld.com/en/models/2737065-ultimate-gridfinity-drawer-configurator) | D2 — first-time printers fear wasting filament on a wrong fit; unblocks trusting the layout | to file |

## Job 4 — Label everything

The job: find the right bin without opening every bin.

| Feature | Ours | Best in class | Source | Gap demand | Issue |
|---|---|---|---|---|---|
| Label tabs on bins | ✗ | GridfinityCreator, Perplexing Labs | [GridfinityCreator](https://gridfinity.bouwens.co), [Perplexing](https://gridfinity.perplexinglabs.com/) | D2 — every labeled drawer needs a place for the label; unblocks readable bins | to file |
| Printable / embossed label generation | ✗ | gflabel CLI (embossed, debossed, embedded, symbols, divisions, fonts), Cullenect labels via Perplexing Labs | [gflabel](https://github.com/ndevenish/gflabel), [Perplexing](https://gridfinity.perplexinglabs.com/) | D2 — every bin needs a label; unblocks finishing the drawer | to file |

## Job 5 — Save, share, revisit

The job: keep a layout, send it to someone, come back to it later.

| Feature | Ours | Best in class | Source | Gap demand | Issue |
|---|---|---|---|---|---|
| Share via URL link (no account) | ✓ (versioned base64 `?share=` link, one-click copy) | Ours (PR #68), andymai Gridfinity Layout Tool (Cloud Sharing via link) | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/ShareLayoutButton.tsx), [andymai](https://github.com/andymai/gridfinity-layout-tool) | — (we have it) | — |
| Save / persist layout locally | ✓ (settings persist in localStorage; the layout is derived from settings) | Ours | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/hooks/usePersistedState.ts) | — (we have it) | — |
| Cloud sync / accounts | ✗ | andymai Gridfinity Layout Tool (Google/GitHub sign-in, opt-in) | [andymai](https://github.com/andymai/gridfinity-layout-tool) | D4 — multi-device users want layouts everywhere; unblocks phone-to-workshop handoff | to file |
| Real-time collaboration | ✗ | andymai Gridfinity Layout Tool | [andymai](https://github.com/andymai/gridfinity-layout-tool) | D4 — households and shops planning together want shared editing; unblocks joint layouts | to file |
| Import (JSON / CSV / STL) | ✗ | GridfinityStudio, gridfinitygenerator.com | [GridfinityStudio](https://gridfinitystudio.com), [gridfinitygenerator.com](https://gridfinitygenerator.com/) | D4 — users with existing layouts or models want to bring them in; unblocks migration | to file |
| Multi-drawer / multi-project management | ◐ (duplicate-drawer multiplier; no named projects) | andymai Gridfinity Layout Tool | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/DrawerOptions.tsx), [andymai](https://github.com/andymai/gridfinity-layout-tool) | D4 — whole-workshop organizers want named projects; unblocks planning more than one drawer at a time | to file |

## Job 6 — Measure and learn

The job: measure correctly, learn the system, trust the result.

| Feature | Ours | Best in class | Source | Gap demand | Issue |
|---|---|---|---|---|---|
| Measurement guidance (how to measure your drawer) | ✗ | gridfinity.xyz (spec plus FAQ), Tooltrace (photo and parallax guidance) | [gridfinity.xyz](https://gridfinity.xyz/), [Tooltrace](https://www.tooltrace.ai) | D2 — bad input measurements are the top wrong-layout cause; unblocks correct first layouts | to file |
| Tutorials / onboarding | ◐ (HowItWorks section exists; no measurement tutorial) | Perplexing Labs, Tooltrace | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/HowItWorks.tsx), [Perplexing](https://gridfinity.perplexinglabs.com/), [Tooltrace](https://www.tooltrace.ai) | D3 — new users want a guided first run; unblocks first-time success | to file |
| Inspiration gallery / examples | ✗ | andymai Gridfinity Layout Tool (Inspiration Gallery: workshop, kitchen, office, hobby) | [andymai](https://github.com/andymai/gridfinity-layout-tool) | D4 — blank-drawer users want starting points; unblocks the cold start | to file |

## Job 7 — Cross-cutting

The job: use the tool anywhere, by anyone, fast.

| Feature | Ours | Best in class | Source | Gap demand | Issue |
|---|---|---|---|---|---|
| Mobile UX (usable on a phone) | ◐ (responsive layout; #69 fixed tap targets via list selection; not phone-optimized) | andymai Gridfinity Layout Tool (PWA; phone UX itself unverified) | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityVisualPreview.tsx), [andymai](https://github.com/andymai/gridfinity-layout-tool) | D2 — workshop users measure at the drawer with a phone; unblocks measuring and checking on site | to file |
| Accessibility (tests plus statements) | ◐ (Axe, Pa11y, contrast checks in CI; tap-target fix in #69; no published statement) | Ours (CI) — no competitor makes verifiable a11y claims | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/.github/workflows/accessibility.yml) | D3 — keyboard and screen-reader users need full access; unblocks use for everyone | to file |
| Offline / PWA | ✗ | andymai Gridfinity Layout Tool (PWA offline) | [andymai](https://github.com/andymai/gridfinity-layout-tool) | D4 — workshop Wi-Fi is often bad; unblocks use without a connection | to file |
| AI-assistant integration (MCP) | ✗ | extrabold.tools (MCP server: baseplate links from an AI assistant) | [extrabold.tools](https://www.extrabold.tools/category/gridfinity) | D4 — agent users want "describe what you need, get a baseplate link"; unblocks agent-driven planning | to file |
| Photo to custom holder | ✗ | Tooltrace (photo to traced holder, STL/3MF/STEP/DXF/SVG), GridPilot (photo to full 3D tray) | [Tooltrace](https://www.tooltrace.ai), [GridPilot](https://gridpilot.us/) | D3 — users with odd-shaped tools want zero-measuring onboarding; unblocks custom holders without CAD | to file |
| Free, no account, no paywall | ✓ (no backend, no login, share via URL) | Ours, andymai Gridfinity Layout Tool | [ours](https://github.com/ntindle/gridfinity-space-optimizer/blob/main/src/components/GridfinityCalculator/ShareLayoutButton.tsx), [andymai](https://github.com/andymai/gridfinity-layout-tool) | — (we have it; keep) | — |

## CAD and code libraries (different approach, not feature rows)

These are libraries and add-ins for people who already use CAD or Python. They are not web planners, so they are not rows in the Job tables and do not count toward parity. They matter because they set the ceiling for part generation quality.

| Tool | Platform | Bins | Baseplates | Lids | Notes |
|---|---|---|---|---|---|
| GridfinityGeneratorPlus | Fusion 360 add-in | ✓ | ✓ | Unverified | Persistent palette, settings travel with the .f3d file, Grid Optimizer for non-42mm pitch, stackable baseplates, themes. [Source](https://github.com/edjohnson100/GridfinityGeneratorPlus) |
| Gridfinity Workshop | Fusion 360 add-in | ✓ | ✓ | Unverified | Continuation of the original Le0Michine add-in. [Source](https://github.com/iluvmemes/GridfinityWorkshop) |
| vector76 gridfinity_openscad | OpenSCAD | ✓ | ✓ | Unverified | Fit-matched to the original; customizer UI; fractional 0.5u bins; printable-overhang holes. [Source](https://github.com/vector76/gridfinity_openscad) |
| kennetek gridfinity-rebuilt-openscad | OpenSCAD | ✓ | ✓ | Unverified | Ground-up port; manual compartments; dividing bases; removed-material bases; vase-mode bins. [Source](https://github.com/kennetek/gridfinity-rebuilt-openscad) |
| ostat gridfinity_extended_openscad | OpenSCAD | ✓ | ✓ | ✓ | Accurate Zack reproduction plus item holders, tray, glue-stick and socket holders, silverware drawer. [Source](https://github.com/jpypi/gridfinity_extended_openscad) |
| GridPlates | OpenSCAD | ✗ | ✓ | ✗ | Baseplate-only; mm or grid-unit input; multi-plate 3MF export; panel numbering. [Source](https://github.com/silversword411/GridPlates) |
| cq-gridfinity (michaelgale) | CadQuery (Python) | ✓ | ✓ | Unverified | GridfinityBox, GridfinityBaseplate, GridfinityDrawerSpacer, GridfinityRuggedBox; STL plus STEP. [Source](https://github.com/michaelgale/cq-gridfinity) |
| build123d libraries (PaulBone, Ruudjhuu, moritzmhmk) and kmeisthax CadQuery port | Python | ✓ | ✓ | Unverified | Existence confirmed via gridfinity.xyz; feature details unverified. [Source](https://gridfinity.xyz/) |
| Phusck Laser/Rhino Gridfinity | Rhino/Grasshopper plus laser | ✓ | ✓ | ✗ | Laser-cut bins and trays; PDFs plus generator scripts. The non-printed path. [Source](https://github.com/mozabes/phusck-laser-rhino-gridfinity) |

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
- Perplexing Labs option lists (vase mode, M3 holes, thumbscrews, wall patterns, lip styles) come from a secondary summary; homepage navigation confirms system breadth, not every option.
- andymai feature claims come from repo README plus release notes via search; the app itself was not driven click-by-click in this pass.
- gridfinitylabels.com, halagen, and GRIPS internals: pointers only, not deeply verified; they are not rows.
- No tools were installed, run, or purchased in this pass. All claims are from public pages, docs, and repos cited above.
