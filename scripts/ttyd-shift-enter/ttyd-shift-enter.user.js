// ==UserScript==
// @name         ttyd Shift+Enter Newline
// @version      0.4.1
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

  // Mode controls how Shift+Enter sends data to the terminal:
  //   'paste-newline' — term.paste('\n'), wraps in bracketed paste (default)
  //   'paste-esc-cr'  — term.paste('\x1b\r'), like Alt+Enter via paste
  //   'raw-newline'   — send '\n' directly to pty, no paste wrapping (like Ctrl+J)
  //   'raw-esc-cr'    — send '\x1b\r' directly to pty, no paste wrapping
  function getMode() {
    return GM_getValue('shiftEnterMode', 'paste-newline');
  }

  function setMode(mode) {
    GM_setValue('shiftEnterMode', mode);
    console.log(PREFIX, 'mode set to', mode);
  }

  GM_registerMenuCommand('Mode: paste \\n (bracketed paste)', function () {
    setMode('paste-newline');
  });

  GM_registerMenuCommand('Mode: paste ESC+CR (Alt+Enter style)', function () {
    setMode('paste-esc-cr');
  });

  GM_registerMenuCommand('Mode: raw \\n (like Ctrl+J, no paste wrap)', function () {
    setMode('raw-newline');
  });

  GM_registerMenuCommand('Mode: raw ESC+CR (no paste wrap)', function () {
    setMode('raw-esc-cr');
  });

  function sendRaw(term, seq) {
    // Send data directly to the pty without bracketed paste wrapping.
    if (term._core && term._core.coreService && typeof term._core.coreService.triggerDataEvent === 'function') {
      term._core.coreService.triggerDataEvent(seq, true);
      return true;
    }

    // Older xterm.js: write directly to the pty handler.
    if (typeof term.handler === 'function') {
      term.handler(seq);
      return true;
    }

    // Last resort: fall back to paste (will wrap in bracketed paste).
    if (typeof term.paste === 'function') {
      term.paste(seq);
      return true;
    }

    console.warn(PREFIX, 'no method available to send data to terminal');
    return false;
  }

  function sendPaste(term, seq) {
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

  function sendData(term, mode) {
    mode = mode || getMode();

    if (mode === 'paste-newline') {
      return sendPaste(term, '\n');
    }
    if (mode === 'paste-esc-cr') {
      return sendPaste(term, '\x1b\r');
    }
    if (mode === 'raw-newline') {
      return sendRaw(term, '\n');
    }
    if (mode === 'raw-esc-cr') {
      return sendRaw(term, '\x1b\r');
    }

    // Unknown mode: fall back to default.
    return sendPaste(term, '\n');
  }

  // Test commands send a labeled marker prefixed with '#' (a shell comment)
  // followed by the mode's sequence. If the newline is literal, the marker
  // text stays on the input line and the cursor drops to a continuation
  // line. If it executes, the comment runs as a harmless no-op. Either way
  // you can see the effect without pressing Shift+Enter.
  function testMode(term, mode) {
    const label = '# [' + mode + ']';
    sendPaste(term, label);
    sendData(term, mode);
    console.log(PREFIX, 'tested mode:', mode);
  }

  GM_registerMenuCommand('Test current mode', function () {
    const term = findTerm();
    if (!term) {
      console.warn(PREFIX, 'no terminal found for test');
      return;
    }
    testMode(term, getMode());
  });

  GM_registerMenuCommand('Test all modes', function () {
    const term = findTerm();
    if (!term) {
      console.warn(PREFIX, 'no terminal found for test');
      return;
    }
    const modes = ['paste-newline', 'paste-esc-cr', 'raw-newline', 'raw-esc-cr'];
    modes.forEach(function (mode, i) {
      // Small delay between each so they don't blend together.
      setTimeout(function () {
        testMode(term, mode);
      }, i * 500);
    });
  });

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

      // Log all events when debug is on, so we can see keydown/keyup/repeat.
      log('event:', e.type, 'key:', e.key, 'shift:', e.shiftKey,
        'repeat:', e.repeat, 'ctrl:', e.ctrlKey, 'alt:', e.altKey, 'meta:', e.metaKey);

      if (e.type !== 'keydown') {
        return true;
      }

      if (e.key !== 'Enter' || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
        return true;
      }

      const mode = getMode();
      const ok = sendData(term, mode);
      log('shift+enter mode:', mode, 'sent:', ok, 'repeat:', e.repeat);

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
