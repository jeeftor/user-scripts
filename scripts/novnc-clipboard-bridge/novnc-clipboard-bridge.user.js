// ==UserScript==
// @name         noVNC Clipboard Bridge
// @version      0.1.0
// @description  Floating paste/copy buttons to bridge local and remote clipboard in noVNC sessions.
// @author       jeeftor
// @match        http://*/*
// @match        https://*/*
// @grant        GM_setClipboard
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/novnc-clipboard-bridge/novnc-clipboard-bridge.user.js
// @updateURL    https://raw.githubusercontent.com/jeeftor/userScripts/master/scripts/novnc-clipboard-bridge/novnc-clipboard-bridge.user.js
// ==/UserScript==

(function () {
  'use strict';

  const MARK = '__noVncClipboardBridgeInstalled';
  const PREFIX = '[noVNC clipboard bridge]';

  // --- GM storage helpers ---

  function getAllowedHosts() {
    return GM_getValue('allowedHosts', []);
  }

  function saveAllowedHosts(hosts) {
    GM_setValue('allowedHosts', Array.from(new Set(hosts)).sort());
  }

  function isDebugEnabled() {
    return GM_getValue('debug', false);
  }

  function isAutoCopyEnabled() {
    return GM_getValue('autoCopy', false);
  }

  function log(...args) {
    if (isDebugEnabled()) {
      console.log(PREFIX, ...args);
    }
  }

  // --- GM menu commands ---

  GM_registerMenuCommand('Allow this host', function () {
    saveAllowedHosts(getAllowedHosts().concat(location.hostname));
    console.log(PREFIX, 'allowed host', location.hostname);
  });

  GM_registerMenuCommand('Forget this host', function () {
    saveAllowedHosts(getAllowedHosts().filter(function (h) {
      return h !== location.hostname;
    }));
    console.log(PREFIX, 'forgot host', location.hostname);
  });

  GM_registerMenuCommand('Toggle auto-copy from VM', function () {
    const next = !isAutoCopyEnabled();
    GM_setValue('autoCopy', next);
    console.log(PREFIX, 'auto-copy', next ? 'enabled' : 'disabled');
  });

  GM_registerMenuCommand('Toggle debug', function () {
    const next = !isDebugEnabled();
    GM_setValue('debug', next);
    console.log(PREFIX, 'debug', next);
  });

  if (!getAllowedHosts().includes(location.hostname)) {
    log('host not allowlisted', location.hostname);
    return;
  }

  // --- Find the RFB object ---
  // Standard noVNC app (app/ui.js) exposes window.UI.rfb.
  // Some custom deployments expose rfb directly on window.

  function findRfb() {
    const ui = unsafeWindow.UI;
    if (ui && ui.rfb) {
      return ui.rfb;
    }
    if (unsafeWindow.rfb) {
      return unsafeWindow.rfb;
    }
    return null;
  }

  // --- Paste local clipboard text into VM ---
  // Sets VNC clipboard via RFB protocol then sends Ctrl+V to trigger a paste.
  // X11 keysyms: 0xFFE3 = Control_L, 0x0076 = v

  function pasteToVm(rfb, text) {
    rfb.clipboardPasteFrom(text);
    setTimeout(function () {
      rfb.sendKey(0xFFE3, 'ControlLeft', true);
      rfb.sendKey(0x0076, 'KeyV', true);
      rfb.sendKey(0x0076, 'KeyV', false);
      rfb.sendKey(0xFFE3, 'ControlLeft', false);
      log('pasted', text.length, 'chars');
    }, 100);
  }

  // --- Floating panel ---

  function flashButton(btn, originalLabel, flashLabel) {
    btn.textContent = flashLabel;
    btn.style.background = '#388e3c';
    setTimeout(function () {
      btn.textContent = originalLabel;
      btn.style.background = '#1976d2';
    }, 1200);
  }

  function makeButton(label, title, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.title = title;
    Object.assign(btn.style, {
      padding: '6px 10px',
      border: 'none',
      borderRadius: '4px',
      background: '#1976d2',
      color: '#fff',
      cursor: 'pointer',
      opacity: '0.85',
      whiteSpace: 'nowrap',
      font: '13px system-ui, sans-serif',
    });
    btn.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
    btn.addEventListener('mouseleave', function () { btn.style.opacity = '0.85'; });
    btn.addEventListener('click', onClick);
    return btn;
  }

  function buildPanel(rfb) {
    if (document.getElementById('__noVncBridgePanel')) {
      return;
    }

    const panel = document.createElement('div');
    panel.id = '__noVncBridgePanel';
    Object.assign(panel.style, {
      position: 'fixed',
      top: '60px',
      right: '12px',
      zIndex: '2147483647',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      userSelect: 'none',
    });

    const pasteLabel = 'Paste \u2192 VM';
    const pasteBtn = makeButton(pasteLabel, 'Read local clipboard and send to VM (sets clipboard + Ctrl+V)', function () {
      navigator.clipboard.readText().then(function (text) {
        if (!text) {
          flashButton(pasteBtn, pasteLabel, 'Empty');
          return;
        }
        pasteToVm(rfb, text);
        flashButton(pasteBtn, pasteLabel, 'Sent!');
      }).catch(function (err) {
        console.error(PREFIX, 'clipboard read failed', err);
        flashButton(pasteBtn, pasteLabel, 'Error');
      });
    });

    const copyLabel = '\u2190 Copy VM';
    const copyBtn = makeButton(copyLabel, 'Copy VM clipboard to local clipboard', function () {
      const textarea = document.getElementById('noVNC_clipboard_text');
      const text = textarea ? textarea.value : '';
      if (!text) {
        flashButton(copyBtn, copyLabel, 'Empty');
        return;
      }
      GM_setClipboard(text, 'text');
      flashButton(copyBtn, copyLabel, 'Copied!');
      log('copied from VM', text.length, 'chars');
    });

    panel.appendChild(pasteBtn);
    panel.appendChild(copyBtn);
    document.body.appendChild(panel);

    // Auto-copy: when the VM pushes clipboard data, copy it locally.
    if (typeof rfb.addEventListener === 'function') {
      rfb.addEventListener('clipboard', function (e) {
        if (!isAutoCopyEnabled()) {
          return;
        }
        const text = e.detail && e.detail.text;
        if (!text) {
          return;
        }
        GM_setClipboard(text, 'text');
        log('auto-copied from VM clipboard event', text.length, 'chars');
      });
    }

    console.log(PREFIX, 'installed on', location.hostname);
  }

  // --- Poll for the RFB object (noVNC may load asynchronously) ---

  let attempts = 0;

  const timer = setInterval(function () {
    attempts += 1;

    const rfb = findRfb();
    if (rfb) {
      if (!rfb[MARK]) {
        rfb[MARK] = true;
        buildPanel(rfb);
      }
      clearInterval(timer);
      return;
    }

    if (attempts >= 60) {
      clearInterval(timer);
      console.warn(PREFIX, 'noVNC RFB object not found on', location.hostname);
    }
  }, 500);
})();
