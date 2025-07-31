// ==UserScript==
// @name         Audio Downloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds download and copy URL buttons for audio elements on thefp.com and substack.com
// @author       Grok
// @match        https://www.thefp.com/*
// @match        https://*.substack.com/*
// @require      https://cdn.materialdesignicons.com/7.2.96/css/materialdesignicons.min.css
// ==/UserScript==

(function() {
    'use strict';

    // Function to create buttons for each audio element
    function addAudioControls(audio) {
        // Skip if already processed
        if (audio.dataset.processed) return;
        audio.dataset.processed = 'true';

        // Get the audio source URL
        let src = audio.src;
        // Ensure absolute URL
        if (src.startsWith('/')) {
            src = window.location.origin + src;
        }

        // Create container for buttons
        const container = document.createElement('div');
        container.style.margin = '10px 0';
        container.style.display = 'flex';
        container.style.gap = '10px';

        // Create Download button with MDI icon
        const downloadBtn = document.createElement('button');
        downloadBtn.innerHTML = '<i class="mdi mdi-download"></i> Download Audio';
        downloadBtn.style.padding = '5px 10px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.background = 'none';
        downloadBtn.style.border = 'none';
        downloadBtn.style.fontFamily = 'inherit';
        downloadBtn.addEventListener('click', () => {
            // Create a temporary link for download
            const a = document.createElement('a');
            a.href = src;
            // Fallback filename if split fails
            let filename = src.split('/').pop() || `audio_${Date.now()}.mp3`;
            a.download = filename;
            document.body.appendChild(a);
            try {
                a.click();
                console.log('Download initiated for:', src);
            } catch (e) {
                console.error('Download failed:', e);
                alert('Download failed. Check console for details.');
            }
            document.body.removeChild(a);
        });

        // Create Copy URL button with MDI icon
        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<i class="mdi mdi-content-copy"></i> Copy Audio URL';
        copyBtn.style.padding = '5px 10px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.background = 'none';
        copyBtn.style.border = 'none';
        copyBtn.style.fontFamily = 'inherit';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(src).then(() => {
                copyBtn.textContent = '<i class="mdi mdi-check"></i> URL Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="mdi mdi-content-copy"></i> Copy Audio URL';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy URL:', err);
                copyBtn.textContent = '<i class="mdi mdi-alert"></i> Copy Failed';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="mdi mdi-content-copy"></i> Copy Audio URL';
                }, 2000);
            });
        });

        // Append buttons to container
        container.appendChild(downloadBtn);
        container.appendChild(copyBtn);

        // Insert container after audio element
        audio.parentNode.insertBefore(container, audio.nextSibling);
    }

    // Process existing audio elements
    function processAudioElements() {
        const audios = document.querySelectorAll('audio[src]');
        audios.forEach(addAudioControls);
    }

    // Observe for dynamically added audio elements
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

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial processing
    processAudioElements();

})();