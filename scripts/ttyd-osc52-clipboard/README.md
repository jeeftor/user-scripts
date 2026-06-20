# ttyd OSC52 Clipboard

Copies tmux OSC52 clipboard sequences from ttyd/xterm.js to the local clipboard through Tampermonkey.

## Install

Open `ttyd-osc52-clipboard.user.js` in a browser with Tampermonkey installed, then install or update the script.

## Personal Settings

The committed script intentionally uses broad `@match` rules and exits unless the current hostname is allowlisted in Tampermonkey storage.

After installing:

1. Visit your ttyd host.
2. Open the Tampermonkey menu for this script.
3. Run `Allow this host`.
4. Reload the page.

Use `Toggle debug` from the same menu when you need diagnostic logging.

No personal hostnames should be committed to this file.
