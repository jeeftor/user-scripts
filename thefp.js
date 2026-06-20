// ==UserScript==
// @name         Free Press Audio Downloader
// @namespace    http://tampermonkey.net/
// @version 0.0.5
// @description  Adds open and copy URL buttons for audio elements on thefp.com and substack.com
// @author       Grok
// @match        https://www.thefp.com/*
// @match        https://*.substack.com/*
// @downloadURL  https://raw.githubusercontent.com/jeeftor/userScripts/master/thefp.js
// @updateURL    https://raw.githubusercontent.com/jeeftor/userScripts/master/thefp.js
// ==/UserScript==

(function() {
    'use strict';

    // Check if running in Tampermonkey environment
    if (typeof GM_info === 'undefined') {
        console.error('This script is intended to run in Tampermonkey. Exiting.');
        return;
    }

    console.log('Script loaded, starting execution...');

    // Function to create buttons for each audio element
    function addAudioControls(audio) {
        if (audio.dataset.processed) return;
        audio.dataset.processed = 'true';

        let src = audio.src;
        if (src.startsWith('/')) {
            src = window.location.origin + src;
        }
        console.log('Processing audio with src:', src);

        const container = document.createElement('div');
        container.style.margin = '10px 0';
        container.style.display = 'flex';
        container.style.gap = '10px';

        // Create Open Audio box
        const openBtn = document.createElement('div');
        openBtn.textContent = 'Open Audio';
        openBtn.style.backgroundColor = '#000000';
        openBtn.style.color = '#ffffff';
        openBtn.style.padding = '8px 15px';
        openBtn.style.border = '2px solid #ffffff';
        openBtn.style.cursor = 'pointer';
        openBtn.style.fontFamily = 'inherit';
        openBtn.style.fontSize = '14px';
        openBtn.style.borderRadius = '4px';
        openBtn.style.display = 'inline-block';
        openBtn.style.minWidth = '100px';
        openBtn.style.textAlign = 'center';
        openBtn.style.userSelect = 'none';
        openBtn.style.pointerEvents = 'auto';
        openBtn.style.position = 'relative';
        openBtn.style.zIndex = '1000';
        openBtn.style.lineHeight = 'normal';
        openBtn.style.boxSizing = 'border-box';
        
        openBtn.addEventListener('mouseover', () => {
            openBtn.style.backgroundColor = '#333333';
        });
        openBtn.addEventListener('mouseout', () => {
            openBtn.style.backgroundColor = '#000000';
        });
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Prevent multiple clicks during processing
            if (openBtn.textContent !== 'Open Audio') {
                return;
            }
            
            console.log('Open attempt for:', src);
            
            // Show loading state
            openBtn.textContent = 'Loading...';
            openBtn.style.cursor = 'wait';
            
            // Small delay to show loading state, then proceed with download
            setTimeout(() => {
                const a = document.createElement('a');
                a.href = src;
                let filename = src.split('/').pop() || `audio_${Date.now()}.mp3`;
                a.download = filename;
                document.body.appendChild(a);
                
                try {
                    a.click();
                    console.log('Open initiated for:', src);
                    
                    // Show success state briefly
                    openBtn.textContent = 'Downloaded!';
                    setTimeout(() => {
                        openBtn.textContent = 'Open Audio';
                        openBtn.style.cursor = 'pointer';
                    }, 1500);
                    
                } catch (e) {
                    console.error('Open failed:', e);
                    openBtn.textContent = 'Failed!';
                    setTimeout(() => {
                        openBtn.textContent = 'Open Audio';
                        openBtn.style.cursor = 'pointer';
                    }, 2000);
                    alert('Open failed. Check console for details or ensure the URL is accessible.');
                }
                document.body.removeChild(a);
            }, 100);
        });

        // Create Copy Audio box
        const copyBtn = document.createElement('div');
        copyBtn.textContent = 'Copy Audio';
        copyBtn.style.backgroundColor = '#000000';
        copyBtn.style.color = '#ffffff';
        copyBtn.style.padding = '8px 15px';
        copyBtn.style.border = '2px solid #ffffff';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.fontFamily = 'inherit';
        copyBtn.style.fontSize = '14px';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.display = 'inline-block';
        copyBtn.style.minWidth = '100px';
        copyBtn.style.textAlign = 'center';
        copyBtn.style.userSelect = 'none';
        copyBtn.style.pointerEvents = 'auto';
        copyBtn.style.position = 'relative';
        copyBtn.style.zIndex = '1000';
        copyBtn.style.lineHeight = 'normal';
        copyBtn.style.boxSizing = 'border-box';
        
        copyBtn.addEventListener('mouseover', () => {
            copyBtn.style.backgroundColor = '#333333';
        });
        copyBtn.addEventListener('mouseout', () => {
            copyBtn.style.backgroundColor = '#000000';
        });
        copyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Copy attempt for:', src);
            navigator.clipboard.writeText(src).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy Audio';
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
                copyBtn.textContent = 'Copy Failed';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy Audio';
                }, 2000);
            });
        });

        container.appendChild(openBtn);
        container.appendChild(copyBtn);
        audio.parentNode.insertBefore(container, audio.nextSibling);
    }

    function processAudioElements() {
        const audios = document.querySelectorAll('audio[src]');
        console.log('Found', audios.length, 'audio elements');
        audios.forEach(addAudioControls);
    }

    const observer = new MutationObserver((mutations) => {
        console.log('DOM mutation detected');
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
