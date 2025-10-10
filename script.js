// script-debug.js - wrapped with error capture & init logs
(function () {
  try {
    console.info('[script-debug] loading script.js');
    const SELECT_IDS = ['device-select', 'buyer-select'];
    const selects = [];

    function escapeHtml(t=''){ return String(t).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

    function setupCustomSelect(containerId) {
      const wrap = document.getElementById(containerId);
      if (!wrap) { console.warn('[setupCustomSelect] not found', containerId); return null; }
      const toggle = wrap.querySelector('.select-toggle');
      const list = wrap.querySelector('.select-options');
      let hidden = wrap.querySelector('input[type="hidden"]');
      const placeholder = wrap.dataset.placeholder || 'Pilih';

      if (!hidden) {
        hidden = document.createElement('input'); hidden.type='hidden';
        hidden.id = (containerId + '-value').replace(/[^a-z0-9\-]/gi,'');
        hidden.name = hidden.id; wrap.appendChild(hidden);
        console.info(`[setupCustomSelect] created hidden input for ${containerId} -> #${hidden.id}`);
      }
      if (!toggle || !list) { console.warn('[setupCustomSelect] missing subelements in', containerId); return null; }

      toggle.textContent = placeholder; toggle.classList.add('placeholder'); toggle.setAttribute('aria-expanded','false');
      const options = Array.from(list.querySelectorAll('li[role="option"]'));
      options.forEach(li => { if(!li.hasAttribute('tabindex')) li.setAttribute('tabindex','0'); });

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        selects.forEach(s=>{ if(s.wrap !== wrap) s.wrap.classList.remove('open'); });
        wrap.classList.toggle('open');
        toggle.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false');
      });

      options.forEach(li=>{
        li.addEventListener('click', (ev)=> {
          ev.stopPropagation();
          const value = li.dataset.value || li.textContent.trim();
          hidden.value = value;
          toggle.textContent = li.textContent.trim();
          toggle.classList.remove('placeholder');
          wrap.classList.remove('open');
          toggle.setAttribute('aria-expanded','false');
          console.log(`[select] ${containerId} =>`, value);
        });
        li.addEventListener('keydown', ev => { if(ev.key==='Enter' || ev.key===' ') { ev.preventDefault(); li.click(); }});
      });

      return { id:containerId, wrap, toggle, list, hidden, options };
    }

    function attachGlobalCloseHandler() {
      document.addEventListener('click', (e)=> {
        selects.forEach(s=>{
          if(!s.wrap.contains(e.target)) {
            s.wrap.classList.remove('open'); s.toggle.setAttribute('aria-expanded','false');
            if(!s.hidden.value){ s.toggle.textContent = s.wrap.dataset.placeholder || 'Pilih'; s.toggle.classList.add('placeholder'); }
          }
        });
      }, {capture:true});
      document.addEventListener('keydown', ev => { if(ev.key==='Escape') selects.forEach(s=>{ s.wrap.classList.remove('open'); s.toggle.setAttribute('aria-expanded','false'); }); });
    }

    document.addEventListener('DOMContentLoaded', () => {
      try {
        SELECT_IDS.forEach(id => { const s = setupCustomSelect(id); if(s) selects.push(s); });
        attachGlobalCloseHandler();
        console.info('[script-debug] custom selects initialized:', selects.map(s=>s.id));
      } catch(innerErr) { console.error('[script-debug] init inner error', innerErr); }
      // minimal rest of form code (kept intentionally short; copy your original add/reset/export code here)
      // ... (you can paste original add/reset/export functions here)
    });

  } catch (err) {
    console.error('[script-debug] top-level error', err);
  }
})();
