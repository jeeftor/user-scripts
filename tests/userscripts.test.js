import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const workflowPath = new URL('../.github/workflows/check.yml', import.meta.url);
const readmePath = new URL('../README.md', import.meta.url);
const scriptPath = new URL('../scripts/ttyd-osc52-clipboard/ttyd-osc52-clipboard.user.js', import.meta.url);
const freePressScriptPath = new URL('../thefp.js', import.meta.url);
const makefilePath = new URL('../Makefile', import.meta.url);
const abookScriptPath = new URL('../scripts/abook-nzb-helpers/abook-nzb-helpers.user.js', import.meta.url);
const nzbkingScriptPath = new URL(
  '../scripts/nzbking-named-downloader/nzbking-named-downloader.user.js',
  import.meta.url,
);
const novncScriptPath = new URL(
  '../scripts/novnc-clipboard-bridge/novnc-clipboard-bridge.user.js',
  import.meta.url,
);
const shiftEnterScriptPath = new URL(
  '../scripts/ttyd-shift-enter/ttyd-shift-enter.user.js',
  import.meta.url,
);

const userscripts = [
  {
    name: 'Free Press Audio Downloader',
    path: 'thefp.js',
    url: freePressScriptPath,
    version: '0.0.6',
  },
  {
    name: 'Abook NZB Helpers',
    path: 'scripts/abook-nzb-helpers/abook-nzb-helpers.user.js',
    url: abookScriptPath,
    version: '1.0.2',
  },
  {
    name: 'NZBKing Named Downloader',
    path: 'scripts/nzbking-named-downloader/nzbking-named-downloader.user.js',
    url: nzbkingScriptPath,
    version: '1.0.2',
  },
  {
    name: 'ttyd OSC52 Clipboard',
    path: 'scripts/ttyd-osc52-clipboard/ttyd-osc52-clipboard.user.js',
    url: scriptPath,
    version: '0.1.2',
  },
  {
    name: 'noVNC Clipboard Bridge',
    path: 'scripts/novnc-clipboard-bridge/novnc-clipboard-bridge.user.js',
    url: novncScriptPath,
    version: '0.1.0',
  },
  {
    name: 'ttyd Shift+Enter Newline',
    path: 'scripts/ttyd-shift-enter/ttyd-shift-enter.user.js',
    url: shiftEnterScriptPath,
    version: '0.4.1',
  },
];

async function readScript() {
  return readFile(scriptPath, 'utf8');
}

test('userscript metadata is public and installable', async () => {
  const source = await readScript();

  assert.match(source, /\/\/ ==UserScript==/);
  assert.match(source, /@name\s+ttyd OSC52 Clipboard/);
  assert.match(source, /@version\s+0\.1\.2/);
  assert.match(source, /@description\s+Copy tmux OSC52 clipboard sequences from ttyd\/xterm\.js/);
  assert.match(source, /@author\s+jeeftor/);
  assert.match(source, /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/scripts\/ttyd-osc52-clipboard\/ttyd-osc52-clipboard\.user\.js/);
  assert.match(source, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/scripts\/ttyd-osc52-clipboard\/ttyd-osc52-clipboard\.user\.js/);
  assert.match(source, /@match\s+http:\/\/\*\/\*/);
  assert.match(source, /@match\s+https:\/\/\*\/\*/);
  assert.match(source, /@grant\s+GM_setClipboard/);
  assert.match(source, /@grant\s+GM_getValue/);
  assert.match(source, /@grant\s+GM_setValue/);
  assert.match(source, /@grant\s+GM_registerMenuCommand/);
  assert.doesNotMatch(source, /vookie|terminal\.example\.com|ssh\.example\.org/i);
});

test('personal hosts and debug state are stored outside git', async () => {
  const source = await readScript();

  assert.match(source, /GM_getValue\('allowedHosts', \[\]\)/);
  assert.match(source, /GM_setValue\('allowedHosts'/);
  assert.match(source, /GM_getValue\('debug', false\)/);
  assert.match(source, /GM_setValue\('debug'/);
  assert.match(source, /GM_registerMenuCommand\('Allow this host'/);
  assert.match(source, /GM_registerMenuCommand\('Toggle debug'/);
  assert.match(source, /getAllowedHosts\(\)\.includes\(location\.hostname\)/);
});

test('OSC52 handling copies decoded payloads and suppresses unsupported input', async () => {
  const source = await readScript();

  assert.match(source, /registerOscHandler\(52/);
  assert.match(source, /return true;/);
  assert.match(source, /payload === '\?'/);
  assert.match(source, /GM_setClipboard\(text, 'text'\)/);
  assert.match(source, /new TextDecoder\(\)\.decode\(bytes\)/);
  assert.match(source, /setInterval/);
  assert.match(source, /attempts >= 60/);
});

test('existing Free Press script is preserved at the root update URL path', async () => {
  const source = await readFile(freePressScriptPath, 'utf8');

  assert.match(source, /@name\s+Free Press Audio Downloader/);
  assert.match(source, /@author\s+jeeftor/);
  assert.match(source, /@match\s+https:\/\/www\.thefp\.com\/\*/);
  assert.match(source, /@match\s+https:\/\/\*\.substack\.com\/\*/);
  assert.match(source, /@version\s+0\.0\.6/);
  assert.match(source, /@grant\s+GM_setClipboard/);
  assert.match(source, /GM_setClipboard\(src, 'text'\)/);
  assert.match(source, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/thefp\.js/);
});

test('Abook NZB Helpers is tracked as an installable userscript', async () => {
  const source = await readFile(abookScriptPath, 'utf8');

  assert.match(source, /@name\s+Abook NZB Helpers/);
  assert.match(source, /@version\s+1\.0\.2/);
  assert.match(source, /@description\s+Add NZB search, NZBDonkey, and copy helpers to Abook topic pages\./);
  assert.match(source, /@author\s+jeeftor/);
  assert.match(source, /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/scripts\/abook-nzb-helpers\/abook-nzb-helpers\.user\.js/);
  assert.match(source, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/scripts\/abook-nzb-helpers\/abook-nzb-helpers\.user\.js/);
  assert.match(source, /@grant\s+GM_setClipboard/);
  assert.match(source, /@match\s+https:\/\/abook\.link\/book\/index\.php\?topic=\*/);
  assert.match(source, /@noframes/);
  assert.match(source, /const NZBLNK_ICON_SRC = 'data:image\/svg\+xml/);
  assert.match(source, /function textContentOf/);
  assert.match(source, /function parsePostTimestamp/);
  assert.match(source, /if \(typeof saythanks !== 'undefined'/);
  assert.match(source, /function inject_nzbdonkey/);
  assert.match(source, /function inject_search/);
  assert.match(source, /https:\/\/nzbking\.com\/search\/\?q=/);
});

test('NZBKing Named Downloader is tracked as an installable userscript', async () => {
  const source = await readFile(nzbkingScriptPath, 'utf8');

  assert.match(source, /@name\s+NZBKing Named Downloader/);
  assert.match(source, /@version\s+1\.0\.2/);
  assert.match(source, /@description\s+Download NZBKing NZB files with useful filenames from URL, clipboard, or page data\./);
  assert.match(source, /@author\s+jeeftor/);
  assert.match(source, /@downloadURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/scripts\/nzbking-named-downloader\/nzbking-named-downloader\.user\.js/);
  assert.match(source, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/scripts\/nzbking-named-downloader\/nzbking-named-downloader\.user\.js/);
  assert.match(source, /@match\s+https:\/\/nzbking\.com\/\*/);
  assert.match(source, /@noframes/);
  assert.match(source, /const DEBUG = false/);
  assert.match(source, /async function getClipboardText/);
  assert.match(source, /function sanitizeFilename/);
  assert.match(source, /function scanForNzbLinks/);
  assert.match(source, /new MutationObserver/);
  assert.match(source, /querySelectorAll\('a\[href\^="\/nzb:"\]'\)/);
});

test('Makefile can bump versions for changed userscripts or all userscripts', async () => {
  const source = await readFile(makefilePath, 'utf8');

  assert.match(source, /check/);
  assert.match(source, /changed-versions/);
  assert.match(source, /all-versions/);
  assert.match(source, /scripts\/bump-userscript-versions\.mjs --changed/);
  assert.match(source, /scripts\/bump-userscript-versions\.mjs --all/);
  assert.match(source, /scripts\/check-userscript-version-bumps\.mjs/);
  assert.match(source, /node --check/);
});

test('every userscript has required update metadata', async () => {
  for (const userscript of userscripts) {
    const source = await readFile(userscript.url, 'utf8');
    const rawUrl = `https://raw.githubusercontent.com/jeeftor/userScripts/master/${userscript.path}`;

    assert.match(source, /\/\/ ==UserScript==/, userscript.path);
    assert.match(source, /@name\s+\S+/, userscript.path);
    assert.match(source, /@description\s+\S+/, userscript.path);
    assert.match(source, /@author\s+jeeftor/, userscript.path);
    assert.match(source, new RegExp(`@version\\s+${userscript.version.replaceAll('.', '\\.')}`), userscript.path);
    assert.match(source, /@match\s+\S+/, userscript.path);
    assert.match(source, new RegExp(`@downloadURL\\s+${rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), userscript.path);
    assert.match(source, new RegExp(`@updateURL\\s+${rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), userscript.path);
  }
});

test('README exposes raw install links for each userscript', async () => {
  const source = await readFile(readmePath, 'utf8');

  for (const userscript of userscripts) {
    const rawUrl = `https://raw.githubusercontent.com/jeeftor/userScripts/master/${userscript.path}`;
    assert.match(source, new RegExp(`\\[${userscript.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`), userscript.name);
    assert.match(source, new RegExp(rawUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), userscript.name);
  }
});

test('noVNC Clipboard Bridge has correct structure and host allowlist pattern', async () => {
  const source = await readFile(novncScriptPath, 'utf8');

  assert.match(source, /@name\s+noVNC Clipboard Bridge/);
  assert.match(source, /@description\s+Floating paste\/copy buttons/);
  assert.match(source, /@grant\s+GM_setClipboard/);
  assert.match(source, /@grant\s+GM_getValue/);
  assert.match(source, /@grant\s+GM_setValue/);
  assert.match(source, /@grant\s+GM_registerMenuCommand/);
  assert.match(source, /@grant\s+unsafeWindow/);

  // Host allowlist pattern (same as ttyd script)
  assert.match(source, /GM_getValue\('allowedHosts', \[\]\)/);
  assert.match(source, /GM_setValue\('allowedHosts'/);
  assert.match(source, /GM_registerMenuCommand\('Allow this host'/);
  assert.match(source, /GM_registerMenuCommand\('Forget this host'/);
  assert.match(source, /getAllowedHosts\(\)\.includes\(location\.hostname\)/);

  // Auto-copy toggle stored outside git
  assert.match(source, /GM_getValue\('autoCopy', false\)/);
  assert.match(source, /GM_setValue\('autoCopy'/);
  assert.match(source, /GM_registerMenuCommand\('Toggle auto-copy from VM'/);

  // Core functionality
  assert.match(source, /rfb\.clipboardPasteFrom\(text\)/);
  assert.match(source, /rfb\.sendKey\(0xFFE3, 'ControlLeft'/);
  assert.match(source, /rfb\.sendKey\(0x0076, 'KeyV'/);
  assert.match(source, /GM_setClipboard\(text, 'text'\)/);
  assert.match(source, /navigator\.clipboard\.readText\(\)/);
  assert.match(source, /noVNC_clipboard_text/);
  assert.match(source, /unsafeWindow\.UI/);
  assert.match(source, /setInterval/);
  assert.match(source, /attempts >= 60/);
});

test('ttyd Shift+Enter Newline intercepts Shift+Enter and sends a literal newline', async () => {
  const source = await readFile(shiftEnterScriptPath, 'utf8');

  assert.match(source, /@name\s+ttyd Shift\+Enter Newline/);
  assert.match(source, /@description\s+Send a literal newline/);
  assert.match(source, /@grant\s+GM_getValue/);
  assert.match(source, /@grant\s+GM_setValue/);
  assert.match(source, /@grant\s+GM_registerMenuCommand/);
  assert.match(source, /@grant\s+unsafeWindow/);

  // Host allowlist pattern (same as other ttyd scripts)
  assert.match(source, /GM_getValue\('allowedHosts', \[\]\)/);
  assert.match(source, /GM_setValue\('allowedHosts'/);
  assert.match(source, /GM_registerMenuCommand\('Allow this host'/);
  assert.match(source, /GM_registerMenuCommand\('Forget this host'/);
  assert.match(source, /getAllowedHosts\(\)\.includes\(location\.hostname\)/);

  // Shift+Enter interception via xterm.js custom key handler API
  assert.match(source, /attachCustomKeyEventHandler/);
  assert.match(source, /e\.key !== 'Enter'/);
  assert.match(source, /e\.shiftKey/);
  assert.match(source, /return false;/);

  // Sends newline via term.paste() (respects bracketed paste mode) or raw
  assert.match(source, /term\.paste\(seq\)/);
  assert.match(source, /triggerDataEvent\(seq, true\)/);
  assert.match(source, /GM_getValue\('shiftEnterMode', 'paste-newline'\)/);

  // Configurable modes via menu commands (paste newline, paste ESC+CR, raw newline, raw ESC+CR)
  assert.match(source, /GM_registerMenuCommand\('Mode: paste \\\\n/);
  assert.match(source, /GM_registerMenuCommand\('Mode: raw \\\\n/);
  assert.match(source, /GM_registerMenuCommand\('Mode: paste ESC\+CR/);
  assert.match(source, /GM_registerMenuCommand\('Mode: raw ESC\+CR/);

  // Test commands
  assert.match(source, /GM_registerMenuCommand\('Test current mode'/);
  assert.match(source, /GM_registerMenuCommand\('Test all modes'/);
  assert.match(source, /testMode\(term, mode\)/);
  assert.match(source, /# \[/);
  assert.match(source, /setInterval/);
  assert.match(source, /attempts >= 60/);
});

test('GitHub Actions runs the repository check target', async () => {
  const source = await readFile(workflowPath, 'utf8');

  assert.match(source, /name: Check/);
  assert.match(source, /on:/);
  assert.match(source, /pull_request:/);
  assert.match(source, /push:/);
  assert.match(source, /npm test/);
  assert.match(source, /make check/);
  assert.match(source, /Check userscript version bumps/);
  assert.match(source, /scripts\/check-userscript-version-bumps\.mjs/);
});
