// ==UserScript==
// @name     NZBKing Named Downloader
// @version  1
// @match    https://nzbking.com/*
// @run-at   document-idle
// @noframes
// ==/UserScript==

(() => {
  const DEBUG = true;
  const log = DEBUG ? console.log.bind(console, '[NZBKing DL]') : () => {};

  function sanitizeFilename(name) {
    return name.replace(/[\\/?%*:|"<>]/g, '_').trim();
  }

  function cleanTitle(text) {
    return text.replace(/\s*\{\{.*?\}\}\s*$/, '').trim();
  }

  async function getClipboardText(attempts = 3, delay = 150) {
    for (let i = 0; i < attempts; i++) {
      try {
        if (navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText();
          log('clipboard read attempt', i + 1, '->', text ? 'success' : 'empty');
          if (text) return text;
        }
      } catch (e) {
        log('clipboard read attempt', i + 1, '-> error:', e.name);
      }
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delay));
    }
    return '';
  }

  function downloadBlob(href, filename) {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function getNzbId(link) {
    const m = link.href.match(/\/nzb:([^/]+)\//);
    return m ? m[1] : null;
  }

  function getSubjectFallback(nzbLink) {
    let parent = nzbLink.parentElement;
    while (parent && !parent.classList.contains('search-subject')) {
      parent = parent.parentElement;
    }
    if (parent) {
      for (const node of parent.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent.trim();
          if (t) {
            return t
              .replace(/^\[\d+\/\d+]\s*-\s*/, '')
              .replace(/^["']/, '')
              .replace(/["']$/, '');
          }
        } else if (node.nodeName === 'BR') {
          break;
        }
      }
    }
    return document.title.replace(/\s+-\s+NZBKing$/, '').trim();
  }

  function getTitleFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('title');
      const p = params.get('pw');
      if (t) {
        log('URL params - title:', t, 'pw:', p || '(none)');
        const title = decodeURIComponent(t);
        const pw = p ? decodeURIComponent(p) : '';
        return pw ? `${title} {{${pw}}}` : title;
      }
    } catch {
      // Ignore malformed URI values and fall back to clipboard or page title.
    }
    return '';
  }

  async function resolveFilename(nzbLink) {
    const urlTitle = getTitleFromUrl();
    if (urlTitle) {
      log('using URL param title:', urlTitle);
      return sanitizeFilename(urlTitle) + '.nzb';
    }

    const clip = await getClipboardText();
    if (clip) {
      const clean = cleanTitle(clip);
      if (clean) {
        log('using clipboard title:', clean);
        return sanitizeFilename(clean) + '.nzb';
      }
    }

    const subj = getSubjectFallback(nzbLink);
    if (subj) {
      log('using subject fallback:', subj);
      return sanitizeFilename(subj) + '.nzb';
    }
    return 'download.nzb';
  }

  const buttons = [];

  async function updateButtonLabel(btn, nzbLink) {
    const filename = await resolveFilename(nzbLink);
    btn.textContent = `DL: ${filename}`;
    btn.title = `Download as "${filename}"`;
    log('label set ->', filename);
  }

  function injectButton(nzbLink) {
    const nzbId = getNzbId(nzbLink);
    if (!nzbId) return;

    const btn = document.createElement('a');
    btn.className = 'button';
    btn.style.marginLeft = '4px';
    btn.href = 'javascript:void(0);';
    btn.textContent = 'DL: ...';

    btn.addEventListener('mouseenter', () => {
      updateButtonLabel(btn, nzbLink);
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const filename = await resolveFilename(nzbLink);
      log('click download ->', filename);

      if (typeof nzbd === 'function') {
        try {
          nzbd(nzbId);
        } catch (_) {}
      }

      try {
        const resp = await fetch(nzbLink.href);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        downloadBlob(url, filename);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('NZBKing DL error:', err);
        window.open(nzbLink.href, '_blank');
      }
    });

    nzbLink.after(btn);
    buttons.push({ btn, nzbLink });
    updateButtonLabel(btn, nzbLink);
  }

  async function refreshLabels() {
    for (const { btn, nzbLink } of buttons) {
      await updateButtonLabel(btn, nzbLink);
    }
  }

  const nzbLinks = document.querySelectorAll('a[href^="/nzb:"]');
  for (const link of nzbLinks) {
    injectButton(link);
  }

  refreshLabels();

  window.addEventListener('focus', () => {
    log('window focus triggered refresh');
    refreshLabels();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      log('visibilitychange visible triggered refresh');
      refreshLabels();
    }
  });
})();
