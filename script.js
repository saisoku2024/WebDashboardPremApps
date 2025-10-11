// script.js - stable custom-select (clickable) + form handlers
(function () {
  // helpers
  function escapeHtml(text = '') {
    return String(text)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }
  function showToast(msg, ms = 2000) {
    const t = document.getElementById('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show'); clearTimeout(t._hide); t._hide = setTimeout(()=> t.classList.remove('show'), ms);
  }

  const SELECT_IDS = ['device-select', 'buyer-select'];
  const selects = [];

  function setupCustomSelect(id) {
    const wrap = document.getElementById(id);
    if (!wrap) { console.warn('[setupCustomSelect] missing', id); return null; }
    const toggle = wrap.querySelector('.select-toggle');
    const list = wrap.querySelector('.select-options');
    let hidden = wrap.querySelector('input[type="hidden"]');
    const placeholder = wrap.dataset.placeholder || 'Pilih';

    if (!hidden) {
      hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.id = id + '-value'; hidden.name = id + '-value'; wrap.appendChild(hidden);
    }
    if (!toggle || !list) { console.warn('[setupCustomSelect] parts missing for', id); return null; }

    // init UI
    const labelEl = toggle.querySelector('.label-text'); if (labelEl) labelEl.textContent = placeholder;
    toggle.classList.add('placeholder'); toggle.setAttribute('aria-expanded', 'false');

    // replace toggle to remove old listeners
    const newToggle = toggle.cloneNode(true); toggle.parentNode.replaceChild(newToggle, toggle);

    // options: clone each li to remove any previous listeners
    Array.from(list.querySelectorAll('li')).forEach(li => {
      if (!li.hasAttribute('tabindex')) li.setAttribute('tabindex','0');
      const node = li.cloneNode(true); li.parentNode.replaceChild(node, li);
      node.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const v = node.dataset.value || node.textContent.trim();
        hidden.value = v;
        const lbl = newToggle.querySelector('.label-text'); if (lbl) lbl.textContent = node.textContent.trim();
        newToggle.classList.remove('placeholder'); wrap.classList.remove('open'); newToggle.setAttribute('aria-expanded', 'false');
      });
      node.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); node.click(); } });
    });

    // toggle open/close
    newToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      selects.forEach(s => { if (s.wrap !== wrap) s.wrap.classList.remove('open'); });
      wrap.classList.toggle('open');
      newToggle.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false');
    });

    // stopPropagation on list interactions
    list.addEventListener('click', (e) => e.stopPropagation());
    list.addEventListener('keydown', (e) => { if (e.key === 'Escape') wrap.classList.remove('open'); });

    return { id, wrap, toggle: newToggle, list, hidden };
  }

  function attachGlobalClose() {
    document.addEventListener('click', (e) => {
      selects.forEach(s => {
        if (!s.wrap.contains(e.target)) {
          s.wrap.classList.remove('open'); s.toggle.setAttribute('aria-expanded', 'false');
          if (!s.hidden.value) {
            const lbl = s.toggle.querySelector('.label-text');
            if (lbl) lbl.textContent = (s.wrap.dataset.placeholder || 'Pilih');
            s.toggle.classList.add('placeholder');
          }
        }
      });
    }, { capture: true });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') selects.forEach(s => s.wrap.classList.remove('open')); });
  }

  function readSelectValue(id) {
    const el = document.getElementById(id);
    if (!el) return '-';
    const hidden = el.querySelector('input[type="hidden"]');
    if (hidden) return (hidden.value && hidden.value !== '') ? hidden.value : '-';
    return '-';
  }

  // form handlers
  function onAddClick(e) {
    e.preventDefault();
    const nama = (document.getElementById('nama')?.value || '').trim();
    const produk = (document.getElementById('katalog')?.value || '').trim();
    if (!nama || !produk) { showToast('Nama dan Katalog wajib diisi.', 2000); return; }
    const tanggal = (document.getElementById('tglBeli')?.value || '');
    const durasi = (document.getElementById('durasi')?.value || '');
    const modal = Number(document.getElementById('modal')?.value || 0);
    const harga = Number(document.getElementById('harga')?.value || 0);
    const device = readSelectValue('device-select');
    const buyer = readSelectValue('buyer-select');

    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    const profit = Number(harga) - Number(modal);

    tr.innerHTML = `
      <td>${tbody.children.length + 1}</td>
      <td>${escapeHtml(nama)}</td>
      <td>${escapeHtml(produk)}</td>
      <td>${tanggal || '-'}</td>
      <td>${escapeHtml(durasi || '-')}</td>
      <td>Rp ${Number(modal).toLocaleString()}</td>
      <td>Rp ${Number(harga).toLocaleString()}</td>
      <td>Rp ${Number(profit).toLocaleString()}</td>
      <td>${escapeHtml(buyer)}</td>
      <td>${escapeHtml(device)}</td>
      <td><button class="btn small remove-row">Hapus</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('.remove-row').addEventListener('click', ()=> { tr.remove(); refreshRowNumbers(); });
    resetForm(); refreshSummary(); showToast('Data berhasil ditambahkan.', 1400);
  }

  function resetForm() {
    ['nama','wa','katalog','akun','password','profile','tglBeli','durasi','modal','harga'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    ['device-select','buyer-select'].forEach(id => {
      const c = document.getElementById(id); if (!c) return;
      const hidden = c.querySelector('input[type="hidden"]'); if (hidden) hidden.value = '';
      const toggle = c.querySelector('.select-toggle'); if (toggle) {
        const label = toggle.querySelector('.label-text'); if (label) label.textContent = (c.dataset.placeholder || 'Pilih');
        toggle.classList.add('placeholder');
      }
      c.classList.remove('open');
    });
  }

  function refreshRowNumbers() {
    const rows = document.querySelectorAll('#tableBody tr'); rows.forEach((r,i)=> r.children[0].textContent = i+1); refreshSummary();
  }
  function refreshSummary() {
    const rows = document.querySelectorAll('#tableBody tr');
    let totalModal = 0, totalProfit = 0;
    rows.forEach(r=>{
      const m = r.children[5].textContent.replace(/[^0-9]/g,'') || '0';
      const h = r.children[6].textContent.replace(/[^0-9]/g,'') || '0';
      totalModal += Number(m); totalProfit += (Number(h) - Number(m));
    });
    document.getElementById('totalModal').textContent = 'Rp ' + totalModal.toLocaleString();
    document.getElementById('totalProfit').textContent = 'Rp ' + totalProfit.toLocaleString();
    document.getElementById('totalCust').textContent = rows.length;
  }

  function exportTableToCSV(e) {
    e.preventDefault();
    const rows = Array.from(document.querySelectorAll('#tableBody tr')); if (!rows.length) { showToast('Tidak ada data untuk diexport.', 1400); return; }
    const header = ['No','Nama','Produk','Tanggal','Durasi','Modal','Harga','Profit','Tipe Buyer','Device']; const csv = [header.join(',')];
    rows.forEach(r => { const cols = Array.from(r.children).slice(0,10).map(td => `"${td.textContent.replace(/"/g,'""')}"`); csv.push(cols.join(',')); });
    const blob = new Blob([csv.join('\n')], { type:'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`data-penjualan-${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast('CSV terdownload', 1400);
  }

  // ripple
  function attachRipple() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn.ripple'); if (!btn) return;
      const rect = btn.getBoundingClientRect(); const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height); circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - rect.left - size/2) + 'px'; circle.style.top = (e.clientY - rect.top - size/2) + 'px';
      circle.style.position='absolute'; circle.style.borderRadius='50%'; circle.style.background='rgba(255,255,255,0.10)'; circle.style.pointerEvents='none';
      circle.style.transform='scale(0)'; circle.style.transition='transform .45s ease, opacity .45s ease';
      btn.style.position='relative'; btn.appendChild(circle); requestAnimationFrame(()=> circle.style.transform='scale(1)');
      setTimeout(()=> { circle.style.opacity='0'; setTimeout(()=> circle.remove(),450); },450);
    });
  }

  // init
  document.addEventListener('DOMContentLoaded', () => {
    SELECT_IDS.forEach(id => { const s = setupCustomSelect(id); if (s) selects.push(s); });
    attachGlobalClose(); attachRipple();
    document.getElementById('addBtn')?.addEventListener('click', onAddClick);
    document.getElementById('resetBtnForm')?.addEventListener('click', (e)=>{ e.preventDefault(); resetForm(); showToast('Form direset', 1200); });
    document.getElementById('exportBtn')?.addEventListener('click', exportTableToCSV);
    const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  });

  function attachGlobalClose() {
    document.addEventListener('click', (e) => {
      selects.forEach(s => {
        if (!s.wrap.contains(e.target)) {
          s.wrap.classList.remove('open'); s.toggle.setAttribute('aria-expanded','false');
          if (!s.hidden.value) {
            const lbl = s.toggle.querySelector('.label-text');
            if (lbl) lbl.textContent = (s.wrap.dataset.placeholder || 'Pilih');
            s.toggle.classList.add('placeholder');
          }
        }
      });
    }, { capture: true });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') selects.forEach(s => s.wrap.classList.remove('open')); });
  }
})();
