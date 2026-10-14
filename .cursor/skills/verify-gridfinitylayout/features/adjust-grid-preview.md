# Adjust the grid and see the preview update

Changing a grid option re-fits the layout and updates both the results list and the visual preview immediately. The preview cells and the results list must always describe the same layout.

## Sub-features

- `toggle-half-size-only` switches the layout to half-size bins only.
- `toggle-prefer-half-size-spacers` uses half-size bins for spacer areas.
- `toggle-uniform-baseplates` prefers uniform baseplate sizes in the layout.
- `preview-updates` re-renders the preview cells when any option changes.
- `results-update` updates the results quantities when any option changes.

## How to get to it (user POV)

- Flip the `Use only half-size bins (21x21mm)` switch in the bin options card.
- Flip the `Prefer half-size bins for spacers` switch in the bin options card.
- Flip the `Prefer uniform baseplate sizes` switch in the bin options card.
- Watch the `Visual Preview` section and the results list after each change.

## Driving it with the live browser

Preconditions:

- The app is healthy at the lane URL.
- The browser profile starts with empty `localStorage`.
- The Doctor check passes.
- The baseline layout is seeded: drawer width 15, drawer height 12, printer Bambu Lab A1.

- **Half-size bins only.** Flip the `Use only half-size bins (21x21mm)` switch. Run the browser click on the switch labeled `Use only half-size bins (21x21mm)`. The preview cells change to half-size bin labels, and the preview still matches the results quantities.
- **Prefer half-size spacers.** Flip the `Prefer half-size bins for spacers` switch. Run the browser click on the switch labeled `Prefer half-size bins for spacers`. The preview updates to show half-size bins in the spacer areas, and the preview still matches the results quantities.
- **Uniform baseplates.** Flip the `Prefer uniform baseplate sizes` switch. Run the browser click on the switch labeled `Prefer uniform baseplate sizes`. Record the resulting `Baseplates:` list and preview. A change is expected, but if the layout does not change, record the outcome and the layout as-is: the solver may have fallen back to the regular algorithm, and a no-change outcome is inconclusive, not a failure.
- **Preview matches results.** After each toggle, compare the preview cells with the results list. The preview cell labels and the results quantities describe the same layout; a toggle that changes one without the other is a failure.
- **Proof.** Capture the updated state after the uniform-baseplates toggle. Run the browser screenshot to `adjust-grid/uniform.png`. The screenshot shows the app, the updated `Baseplates:` list, and the updated `Visual Preview` section.

## Gotchas

- The two half-size switches are mutually exclusive. Turning one on turns the other off. Assert the resulting state of both switches after each toggle, not just the one that was clicked.
- Known gap: the results list never shows a `Half-size Bins:` section. The calculator renders the results component without passing the half-size flags, so the section's render condition is never true and the `Baseplates:` section never hides either. The preview does show half-size bins. Do not assert a `Half-size Bins:` results section; assert the preview change instead.
- The preview has no transition or loading state. Assert the DOM state after the change, not an animation.
- Changing any grid option clears the piece-details selection. Do not assert a details panel across a layout change.
- The preview cell labels show grid sizes in ASCII form (`3x2`) for baseplates. Half-size bin labels use different unit bases depending on the path: spacer-fill cells read as fractional full-grid units such as `0.5x0.5`, while half-size-only tiles read in half-grid units. Assert the label text, not the cell colors, and do not expect half-size labels to read like baseplate labels.
