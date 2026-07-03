// ==UserScript==
// @name         ttyd OSC52 Clipboard
// @version      0.1.2
// @description  Copy tmux OSC52 clipboard sequences from ttyd/xterm.js
// @author       jeeftor
// @match        http://*/*
// @match        https://*/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/ttyd-osc52-clipboard/ttyd-osc52-clipboard.user.js
// @updateURL    https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/ttyd-osc52-clipboard/ttyd-osc52-clipboard.user.js
// ==/UserScript==

(function () {
  'use strict';

  const MARK = '__ttydTmuxCopyInstalled';
  const PREFIX = '[ttyd tmux copy]';

  function getAllowedHosts() {
    return GM_getValue('allowedHosts', []);
  }

  function isDebugEnabled() {
    return GM_getValue('debug', false);
  }

  function log(...args) {
    if (isDebugEnabled()) {
      console.log(PREFIX, ...args);
    }
  }

  function saveAllowedHosts(hosts) {
    GM_setValue('allowedHosts', Array.from(new Set(hosts)).sort());
  }

  GM_registerMenuCommand('Allow this host', function () {
    const hosts = getAllowedHosts();
    saveAllowedHosts(hosts.concat(location.hostname));
    console.log(PREFIX, 'allowed host', location.hostname);
  });

  GM_registerMenuCommand('Forget this host', function () {
    const hosts = getAllowedHosts().filter(function (host) {
      return host !== location.hostname;
    });

    saveAllowedHosts(hosts);
    console.log(PREFIX, 'forgot host', location.hostname);
  });

  GM_registerMenuCommand('Toggle debug', function () {
    const debug = !isDebugEnabled();
    GM_setValue('debug', debug);
    console.log(PREFIX, 'debug', debug);
  });

  if (!getAllowedHosts().includes(location.hostname)) {
    log('host not allowlisted', location.hostname);
    return;
  }

  function decodeBase64Utf8(base64) {
    const cleaned = base64.replace(/\s/g, '');
    const binary = atob(cleaned);
    const bytes = Uint8Array.from(binary, function (char) {
      return char.charCodeAt(0);
    });

    return new TextDecoder().decode(bytes);
  }

  function findTerm() {
    // Use unsafeWindow.document so Firefox's XRay wrapper doesn't hide
    // expando properties (like __xtermTerminal) set by the page script.
    const textarea = unsafeWindow.document.querySelector('.xterm-helper-textarea');

    return unsafeWindow.term ||
      (textarea && textarea.__xtermTerminal) ||
      null;
  }

  function install(term) {
    if (!term) {
      return false;
    }

    if (term[MARK]) {
      return true;
    }

    if (!term.parser || typeof term.parser.registerOscHandler !== 'function') {
      return false;
    }

    term.parser.registerOscHandler(52, function (data) {
      const sep = data.indexOf(';');

      // Treat malformed OSC52 input as handled so xterm.js does not keep
      // processing it and emit parser noise.
      if (sep === -1) {
        log('ignored malformed payload');
        return true;
      }

      const selection = data.slice(0, sep);
      const payload = data.slice(sep + 1).replace(/\s/g, '');

      if (!payload || payload === '?') {
        log('ignored empty/query payload', { selection: selection });
        return true;
      }

      try {
        const text = decodeBase64Utf8(payload);
        GM_setClipboard(text, 'text');
        log('copied payload', { selection: selection, length: text.length });
      } catch (err) {
        console.error(PREFIX, 'copy failed', err);
      }

      return true;
    });

    term[MARK] = true;
    console.log(PREFIX, 'installed for', location.hostname);
    return true;
  }

  let attempts = 0;

  const timer = setInterval(function () {
    attempts += 1;

    if (install(findTerm())) {
      clearInterval(timer);
      return;
    }

    if (attempts >= 60) {
      clearInterval(timer);
      console.warn(PREFIX, 'terminal not found on', location.hostname);
    }
  }, 500);
})();
