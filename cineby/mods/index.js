(function() {
  'use strict';
  
  console.log('[Cineby] Module starting...');
  
  // CRITICAL: Wait for page to fully load first
  let initialized = false;
  
  function safeInit() {
    if (initialized) return;
    
    // Check if page actually loaded
    if (!document.body) {
      console.log('[Cineby] Waiting for body...');
      setTimeout(safeInit, 100);
      return;
    }
    
    initialized = true;
    console.log('[Cineby] Page loaded, initializing...');
    
    try {
      // Register keys
      registerKeys();
      
      // Wait a bit more before setting up navigation
      setTimeout(() => {
        setupNavigation();
        enhanceUI();
        console.log('[Cineby] Initialization complete!');
      }, 1500);
      
    } catch(e) {
      console.error('[Cineby] Init error:', e);
    }
  }
  
  function registerKeys() {
    try {
      if (typeof tizen !== 'undefined' && tizen.tvinputdevice) {
        const keys = ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop'];
        keys.forEach(key => {
          try {
            tizen.tvinputdevice.registerKey(key);
          } catch(e) {
            // Ignore errors
          }
        });
      }
    } catch(e) {
      console.log('[Cineby] No Tizen API');
    }
  }
  
  function setupNavigation() {
    console.log('[Cineby] Setting up navigation...');
    
    let currentIndex = 0;
    let focusableElements = [];
    
    function updateElements() {
      // Find clickable elements
      focusableElements = Array.from(document.querySelectorAll(
        'a, button, [role="button"], .clickable'
      )).filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      console.log('[Cineby] Found', focusableElements.length, 'elements');
    }
    
    function setFocus(index) {
      if (index < 0 || index >= focusableElements.length) return;
      
      // Remove old focus
      focusableElements.forEach(el => el.classList.remove('tv-focused'));
      
      // Add new focus
      const el = focusableElements[index];
      if (el) {
        el.classList.add('tv-focused');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        currentIndex = index;
      }
    }
    
    // Keyboard handler
    document.addEventListener('keydown', (e) => {
      updateElements();
      if (focusableElements.length === 0) return;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocus(Math.min(currentIndex + 1, focusableElements.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocus(Math.max(currentIndex - 1, 0));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocus(Math.max(currentIndex - 5, 0));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocus(Math.min(currentIndex + 5, focusableElements.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusableElements[currentIndex]) {
            focusableElements[currentIndex].click();
          }
          break;
      }
    });
    
    // Initialize
    setTimeout(() => {
      updateElements();
      if (focusableElements.length > 0) {
        setFocus(0);
      }
    }, 500);
  }
  
  function enhanceUI() {
    const style = document.createElement('style');
    style.textContent = `
      .tv-focused {
        outline: 4px solid #e50914 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 20px rgba(229, 9, 20, 0.6) !important;
        transform: scale(1.05) !important;
        transition: all 0.2s ease !important;
        z-index: 1000 !important;
        position: relative !important;
      }
      * { scroll-behavior: smooth !important; }
      body { cursor: none !important; }
    `;
    document.head.appendChild(style);
  }
  
  // Start initialization with multiple fallbacks
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
  
  // Backup timer
  setTimeout(safeInit, 2000);
  
  console.log('[Cineby] Module loaded successfully');
})();