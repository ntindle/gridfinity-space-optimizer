# Preview piece details

Selecting a piece from the pieces list shows that piece's details: its type, grid size, physical size, grid position, and how many identical pieces are in the drawer. Matching pieces highlight in the preview. The panel is a dismissible card below the pieces list, and it works on touch because selection uses full-width list rows, never hover.

## Sub-features

- `list-pieces` shows one full-width row per distinct piece in the drawer.
- `select-piece-details` shows the details panel for the selected piece.
- `clear-selection` hides the details panel.
- `selection-clears-on-layout-change` clears the selection when the layout changes.
- `multi-piece-position` reports the first position when several identical pieces exist.

## How to get to it (user POV)

- Scroll to the `Visual Preview` section and the `Pieces in this drawer` list below it.
- Choose a row in the list, such as `Baseplate 3 × 2 — 2 in this drawer`.
- Choose the `Clear selection` button in the details panel to hide it.

## Driving it with the live browser

Preconditions:

- The app is healthy at the lane URL.
- The browser profile starts with empty `localStorage`.
- The Doctor check passes.
- The baseline layout is seeded: drawer width 15, drawer height 12, printer Bambu Lab A1.

- **List pieces.** Find the `Pieces in this drawer` heading. The list below it shows one full-width row per distinct piece, each reading `{Type} {w} × {h} — {count} in this drawer`, for example `Baseplate 3 × 2 — 2 in this drawer`. The grid separator is the `×` character, not the letter `x`.
- **Select a piece.** Choose the first list row. Run the browser click on the button named `{Type} {w} × {h} — {count} in this drawer` for the first row. A card titled `Piece details` appears below the list with rows for Type, Grid size, Physical size, Position, and Identical pieces. The matching cells in the preview gain a visible highlight.
- **Physical size follows the unit toggle.** With the unit toggle on inches, the Physical size row reads inches first, then mm in parentheses. Flip the unit switch and the order reverses to mm first, then inches.
- **Multi-piece position.** When the selected piece has more than one identical piece, the Position row reads `First at column X, row Y`. When it has exactly one, the Position row reads `Column X, row Y`.
- **Clear selection.** Choose the `Clear selection` button. Run the browser click on the button named `Clear selection`. The `Piece details` card disappears.
- **Selection clears on layout change.** Select a piece, then change a layout input such as the drawer width. Run the browser fill on the textbox labeled `Width (inches)` with a new value, then blur the field. The `Piece details` card disappears because the old selection may point at a different piece. The blur is required: typing alone does not commit the change.
- **Proof.** Capture the selected state. Run the browser screenshot to `preview-piece-details/selected.png`. The screenshot shows the app, the `Piece details` card with all five rows, and the highlighted preview cells.

## Gotchas

- Preview cells are visual divs, not buttons. Selection happens only through the `Pieces in this drawer` list rows.
- List rows are full-width buttons with `aria-pressed` state. Assert the pressed state of the selected row.
- The details panel clears on any layout change. Assert details before any layout-changing step.
- The `Clear selection` button is a `min-h-12` button with padding, not a full-width button. The list rows are the full-width ones. Do not look for a small close icon.
- Piece grouping is by type and grid size, in first-appearance order. Identical pieces share one row and one details panel.
