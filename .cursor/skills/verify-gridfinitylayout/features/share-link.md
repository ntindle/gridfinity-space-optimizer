# Share the layout with a link

Sharing copies a link that opens the exact current layout in a fresh browser: same drawer size, same printer, same bin options, same duplicate-drawer count. The link carries the layout in a `?share=` URL parameter, with no account and no backend.

## Sub-features

- `copy-share-link` copies the share link and confirms with a transient status.
- `apply-share-link` opens the link in a fresh context and applies the encoded layout.
- `share-link-clears-param` strips the `?share=` parameter from the URL after it applies.
- `share-link-failure-fallback` shows a selectable link when the clipboard write fails.

## How to get to it (user POV)

- Choose the `Copy share link` button below the option cards.
- Paste the copied link into a fresh browser tab or window.
- When copying fails, select the link from the `Share link — select and copy manually` textbox and copy it by hand.

## Driving it with the live browser

Preconditions:

- The app is healthy at the lane URL.
- The browser profile starts with empty `localStorage`.
- The Doctor check passes.
- The baseline layout is seeded: drawer width 15, drawer height 12, printer Bambu Lab A1, duplicate drawers 2.

- **Set duplicate drawers.** Fill the `Number of Duplicate Drawers` textbox with `2` and blur the field. Run the browser fill on the textbox labeled `Number of Duplicate Drawers` with value `2`, then blur the field. The heading reads `Results for 2 drawers`.
- **Copy the link.** Choose the `Copy share link` button. Run the browser click on the button named `Copy share link for this layout`. The button label becomes `Link copied!` and the status text reads `Send this link — it opens your exact layout.`
- **Read the clipboard.** Read the clipboard content from the browser task. The clipboard holds a URL on the same origin with a `?share=` parameter.
- **Apply the link in a fresh context.** Open the copied URL in a fresh browser context with empty `localStorage`. The calculator shows drawer width 15, drawer height 12, printer Bambu Lab A1, and the heading `Results for 2 drawers`.
- **Parameter stripped.** After the layout applies, the address bar no longer contains `?share=`. The applied settings stay.
- **Copy-failure fallback.** When the clipboard API is unavailable, the copy attempt shows the status `Copy failed — select the link below and copy it manually.` and a textbox labeled `Share link — select and copy manually` appears holding the full share URL. The fallback textbox stays until the next click so the user has time to copy it.
- **Proof.** Capture the copied state and the applied state. Run the browser screenshot of the fresh context to `share-link/applied.png`. The screenshot shows the app with the applied layout and no `?share=` parameter in the address bar.

## Gotchas

- The `Link copied!` label reverts after 2.5 seconds. Capture the status within that window or assert the status text, which updates at the same time.
- The share link encodes drawer size, printer, custom printer size, bin options, duplicate drawers, and the unit setting. Assert all of them in the fresh context, not just the drawer size.
- A share link opened in a profile with saved settings applies the link over the saved settings. Always use a fresh context for the apply step.
- The `?share=` parameter is stripped after it applies. Assert the applied state, not the parameter.
- In a browser without clipboard permission, the fallback input is the proof of the failure path. Do not report a clipboard failure as a copy success.
