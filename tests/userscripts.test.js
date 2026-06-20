import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';

const scriptPath = new URL('../scripts/ttyd-osc52-clipboard/ttyd-osc52-clipboard.user.js', import.meta.url);
const freePressScriptPath = new URL('../thefp.js', import.meta.url);
const makefilePath = new URL('../Makefile', import.meta.url);
const abookScriptPath = new URL('../scripts/abook-nzb-helpers/abook-nzb-helpers.user.js', import.meta.url);
const nzbkingScriptPath = new URL(
  '../scripts/nzbking-named-downloader/nzbking-named-downloader.user.js',
  import.meta.url,
);

async function readScript() {
  return readFile(scriptPath, 'utf8');
}

test('userscript metadata is public and installable', async () => {
  const source = await readScript();

  assert.match(source, /\/\/ ==UserScript==/);
  assert.match(source, /@name\s+ttyd OSC52 Clipboard/);
  assert.match(source, /@version\s+0\.1\.0/);
  assert.match(source, /@description\s+Copy tmux OSC52 clipboard sequences from ttyd\/xterm\.js/);
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
  assert.match(source, /@match\s+https:\/\/www\.thefp\.com\/\*/);
  assert.match(source, /@match\s+https:\/\/\*\.substack\.com\/\*/);
  assert.match(source, /@version\s+0\.0\.5/);
  assert.match(source, /@updateURL\s+https:\/\/raw\.githubusercontent\.com\/jeeftor\/userScripts\/master\/thefp\.js/);
});

test('Abook NZB Helpers is tracked as an installable userscript', async () => {
  const source = await readFile(abookScriptPath, 'utf8');

  assert.match(source, /@name\s+Abook NZB Helpers/);
  assert.match(source, /@version\s+1\.0\.1/);
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
  assert.match(source, /@version\s+1\.0\.1/);
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

  assert.match(source, /changed-versions/);
  assert.match(source, /all-versions/);
  assert.match(source, /scripts\/bump-userscript-versions\.mjs --changed/);
  assert.match(source, /scripts\/bump-userscript-versions\.mjs --all/);
});
