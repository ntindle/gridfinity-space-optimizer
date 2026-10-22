# 3D preview (F7)

**Status:** not started. **Demand:** D2. **Slot:** S3.

The job: see heights and stacking, not just the flat footprint.

## Where it goes

A `[2D | 3D]` `SegmentedControl` at the left of the drawing toolbar (S3, shared with
[layout-editor.md](layout-editor.md)). 3D replaces the drawing in the same box, at the same size.

## Desktop

```text
[2D | 3D]                                                          Reset view
┌────────────────────────────────────────────────────────────────────────────┐
│                  ___________________                                       │
│               __/ ▦ ▦ ▦ /▦ ▦ ▦ /▦/░ /__        drag: orbit, wheel: zoom    │
│            __/ ▦ ▦ ▦ /▦ ▦ ▦ /▦/░ /__/          right-drag: pan             │
│           /___________________/__/             click: select, same as 2D   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
Baseplate · Half-size bin · Spacer · Bin   (legend unchanged)
```

- Lazy-load `three` and `@react-three/fiber` with `React.lazy` so the main bundle does not grow. Show the 2D drawing until the 3D chunk is ready. No spinner unless loading takes longer than 300 ms.
- Draw pieces with instanced meshes so 500+ pieces stay smooth. Baseplates are flat plates, spacers are lower and darker, and bins from [bins.md](bins.md) are boxes at their unit height. Take heights from the Gridfinity spec on gridfinity.xyz.
- Colors come from the same CSS tokens as 2D (`--plate`, `--half`, `--spacer-hatch`, `--brand` for selection), read once with `getComputedStyle`, so dark mode works.
- No auto-rotate and no intro animation. The camera starts at a fixed three-quarter view; `Reset view` returns there.

## Phone

Allowed. One finger orbits and two fingers zoom. Cap device pixel ratio at 2. The canvas is shorter
than the screen, so the page can still be scrolled from outside it.

## States

| State | Shows |
| --- | --- |
| No WebGL | Hide the `[2D | 3D]` control entirely |
| 3D chunk fails to load | Stay in 2D and toast "3D preview couldn't load" |
| Reduced motion | Camera moves only on input, never on its own |

## Done when

- [ ] The main bundle size is unchanged (compare `npm run build` output before and after).
- [ ] Selection syncs between 2D, 3D, and the parts list (tested at the component level with the 3D scene mocked).
- [ ] Checked at 1440 px and 390 px, light and dark; feature-map row updated.
