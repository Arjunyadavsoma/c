(function() {
  'use strict';
  
  console.log('[Cineby] Module starting...');
  
  let initialized = false;
  let currentIndex = 0;
  let focusableElements = [];
  
  function log(...args) {
    console.log('[Cineby]', ...args);
    try {
      if (document.body) {
        const div = document.createElement('div');
        div.style.cssText = `
          position: fixed; bottom: 10px; left: 10px;
          background: rgba(0,0,0,0.9); color: #0f0;
          padding: 10px; font-family: monospace; font-size: 14px;
          z-index: 999999; border: 2px solid #0f0; max-width: 80%;
        `;
        div.textContent = new Date().toLocaleTimeString() + ' - ' + args.join(' ');
        document.body.appendChild(div);
        setTimeout(() => { try { div.remove(); } catch(e) {} }, 3000);
      }
    } catch(e) {}
  }
  
  function initialize() {
    if (initialized) return;
    
    if (!document.body) {
      setTimeout(initialize, 500);
      return;
    }
    
    initialized = true;
    log('Initializing...');
    
    try {
      registerKeys();
      setTimeout(() => {
        setupNavigation();
        enhanceUI();
        log('Ready!');
      }, 2000);
    } catch(e) {
      log('Error:', e.message);
    }
  }
  
  function registerKeys() {
    try {
      if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
        ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop'].forEach(key => {
          try { tizen.tvinputdevice.registerKey(key); } catch(e) {}
        });
        log('TV keys registered');
      }
    } catch(e) {}
  }
  
  function setupNavigation() {
    log('Setting up navigation...');
    
    updateElements();
    document.addEventListener('keydown', handleKey);
    
    setTimeout(() => {
      updateElements();
      if (focusableElements.length > 0) {
        setFocus(0);
      }
    }, 1000);
    
    new MutationObserver(updateElements).observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  function updateElements() {
    focusableElements = Array.from(document.querySelectorAll('a, button, [role="button"], .movie-card, .clickable')).filter(el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 10 && r.height > 10 && s.display !== 'none' && s.visibility !== 'hidden';
    });
  }
  
  function handleKey(e) {
    if (e.target.matches('input, textarea')) return;
    
    updateElements();
    if (focusableElements.length === 0) return;
    
    let handled = false;
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocus(Math.min(currentIndex + 1, focusableElements.length - 1));
        handled = true;
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocus(Math.max(currentIndex - 1, 0));
        handled = true;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocus(Math.max(currentIndex - 5, 0));
        handled = true;
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocus(Math.min(currentIndex + 5, focusableElements.length - 1));
        handled = true;
        break;
      case 'Enter':
        e.preventDefault();
        if (focusableElements[currentIndex]) {
          focusableElements[currentIndex].click();
        }
        handled = true;
        break;
      case 'Backspace':
        if (history.length > 1) {
          history.back();
          handled = true;
        }
        break;
    }
    
    if (handled) e.stopPropagation();
  }
  
  function setFocus(index) {
    if (index < 0 || index >= focusableElements.length) return;
    
    document.querySelectorAll('.tv-focused').forEach(el => el.classList.remove('tv-focused'));
    
    const el = focusableElements[index];
    if (el) {
      el.classList.add('tv-focused');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      currentIndex = index;
      log(`Focus: ${index}/${focusableElements.length}`);
    }
  }
  
  function enhanceUI() {
    const style = document.createElement('style');
    style.textContent = `
      .tv-focused {
        outline: 5px solid #e50914 !important;
        outline-offset: 5px !important;
        box-shadow: 0 0 30px rgba(229,9,20,0.8) !important;
        transform: scale(1.1) !important;
        transition: all 0.3s ease !important;
        z-index: 9999 !important;
        position: relative !important;
      }
      * { scroll-behavior: smooth !important; }
      body { cursor: none !important; font-size: 1.2em !important; }
      a, button { min-height: 48px !important; padding: 10px 15px !important; }
    `;
    document.head.appendChild(style);
    log('UI enhanced');
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  setTimeout(() => { if (!initialized) initialize(); }, 3000);
  
  log('Module loaded');
})();