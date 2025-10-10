// script.js - robust custom select + form handlers
(function () {
  // store registered selects
  const SELECT_IDS = ['device-select', 'buyer-select'];
  const selects = [];

  // helper: escape html
  function escapeHtml(text = '') {
    return String(text)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  // setup a single custom select; returns an object or null
  function setupCustomSelect(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) {
      console.warn('[setupCustomSelect] container not found:', containerId);
      return null;
    }

    const toggle = wrap.querySelector('.select-toggle');
    const list = wrap.querySelector('.select-options');
    let hidden = wrap.querySelector('input[type="hidden"]');
    const placeholder = wrap.dataset.placeholder || 'Pilih';

    // ensure hidden input exists so rest of code can rely on it
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      // give an id if not present (use containerId + '-value')
      hidden.id = (containerId + '-value').replace(/[^a-z0-9\-]/gi,'');
      hidden.name = hidden.id;
      wrap.appendChild(hidden);
      console.info(`[setupCustomSelect] created hidden input for ${containerId} -> #${hidden.id}`);
    }

    if (!toggle) {
      console.warn('[setupCustomSelect] toggle button not found in', containerId);
      return null;
    }
    if (!list) {
      console.warn('[setupCustomSelect] options list not found in', containerId);
      return null;
    }

    // init placeholder
    toggle.textContent = placeholder;
    toggle.classList.add('placeholder');
    toggle.setAttribute('aria-expanded', 'false');

    // ensure options are focusable & role set
    const options = Array.from(list.querySelectorAll('li[role="option"]'));
    options.forEach(li => {
      if (!li.hasAttribute('tabindex')) li.setAttribute('tabindex','0');
    });

    // click on toggle opens/closes this select and closes others
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      // close other selects
      selects.forEach(s => {
        if (s.wrap !== wrap) s.wrap.classList.remove('open');
      });
      wrap.classList.toggle('open');
      const isOpen = wrap.classList.contains('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // option click handler
    options.forEach(li => {
      li.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const value = li.dataset.value || li.textContent.trim();
        hidden.value = value;
        toggle.textContent = li.textContent.trim();
        toggle.classList.remove('placehold
