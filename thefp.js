// ==UserScript==
// @name         Audio Downloader
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Adds download and copy URL buttons for audio elements on thefp.com and substack.com
// @author       Grok
// @match        https://www.thefp.com/*
// @match        https://*.substack.com/*
// @require      https://cdn.materialdesignicons.com/7.2.96/css/materialdesignicons.min.css
// @downloadURL  https://raw.githubusercontent.com/jeeftor/user-scripts/master/thefp.js
// @updateURL    https://raw.githubusercontent.com/jeeftor/user-scripts/master/thefp.js
// ==/UserScript==

(function() {
    'use strict';

    console.log('Script loaded, checking MDI...');

    // Function to create buttons for each audio element
    function addAudioControls(audio) {
        if (audio.dataset.processed) return;
        audio.dataset.processed = 'true';

        let src = audio.src;
        if (src.startsWith('/')) {
            src = window.location.origin + src;
        }

        const container = document.createElement('div');
        container.style.margin = '10px 0';
        container.style.display = 'flex';
        container.style.gap = '10px';

        // Create Download button with MDI icon or fallback
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '<i class="mdi mdi-download"></i> Download Audio';
        if (!document.querySelector('.mdi')) {
            downloadBtn.textContent = 'Download Audio'; // Fallback if MDI fails
            console.warn('MDI not detected, using text fallback');
        }
        downloadBtn.style.padding = '5px 10px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.background = 'none';
        downloadBtn.style.border = 'none';
        downloadBtn.style.fontFamily = 'inherit';
        downloadBtn.addEventListener('click', () => {
            console.log('Download attempt for:', src);
            const a = document.createElement('a');
            a.href = src;
            let filename = src.split('/').pop() || `audio_${Date.now()}.mp3`;
            a.download = filename;
            document.body.appendChild(a);
            try {
                a.click();
                console.log('Download initiated');
            } catch (e) {
                console.error('Download failed:', e);
                alert('Download failed. Check console for details.');
            }
            document.body.removeChild(a);
        });

        // Create Copy URL button with MDI icon or fallback
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="mdi mdi-content-copy"></i> Copy Audio URL';
        if (!document.querySelector('.mdi')) {
            copyBtn.textContent = 'Copy Audio URL'; // Fallback if MDI fails
        }
        copyBtn.style.padding = '5px 10px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.background = 'none';
        copyBtn.style.border = 'none';
        copyBtn.style.fontFamily = 'inherit';
        copyBtn.addEventListener('click', () => {
            console.log('Copy attempt for:', src);
            navigator.clipboard.writeText(src).then(() => {
                copyBtn.textContent = '<i class="mdi mdi-check"></i> URL Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="mdi mdi-content-copy"></i> Copy Audio URL';
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
                copyBtn.textContent = '<i class="mdi mdi-alert"></i> Copy Failed';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="mdi mdi-content-copy"></i> Copy Audio URL';
                }, 2000);
            });
        });

        container.appendChild(downloadBtn);
        container.appendChild(copyBtn);
        audio.parentNode.insertBefore(container, audio.nextSibling);
    }

    function processAudioElements() {
        const audios = document.querySelectorAll('audio[src]');
        audios.forEach(addAudioControls);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'AUDIO' && node.src) {
                            addAudioControls(node);
                        } else {
                            const audios = node.querySelectorAll('audio[src]');
                            audios.forEach(addAudioControls);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    processAudioElements();
    console.log('Script initialized, observing DOM...');
})();