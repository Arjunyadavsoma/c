(function() {
  'use strict';
  
  const DEBUG = true;
  const INIT_DELAY = 2000;
  
  let initialized = false;
  let currentIndex = 0;
  let focusableElements = [];
  
  function log(...args) {
    if (DEBUG) {
      console.log('[Cineby]', ...args);
      
      try {
        if (document.body) {
          const logDiv = document.createElement('div');
          logDiv.style.cssText = `
            position: fixed;
            bottom: ${Math.random() * 50}px;
            left: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 14px;
            z-index: 999999;
            border: 2px solid #0f0;
            max-width: 80%;
          `;
          logDiv.textContent = new Date().toLocaleTimeString() + ' - ' + args.join(' ');
          document.body.appendChild(logDiv);
          
          setTimeout(() => {
            try { logDiv.remove(); } catch(e) {}
          }, 4000);
        }
      } catch(e) {}
    }
  }
  
  log('CINEBY MODULE STARTING');
  log('Document ready state:', document.readyState);
  log('Current URL:', window.location.href);
  
  function initialize() {
    if (initialized) {
      log('Already initialized');
      return;
    }
    
    if (!document.body) {
      log('Body not ready, waiting...');
      setTimeout(initialize, 500);
      return;
    }
    
    if (!window.location.hostname.includes('cineby')) {
      log('Not on Cineby domain, waiting...');
      setTimeout(initialize, 500);
      return;
    }
    
    initialized = true;
    log('Initializing...');
    
    try {
      registerTVKeys();
      
      setTimeout(() => {
        log('Setting up navigation...');
        setupNavigation();
        enhanceUI();
        autoClickSplash();
        log('Initialization complete!');
      }, INIT_DELAY);
      
    } catch(error) {
      log('ERROR:', error.message);
      console.error(error);
    }
  }
  
  function registerTVKeys() {
    log('Registering TV keys...');
    
    try {
      if (typeof tizen === 'undefined' || !tizen.tvinputdevice) {
        log('Tizen API not available');
        return;
      }
      
      const keys = ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop'];
      let registered = 0;
      
      keys.forEach(key => {
        try {
          tizen.tvinputdevice.registerKey(key);
          registered++;
        } catch(e) {}
      });
      
      log(`Registered ${registered} TV keys`);
      
    } catch(error) {
      log('Error registering keys:', error.message);
    }
  }
  
  function setupNavigation() {
    log('Setting up navigation...');
    
    updateFocusableElements();
    document.addEventListener('keydown', handleKeyPress);
    
    setTimeout(() => {
      updateFocusableElements();
      if (focusableElements.length > 0) {
        log(`Found ${focusableElements.length} elements`);
        setFocus(0);
      }
    }, 1000);
    
    const observer = new MutationObserver(() => {
      updateFocusableElements();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  function updateFocusableElements() {
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      '[role="button"]',
      '.movie-item',
      '.movie-card',
      '.clickable',
      '[onclick]'
    ];
    
    const allElements = document.querySelectorAll(selectors.join(', '));
    
    focusableElements = Array.from(allElements).filter(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      return (
        rect.width > 10 &&
        rect.height > 10 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    });
  }
  
  function handleKeyPress(event) {
    if (event.target.matches('input, textarea')) {
      return;
    }
    
    updateFocusableElements();
    
    if (focusableElements.length === 0) {
      return;
    }
    
    let handled = false;
    
    switch(event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocus(Math.min(currentIndex + 1, focusableElements.length - 1));
        handled = true;
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocus(Math.max(currentIndex - 1, 0));
        handled = true;
        break;
        
      case 'ArrowLeft':
        event.preventDefault();
        setFocus(Math.max(currentIndex - 5, 0));
        handled = true;
        break;
        
      case 'ArrowRight':
        event.preventDefault();
        setFocus(Math.min(currentIndex + 5, focusableElements.length - 1));
        handled = true;
        break;
        
      case 'Enter':
        event.preventDefault();
        activateCurrent();
        handled = true;
        break;
        
      case 'Backspace':
        if (window.history.length > 1) {
          window.history.back();
          handled = true;
        }
        break;
    }
    
    if (handled) {
      event.stopPropagation();
      log(`Key: ${event.key}`);
    }
  }
  
  function setFocus(index) {
    if (index < 0 || index >= focusableElements.length) {
      return;
    }
    
    document.querySelectorAll('.tv-focused').forEach(el => {
      el.classList.remove('tv-focused');
    });
    
    const element = focusableElements[index];
    if (!element) return;
    
    element.classList.add('tv-focused');
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    currentIndex = index;
    log(`Focus: ${index}/${focusableElements.length}`);
  }
  
  function activateCurrent() {
    const element = focusableElements[currentIndex];
    if (!element) return;
    
    log('Activating:', element.tagName);
    element.click();
  }
  
  function enhanceUI() {
    log('Enhancing UI...');
    
    const style = document.createElement('style');
    style.id = 'cineby-tv-styles';
    style.textContent = `
      .tv-focused {
        outline: 5px solid #e50914 !important;
        outline-offset: 5px !important;
        box-shadow: 0 0 30px rgba(229, 9, 20, 0.8) !important;
        transform: scale(1.1) !important;
        transition: all 0.3s ease !important;
        z-index: 9999 !important;
        position: relative !important;
      }
      * {
        scroll-behavior: smooth !important;
      }
      body {
        cursor: none !important;
        font-size: 1.2em !important;
      }
      a, button, [role="button"] {
        min-height: 48px !important;
        padding: 10px 15px !important;
      }
    `;
    
    document.head.appendChild(style);
    log('UI enhanced');
  }
  
  function autoClickSplash() {
    log('Checking for splash screen...');
    
    setTimeout(() => {
      const keywords = ['enter', 'start', 'continue', 'begin'];
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      
      buttons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (keywords.some(k => text.includes(k))) {
          log('Auto-clicking:', btn.textContent);
          btn.click();
        }
      });
    }, 1000);
  }
  
  function startModule() {
    log('Starting module...');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
    
    setTimeout(() => {
      if (!initialized) {
        log('Backup init');
        initialize();
      }
    }, 3000);
  }
  
  startModule();
  log('Module script loaded');
  
})();