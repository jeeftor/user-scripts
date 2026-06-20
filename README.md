# User Scripts

Tampermonkey user scripts that are safe to publish without personal hostnames or private settings.

## Install

| Script | Install | Source | Purpose |
| --- | --- | --- | --- |
| [Abook NZB Helpers](https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/abook-nzb-helpers/abook-nzb-helpers.user.js) | [raw](https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/abook-nzb-helpers/abook-nzb-helpers.user.js) | [`scripts/abook-nzb-helpers`](scripts/abook-nzb-helpers/) | Add NZB search, NZBDonkey, and copy helpers to Abook topic pages. |
| [Free Press Audio Downloader](https://raw.githubusercontent.com/jeeftor/userScripts/master/thefp.js) | [raw](https://raw.githubusercontent.com/jeeftor/userScripts/master/thefp.js) | [`thefp.js`](thefp.js) | Add open and copy URL buttons for audio elements on Free Press and Substack pages. |
| [NZBKing Named Downloader](https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/nzbking-named-downloader/nzbking-named-downloader.user.js) | [raw](https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/nzbking-named-downloader/nzbking-named-downloader.user.js) | [`scripts/nzbking-named-downloader`](scripts/nzbking-named-downloader/) | Add NZBKing download buttons with filenames from URL parameters, clipboard text, or page subjects. |
| [ttyd OSC52 Clipboard](https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/ttyd-osc52-clipboard/ttyd-osc52-clipboard.user.js) | [raw](https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/ttyd-osc52-clipboard/ttyd-osc52-clipboard.user.js) | [`scripts/ttyd-osc52-clipboard`](scripts/ttyd-osc52-clipboard/) | Copy tmux OSC52 clipboard sequences from ttyd/xterm.js through Tampermonkey. |

## Repository Rules

- Keep existing root-level scripts in place when moving them would break `@updateURL`.
- Put new installable scripts under `scripts/<script-name>/<script-name>.user.js`.
- Keep personal settings out of git. Use Tampermonkey storage or ignored `*.local.user.js` files.
- Keep plain `make` non-destructive. It must print target help only.
- Run `make check` before committing script changes.
