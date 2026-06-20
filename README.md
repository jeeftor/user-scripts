# User Scripts

Tampermonkey user scripts that are safe to publish without personal hostnames or private settings.

## Scripts

| Script | Purpose |
| --- | --- |
| [`Abook NZB Helpers`](scripts/abook-nzb-helpers/) | Add NZB search, NZBDonkey, and copy helpers to Abook topic pages. |
| [`Free Press Audio Downloader`](thefp.js) | Existing Free Press/Substack audio downloader script. Kept at the repository root so existing Tampermonkey update URLs keep working. |
| [`NZBKing Named Downloader`](scripts/nzbking-named-downloader/) | Add NZBKing download buttons with filenames from URL parameters, clipboard text, or page subjects. |
| [`ttyd OSC52 Clipboard`](scripts/ttyd-osc52-clipboard/) | Copy tmux OSC52 clipboard sequences from ttyd/xterm.js through Tampermonkey. |

## Repository Rules

- Keep existing root-level scripts in place when moving them would break `@updateURL`.
- Put new installable scripts under `scripts/<script-name>/<script-name>.user.js`.
- Keep personal settings out of git. Use Tampermonkey storage or ignored `*.local.user.js` files.
- Keep plain `make` non-destructive. It must print target help only.
- Run `make test` before committing script changes.
