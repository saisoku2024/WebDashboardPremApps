// script.js - custom-select version (dark & consistent) + form/table handlers
(function () {
  // --- helpers ---
  function escapeHtml(text = '') {
    return String(text)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function showToast(msg, ms = 2000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.classList.remove('show'), ms);
  }

  // --- custom select setup (robust) ---
  const SELECT_IDS = ['device-select', 'buyer-select'];
  const selects = [];

  function setupCustomSelect(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) {
      console.warn('[setupCustomSelect] missing', containerId);
      return null;
    }
    const toggle = wrap.querySelector('.select-toggle');
    const list = wrap.querySelector('.select-options');
    let hidden = wrap.querySelector('input[type="hidden"]');
    const placeholder = wrap.dataset.placeholder || 'Pilih';

    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.id = (containerId + '-value').replace(/[^a-z0-9\-]/gi,'');
      hidden.name = hidden.id;
      wrap.appendChild(hidden);
    }
    if (!toggle || !list) {
      console.warn('[setupCustomSelect] parts missing for', containerId);
      return null;
    }

    toggle.textContent = placeholder;
    toggle.classList.add('placeholder');
    toggle.setAttribute('aria-expanded','false');

    // clean previous listeners by clone & replace (safe init)
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    const options = Array.from(list.querySelectorAll('li[role="option"], li'));
    options.forEach(opt => {
      if (!opt.hasAttribute('tabindex')) opt.setAttribute('tabindex','0');
    });

    newToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      // close others
      selects.forEach(s => { if (s.wrap !== wrap) s.wrap.classList.remove('open'); });
      wrap.classList.toggle('open');
      newToggle.setAttribute('aria-expanded', wrap.classList.contains('open') ? 'true' : 'false');
    });

    options.forEach(li => {
      const node = li.cloneNode(true);
      li.parentNode.replaceChild(node, li);
      node.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const v = node.dataset.value || node.textContent.trim();
        hidden.value = v;
        newToggle.querySelector('.label-text').textContent = node.textContent.trim();
        newToggle.classList.remove('placeholder');
        wrap.classList.remove('open');
        newToggle.setAttribute('aria-expanded', 'false');
        // tiny hook for derived values
        updateDerived();
      });
      node.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); node.click(); }
      });
    });

    return { id: containerId, wrap, toggle: newToggle, list, hidden, options };
  }

  function attachGlobalClose() {
    document.addEventListener('click', (e) => {
      selects.forEach(s => {
        if (!s.wrap.contains(e.target)) {
          s.wrap.classList.remove('open');
          s.toggle.setAttribute('aria-expanded','false');
          if (!s.hidden.value) {
            s.toggle.querySelector('.label-text').textContent = (s.wrap.dataset.placeholder || 'Pilih');
            s.toggle.classList.add('placeholder');
          }
        }
      });
    }, { capture: true });

    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        selects.forEach(s => s.wrap.classList.remove('open'));
      }
    });
  }

  // --- read value helper (custom or native) ---
  function readSelectValue(idOrContainer) {
    const el = document.getElementById(idOrContainer);
    if (!el) return '-';
    if (el.tagName === 'SELECT') {
      const v = el.value;
      return (v && v !== '') ? v : '-';
    }
    const hidden = el.querySelector('input[type="hidden"]');
    if (hidden) return (hidden.value && hidden.value !== '') ? hidden.value : '-';
    return '-';
  }

  // --- form handlers: add/reset/summary/export ---
  function onAddClick(e) {
    e.preventDefault();
    const nama = (document.getElementById('nama')?.value || '').trim();
    const produk = (document.getElementById('katalog')?.value || '').trim();
    const tanggal = (document.getElementById('tglBeli')?.value || '');
    const durasi = (document.getElementById('durasi')?.value || '');
    const modal = Number(document.getElementById('modal')?.value || 0);
    const harga = Number(document.getElementById('harga')?.value || 0);
    const device = readSelectValue('device-select');
    const buyer = readSelectValue('buyer-select');

    if (!nama || !produk) {
      showToast('Nama dan Katalog wajib diisi.', 2000);
      return;
    }

    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    const profit = Number(harga) - Number(modal);

    row.innerHTML = `
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

    tbody.appendChild(row);
    row.querySelector('.remove-row').addEventListener('click', () => { row.remove(); refreshRowNumbers(); });

    resetForm();
    refreshSummary();
    showToast('Data berhasil ditambahkan.', 1400);
  }

  function resetForm() {
    ['nama','wa','katalog','akun','password','profile','tglBeli','durasi','modal','harga'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    // reset selects (custom)
    ['device-select','buyer-select'].forEach(id => {
      const c = document.getElementById(id);
      if (!c) return;
      const hidden = c.querySelector('input[type="hidden"]');
      const toggle = c.querySelector('.select-toggle');
      if (hidden) hidden.value = '';
      if (toggle) {
        const label = toggle.querySelector('.label-text');
        if (label) label.textContent = (c.dataset.placeholder || 'Pilih');
        toggle.classList.add('placeholder');
      }
      c.classList.remove('open');
    });
    updateDerived();
  }

  function refreshRowNumbers() {
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach((r,i) => r.children[0].textContent = i + 1);
    refreshSummary();
  }

  function refreshSummary() {
    const rows = document.querySelectorAll('#tableBody tr');
    let totalModal = 0, totalProfit = 0;
    rows.forEach(r => {
      const modalText = r.children[5].textContent.replace(/[^0-9]/g,'') || '0';
      const hargaText = r.children[6].textContent.replace(/[^0-9]/g,'') || '0';
      const modalNum = Number(modalText);
      const hargaNum = Number(hargaText);
      totalModal += modalNum;
      totalProfit += (hargaNum - modalNum);
    });
    document.getElementById('totalModal').textContent = 'Rp ' + totalModal.toLocaleString();
    document.getElementById('totalProfit').textContent = 'Rp ' + totalProfit.toLocaleString();
    document.getElementById('totalCust').textContent = rows.length;
  }

  function exportTableToCSV(e) {
    e.preventDefault();
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    if (!rows.length) { showToast('Tidak ada data untuk diexport.', 1400); return; }
    const header = ['No','Nama','Produk','Tanggal','Durasi','Modal','Harga','Profit','Tipe Buyer','Device'];
    const csv = [header.join(',')];
    rows.forEach(r => {
      const cols = Array.from(r.children).slice(0,10).map(td => `"${td.textContent.replace(/"/g,'""')}"`);
      csv.push(cols.join(','));
    });
    const blob = new Blob([csv.join('\n')], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `data-penjualan-${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast('CSV terdownload', 1400);
  }

  // small derived values example (keperluan UI)
  function updateDerived() {
    // placeholder: can compute derived values here (we keep minimal)
  }

  // --- micro interactions: ripple effect for .ripple buttons ---
  function attachRipple() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn.ripple');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      circle.style.width = circle.style.height = size + 'px';
      circle.style.left = (e.clientX - rect.left - size / 2) + 'px';
      circle.style.top = (e.clientY - rect.top - size / 2) + 'px';
      circle.style.position = 'absolute';
      circle.style.borderRadius = '50%';
      circle.style.background = 'rgba(255,255,255,0.10)';
      circle.style.pointerEvents = 'none';
      circle.style.transform = 'scale(0)';
      circle.style.transition = 'transform .45s ease, opacity .45s ease';
      btn.style.position = 'relative'; btn.appendChild(circle);
      requestAnimationFrame(() => circle.style.transform = 'scale(1)');
      setTimeout(() => { circle.style.opacity = '0'; setTimeout(() => circle.remove(), 450); }, 450);
    });
  }

  // --- init on DOM ready ---
  document.addEventListener('DOMContentLoaded', () => {
    // init custom selects
    SELECT_IDS.forEach(id => {
      const s = setupCustomSelect(id);
      if (s) selects.push(s);
    });
    attachGlobalClose();
    attachRipple();

    // wire buttons
    document.getElementById('addBtn')?.addEventListener('click', onAddClick);
    document.getElementById('resetBtnForm')?.addEventListener('click', (e) => { e.preventDefault(); resetForm(); showToast('Form direset', 1200); });
    document.getElementById('exportBtn')?.addEventListener('click', exportTableToCSV);

    // year
    const yEl = document.getElementById('year'); if (yEl) yEl.textContent = new Date().getFullYear();
  });
})();
