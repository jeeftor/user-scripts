// ==UserScript==
// @name         ttyd Shift+Enter Newline
// @version      0.2.0
// @description  Send a literal newline (not execute) when Shift+Enter is pressed in ttyd/xterm.js
// @author       jeeftor
// @match        http://*/*
// @match        https://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/ttyd-shift-enter/ttyd-shift-enter.user.js
// @updateURL    https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/ttyd-shift-enter/ttyd-shift-enter.user.js
// ==/UserScript==

(function () {
  'use strict';

  const MARK = '__ttydShiftEnterInstalled';
  const PREFIX = '[ttyd shift+enter]';

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

  // Sequence to send when Shift+Enter is pressed.
  // Default is '\n' sent via term.paste(), which respects bracketed paste
  // mode — so bash/zsh insert a literal newline instead of executing.
  // Alternatives: '\x1b\r' (Alt+Enter / ESC+CR), '\n' (raw LF).
  function getSequence() {
    return GM_getValue('shiftEnterSequence', '\n');
  }

  GM_registerMenuCommand('Set sequence to \\n (paste newline)', function () {
    GM_setValue('shiftEnterSequence', '\n');
    console.log(PREFIX, 'sequence set to \\n (paste newline)');
  });

  GM_registerMenuCommand('Set sequence to ESC+CR (Alt+Enter)', function () {
    GM_setValue('shiftEnterSequence', '\x1b\r');
    console.log(PREFIX, 'sequence set to ESC+CR');
  });

  function sendData(term, seq) {
    // term.paste() is the public xterm.js API for injecting text. When
    // bracketed paste mode is active (default in modern bash/zsh), pasted
    // newlines are inserted literally rather than executing the command.
    if (typeof term.paste === 'function') {
      term.paste(seq);
      return true;
    }

    // Fallback: use internal core service to trigger a data event directly.
    if (term._core && term._core.coreService && typeof term._core.coreService.triggerDataEvent === 'function') {
      term._core.coreService.triggerDataEvent(seq, true);
      return true;
    }

    // Older xterm.js: write directly to the pty handler.
    if (typeof term.handler === 'function') {
      term.handler(seq);
      return true;
    }

    console.warn(PREFIX, 'no method available to send data to terminal');
    return false;
  }

  function findTerm() {
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

    if (typeof term.attachCustomKeyEventHandler !== 'function') {
      console.warn(PREFIX, 'attachCustomKeyEventHandler not available');
      return false;
    }

    // Preserve any existing custom key handler (e.g., one set by ttyd itself)
    // so we don't clobber its behavior for other keys.
    const prevHandler = term._customKeyEventHandler || null;

    term.attachCustomKeyEventHandler(function (e) {
      // Chain to the previous handler first. If it returns false, it wants
      // to suppress the key — respect that and don't process further.
      if (prevHandler) {
        const result = prevHandler(e);
        if (result === false) {
          return false;
        }
      }

      if (e.type !== 'keydown') {
        return true;
      }

      if (e.key !== 'Enter' || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
        return true;
      }

      const seq = getSequence();
      const ok = sendData(term, seq);
      log('shift+enter ->', JSON.stringify(seq), 'sent:', ok);

      // Return false so xterm.js does NOT send its default \r for Enter.
      return false;
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
