# Export the design for printing

Exporting the design for printing means getting the layout out of the app in a form that can drive a print: a file download, a printable page, or a parts list that can be copied. This journey is currently missing its precondition: no export control exists in the UI.

## Sub-features

- `export-results` downloads or prints the layout results. Missing: no control exists.
- `export-csv-json` exports the layout as CSV or JSON. Missing: no control exists.
- `export-stl` exports printable STL files. Missing: no control exists.

## How to get to it (user POV)

- There is no export entry point in the UI. No button, menu, or link labeled Export, Download, or Print exists on the calculator page.
- The closest user-visible surfaces are the on-screen results list and the share link, which has its own feature file.

## Driving it with the live browser

Preconditions:

- The app is healthy at the lane URL.
- The browser profile starts with empty `localStorage`.
- The Doctor check passes.
- The baseline layout is seeded: drawer width 15, drawer height 12, printer Bambu Lab A1.

- **Look for an export control.** Search the calculator page for a button, link, or menu labeled Export, Download, or Print. Run the browser search for those accessible names. No such control exists. Report the journey as failed with the unmet precondition: no export control in the UI.
- **Do not substitute a stand-in.** Reading the results list aloud, copying the share link, or screenshotting the page is not an export. Those behaviors have their own proofs. This journey passes only when a real export control exists and produces output.
- **Proof of the missing control.** Capture a screenshot of the calculator page showing the full results area with no export control. Run the browser screenshot to `export-design/no-export-control.png`. The screenshot is evidence of the gap, not evidence of a passing journey.

## Gotchas

- The README claims the app can export designs for 3D printing. That claim describes an aspiration, not a shipped control. Do not treat the README as proof of the feature.
- The open pull request for export stackable prints is unmerged work. Do not treat an open PR as a shipped feature.
- When an export control ships, this file must be rewritten with its real handles and observable output, and the journey must be driven end to end before it is marked verified.
