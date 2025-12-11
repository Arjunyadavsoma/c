// inject/index.js - evaluated on document start
(function() {
  const MODULE_ID = 'cineby_tizen_module';
  if (window[MODULE_ID]) return;
  window[MODULE_ID] = true;

  // Utility helpers
  const $ = (s, root = document) => root.querySelector(s);
  const $all = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Insert TV CSS
  const style = document.createElement('style');
  style.textContent = `
    .tizen-overlay { position: fixed; top: 0; left: 0; right: 0; height: 64px; z-index:999999; display:flex; align-items:center; gap:12px; padding:10px; background: rgba(0,0,0,0.55); }
    .tizen-btn { padding:10px 14px; border-radius:8px; background: rgba(255,255,255,0.04); color: #fff; font-size:18px; border: none; cursor: pointer; }
    .tizen-focus { outline: 4px solid #00aaff; }
    .tizen-toast { position:fixed; bottom:20px; left:50%; transform:translateX(-50%); padding:10px 16px; background:rgba(0,0,0,0.7); color:#fff; border-radius:8px; z-index:1000000; font-size:18px; }
  `;
  document.head.appendChild(style);

  // Create overlay UI
  const overlay = document.createElement('div');
  overlay.className = 'tizen-overlay';
  overlay.id = 'tizen-overlay';
  overlay.innerHTML = `
    <button class="tizen-btn" data-action="home">Home</button>
    <button class="tizen-btn" data-action="browse">Browse</button>
    <button class="tizen-btn" data-action="search">Search</button>
    <button class="tizen-btn" data-action="mylist">My List</button>
  `;
  // append early but after DOMElement creation
  document.documentElement.appendChild(overlay);

  // Focus management - 1D (overlay) and dynamic lists will use grid logic later
  let focusIndex = 0;
  function buttons() { return $all('.tizen-btn', overlay); }
  function setFocus(i) {
    const btns = buttons();
    if (!btns.length) return;
    const idx = Math.max(0, Math.min(i, btns.length - 1));
    btns.forEach((b, id) => b.classList.toggle('tizen-focus', id === idx));
    focusIndex = idx;
    // ensure focused element is visible (for TVs with overscan)
    const el = btns[idx];
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  setFocus(0);

  function showToast(text, ttl = 1200) {
    const t = document.createElement('div');
    t.className = 'tizen-toast';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => { try { t.remove(); } catch (e) {} }, ttl);
  }

  function execAction(action) {
    try {
      if (action === 'home') location.href = '/';
      else if (action === 'browse') location.href = '/browse/movie';
      else if (action === 'search') {
        const si = $('input[type="search"], .search-input');
        if (si) { si.focus(); showToast('Search'); }
        else location.href = '/search';
      }
      else if (action === 'mylist') location.href = '/account/list';
    } catch (e) { console.warn('execAction failed', e); }
  }

  // Handle key events
  function handleKey(raw) {
    // normalize input: raw may be KeyboardEvent, string, or object {key: '...'}
    const key = (typeof raw === 'string') ? raw :
                (raw && raw.key) ? raw.key :
                (raw && raw.detail && raw.detail.key) ? raw.detail.key :
                (raw && raw.code) ? raw.code : null;
    if (!key) return;

    if (key === 'ArrowRight') setFocus(focusIndex + 1);
    else if (key === 'ArrowLeft') setFocus(focusIndex - 1);
    else if (key === 'ArrowDown' || key === 'PageDown') {
      // move focus to next logical element - for overlay keep as next
      setFocus(focusIndex + 1);
    }
    else if (key === 'ArrowUp' || key === 'PageUp') {
      setFocus(focusIndex - 1);
    }
    else if (key === 'Enter' || key === 'OK') {
      const btn = buttons()[focusIndex];
      if (btn) {
        const act = btn.dataset.action;
        if (act) execAction(act);
        else btn.click();
      }
    }
    else if (key === 'Back' || key === 'Escape' || key === 'BrowserBack') {
      try { history.back(); } catch (e) { console.warn(e); }
    }
    else if (key === 'MediaPlayPause' || key === 'MediaPlay') {
      const v = document.querySelector('video');
      if (v) { v.paused ? v.play() : v.pause(); showToast(v.paused ? 'Paused' : 'Playing'); }
    }
    else if (key === 'MediaFastForward') {
      const v = document.querySelector('video'); if (v) { v.currentTime += 10; showToast('+10s'); }
    }
    else if (key === 'MediaRewind') {
      const v = document.querySelector('video'); if (v) { v.currentTime = Math.max(0, v.currentTime - 10); showToast('-10s'); }
    }
  }

  // Bind keyboard listener (for desktop debugging) and custom event (from service)
  window.addEventListener('keydown', (e) => {
    // prevent interfering with site inputs when using typing
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
    handleKey(e);
    e.stopPropagation && e.stopPropagation();
  }, { capture: true });

  // Custom event bridging from service: listen for 'tizen_remote_key'
  document.addEventListener('tizen_remote_key', (ev) => {
    // ev.detail expected: { key: 'ArrowLeft' } or similar
    handleKey(ev);
  });

  // SPA navigation detection: override pushState/replaceState and listen popstate
  (function(history) {
    const push = history.pushState;
    history.pushState = function() {
      const res = push.apply(history, arguments);
      window.dispatchEvent(new Event('cineby_routechange'));
      return res;
    };
    const replace = history.replaceState;
    history.replaceState = function() {
      const res = replace.apply(history, arguments);
      window.dispatchEvent(new Event('cineby_routechange'));
      return res;
    };
  })(window.history);

  window.addEventListener('popstate', () => window.dispatchEvent(new Event('cineby_routechange')));
  window.addEventListener('cineby_routechange', () => {
    // restore overlay if site re-rendered the body
    if (!document.getElementById('tizen-overlay')) {
      try { document.documentElement.appendChild(overlay); } catch (e) {}
    }
    // optional: re-map list/grid focus for the new route
  });

  // MutationObserver to catch dynamically-loaded content
  const mo = new MutationObserver((mutations) => {
    // If overlay removed by site, re-insert it
    if (!document.getElementById('tizen-overlay')) {
      try { document.documentElement.appendChild(overlay); setFocus(focusIndex); } catch (e) {}
    }
    // future: detect movie tile additions and attach focus mapping
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // expose API for debugging
  window.__cineby_tizen = { setFocus, execAction, showToast, buttons };

})();
