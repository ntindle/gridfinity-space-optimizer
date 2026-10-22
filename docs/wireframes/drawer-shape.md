# Drawer shape (F8, F12, F11, F21)

**Status:** not started. **Demand:** D2 (obstacles), D3 (presets, pitch, spacerless). **Slots:** S1, S3.

The job: fit real drawers, not just clean rectangles, and get to the first layout without calipers.

## Where it goes

All inputs live in the existing **Drawer** and **Bins** sections (S1). The drawing gains a "Front"
marker and obstacle shapes, but no new toolbar.

## Desktop

```text
Drawer                                             [in|mm]
  Drawer model   [Custom size                         ⇕]   ← F12, Popover + Command
  Width [ 22.5    in]   Depth [ 16.5    in]
  › How to measure your drawer
  Obstacles                                    [+ Add]     ← F8
    ▨ Slide bracket   at 0, 120 mm · 25 × 300 mm      ⋯
    ▨ Screw boss      at 400, 10 mm · 30 × 30 mm      ⋯
  Identical drawers                            [-] 1 [+]

Bins
  Grid             [42 mm | Custom]   [ 42   mm]           ← F11, input only when Custom
  Half-size bins only                                (○ )
  Fill gaps with half-size bins                      (○ )
  Uniform baseplates                                 (○ )
  Stretch edge baseplates                            (○ )  ← F21
    Edge baseplates grow to the walls instead of spacers.

Drawing
  ┌───────────────────────────────────────────┐
  │ ▦ 6×6 │ ▦ 6×6 │▦│░                        │   obstacles: ▨ hatched, destructive tint,
  │  ▨▨   │       │ │░                        │   pieces never overlap them
  └───────────────────────────────────────────┘
                     Front                          ← shown once obstacles exist
```

- **Presets (F12):** the picker copies `PrinterSettings.tsx`. Picking a model fills Width and Depth with its inside measurements. Editing either field switches the picker back to "Custom size". Each preset row shows its size with `formatSize`.
- **Obstacles (F8):** `+ Add` opens a `Dialog` with Name, Position (from the front-left inside corner) and Size, all using the unit-suffix inputs. Rows use the `PieceSwatch` style with a new `piece-obstacle` class. `⋯` offers Edit and Delete. Rectangles only; non-rectangular drawer walls come later.
- **Grid (F11):** custom pitch from 30 to 60 mm; half-size becomes pitch ÷ 2. Every label that says "42 mm" uses the active pitch instead.
- **Spacerless (F21):** the parts list shows stretched pieces as `Baseplate 6 × 6 (+12.7 mm)`, and spacers disappear from the summary.

## Phone

The same rows inside the collapsible Drawer and Bins sections. The collapsed Drawer summary becomes
`IKEA Alex · 22.5 × 16.5 in · 2 obstacles`. Obstacle dialogs become `vaul` sheets.

## Data

- `gridfinity_drawerModel`: preset id or `null`. Presets live in `src/lib/drawerPresets.ts` as `{ id, name, widthMm, depthMm, source }`. Every preset needs a `source` URL for the inside dimensions; no guessed sizes.
- `gridfinity_obstacles`: `{ id, name, x, y, width, depth }[]` in mm, measured from the front-left inside corner.
- `gridfinity_gridPitch`: number in mm, default 42. `gridfinity_spacerless`: boolean.
- Obstacles, pitch, and spacerless change the layout, so they go into share payload v2 (README rule 8).
- `calculateGrids` takes the new options; existing calls keep working through defaults. Obstacle cells become spacers or are left empty. Add fixtures to `gridfinityUtils.fixtures.ts`.

## Done when

- [ ] Engine tests: an obstacle in a corner, in the middle, and touching a wall; pitch 40 mm; spacerless on and off; half-size combinations.
- [ ] A randomized test (a few hundred drawers, obstacles, and printers) asserts that no piece overlaps an obstacle or leaves the drawer.
- [ ] UI tests for add, edit, and delete obstacle; picking a preset; the custom-pitch input; share links round-trip v2 and still open v1.
- [ ] Checked at 1440 px and 390 px, light and dark; feature-map rows updated.
