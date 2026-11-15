# Enter drawer dimensions and printer

Entering drawer dimensions and a printer size produces a fitted Gridfinity layout: a results list of baseplates and spacers, plus a visual preview of the drawer. This is the app's core job.

## Sub-features

- `enter-drawer-dims` enters a drawer width and height and produces a layout.
- `pick-printer` chooses a printer from the printer list and re-fits the layout to that printer.
- `custom-printer` defines a custom printer size and exclusion zones through the dialog.
- `unit-toggle` switches the dimension inputs and physical sizes between inches and mm.
- `duplicate-drawers` multiplies all result quantities by the number of duplicate drawers.
- `results-appear` shows the results list and visual preview once a layout computes.

## How to get to it (user POV)

- Open the app at `/` and scroll to the `Try the Calculator` section.
- Type into the `Width` and `Height` inputs under the drawer dimensions card.
- Choose the printer picker combobox in the printer settings card, under the `Printer Model` label.
- Choose `Custom Printer` in the printer list to open the `Custom Printer Settings` dialog.
- Flip the unit switch next to the `Inches` and `mm` labels.
- Type into the `Number of Duplicate Drawers` input in the drawer options card.

## Driving it with the live browser

Preconditions:

- The app is healthy at the lane URL.
- The browser profile starts with empty `localStorage`.
- The Doctor check passes.

- **Enter drawer dimensions.** Fill the `Width (inches)` textbox with `15` and the `Height (inches)` textbox with `12`, blurring each field after typing, such as by pressing Tab. Run the browser fill on the textbox labeled `Width (inches)` with value `15`, blur the field, then the textbox labeled `Height (inches)` with value `12`, and blur the field. The heading `Results for 1 drawer` appears, a `Baseplates:` list appears, and the `Visual Preview` section appears with labeled cells.
- **Pick a printer.** The default printer is already Bambu Lab A1, so picking it proves nothing. Open the printer picker and choose `Prusa i3 MK3S+`. Run the browser click on the combobox button whose text reads `Bambu Lab A1`, then the browser click on the option `Prusa i3 MK3S+`. The results list updates for the Prusa build volume and the preview still renders.
- **Custom printer.** Choose `Custom Printer` in the printer list. Run the browser click on the combobox button, then the browser click on the option `Custom Printer`. A dialog titled `Custom Printer Settings` appears. Fill the `X (in)`, `Y (in)`, and `Z (in)` textboxes with `7`, `7`, and `7`, then choose `Save`. Run the browser fill on each textbox and the browser click on the button named `Save`. The dialog closes and the results list updates for the 7 by 7 inch bed.
- **Unit toggle.** Flip the unit switch. Run the browser click on the switch labeled by `Inches` and `mm`. The dimension labels read `Width (mm)` and `Height (mm)`, and the values convert to mm.
- **Duplicate drawers.** Fill the `Number of Duplicate Drawers` textbox with `2` and blur the field. Run the browser fill on the textbox labeled `Number of Duplicate Drawers` with value `2`, then blur the field. The heading reads `Results for 2 drawers` and every quantity in the results list doubles.
- **Proof.** Capture the populated results state. Run the browser screenshot to `enter-dimensions/results.png`. The screenshot shows the app, the `Results for 2 drawers` heading, and the `Visual Preview` section.

## Gotchas

- Drawer width and height inputs commit on blur, not on change. Typing alone updates only local field state. An invalid non-empty value reverts to the previous valid value on blur; only an empty value sets 0 and clears the display.
- The printer picker is a combobox button whose accessible name is its text content: it reads `Select printer...` before a choice and the selected printer name after. The `Printer Model` text above it is a visible label, not the button's accessible name. A name-based lookup for `Printer Model` fails.
- The custom printer dialog validates dimensions against a 600 mm maximum after converting to mm. In inches mode, 200 inches converts to 5080 mm and fails validation, so the dialog stays open with an error. The recipe uses 7 inches per axis, which converts to a valid size.
- The custom printer dialog also offers exclusion zones for front, back, left, and right. The exclusion-zone inputs start empty; leaving them empty keeps the full bed usable.
- Results appear only once the layout computes. Zero or missing dimensions produce no preview; the `Results for N drawers` heading still renders but the Baseplates and Spacers sections are empty.
- Reloading the page restores the same settings from `localStorage`. A fresh profile starts from defaults, not from the seeded values.
