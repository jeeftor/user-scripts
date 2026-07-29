// ==UserScript==
// @name         ttyd Shift+Enter Newline
// @version      0.1.0
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

  function findTerm() {
    const textarea = unsafeWindow.document.querySelector('.xterm-helper-textarea');

    return unsafeWindow.term ||
      (textarea && textarea.__xtermTerminal) ||
      null;
  }

  function findTextarea() {
    return unsafeWindow.document.querySelector('.xterm-helper-textarea');
  }

  function install(term, textarea) {
    if (!term || !textarea) {
      return false;
    }

    if (textarea[MARK]) {
      return true;
    }

    // Intercept Shift+Enter on the xterm helper textarea. xterm.js listens
    // for keydown on this element; capturing phase lets us run first.
    textarea.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const seq = getSequence();

      // term.paste() is the public xterm.js API for injecting text. When
      // bracketed paste mode is active (default in modern bash/zsh), pasted
      // newlines are inserted literally rather than executing the command.
      // For ESC+CR we also use paste() so the sequence reaches the pty.
      if (typeof term.paste === 'function') {
        term.paste(seq);
      } else if (term._core && term._core.coreService) {
        term._core.coreService.triggerDataEvent(seq, true);
      } else {
        // Last-resort fallback: dispatch a synthetic input event.
        console.warn(PREFIX, 'no paste method available on terminal');
      }

      log('shift+enter ->', JSON.stringify(seq));
    }, true);

    textarea[MARK] = true;
    console.log(PREFIX, 'installed for', location.hostname);
    return true;
  }

  let attempts = 0;

  const timer = setInterval(function () {
    attempts += 1;

    if (install(findTerm(), findTextarea())) {
      clearInterval(timer);
      return;
    }

    if (attempts >= 60) {
      clearInterval(timer);
      console.warn(PREFIX, 'terminal not found on', location.hostname);
    }
  }, 500);
})();
