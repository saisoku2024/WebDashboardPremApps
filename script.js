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
        toggle.classList.remove('placeholder');
        wrap.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
        console.log(`[select] ${containerId} =>`, value);
      });

      // keyboard selection
      li.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          li.click();
        }
      });
    });

    // return the select object
    return { id: containerId, wrap, toggle, list, hidden, options };
  }

  // global outside click close (single handler)
  function attachGlobalCloseHandler() {
    document.addEventListener('click', (e) => {
      selects.forEach(s => {
        if (!s.wrap.contains(e.target)) {
          s.wrap.classList.remove('open');
          s.toggle.setAttribute('aria-expanded','false');
          // restore placeholder if empty
          if (!s.hidden.value) {
            s.toggle.textContent = (s.wrap.dataset.placeholder || 'Pilih');
            s.toggle.classList.add('placeholder');
          }
        }
      });
    }, { capture: true });
    // ESC key closes all
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        selects.forEach(s => {
          s.wrap.classList.remove('open');
          s.toggle.setAttribute('aria-expanded','false');
        });
      }
    });
  }

  // on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // initialize selects
    SELECT_IDS.forEach(id => {
      const s = setupCustomSelect(id);
      if (s) selects.push(s);
    });

    attachGlobalCloseHandler();
    console.info('[script.js] custom selects initialized:', selects.map(s=>s.id));

    // bind form actions
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const nama = document.getElementById('nama')?.value.trim() || '';
        const produk = document.getElementById('katalog')?.value.trim() || '';
        const tanggal = document.getElementById('tglBeli')?.value || '';
        const durasi = document.getElementById('durasi')?.value || '';
        const modal = document.getElementById('modal')?.value || 0;
        const harga = document.getElementById('harga')?.value || 0;

        // hidden inputs (ids may be auto-created)
        const deviceHidden = document.getElementById('device-value') || document.getElementById('device-select-value') || document.querySelector('#device-select input[type="hidden"]');
        const buyerHidden = document.getElementById('buyer-value') || document.getElementById('buyer-select-value') || document.querySelector('#buyer-select input[type="hidden"]');
        const device = (deviceHidden && deviceHidden.value) ? deviceHidden.value : '-';
        const buyer = (buyerHidden && buyerHidden.value) ? buyerHidden.value : '-';

        if (!nama || !produk) {
          showToast('Nama dan Katalog wajib diisi.', 3000);
          return;
        }

        // append row
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

        tr.querySelector('.remove-row').addEventListener('click', () => {
          tr.remove();
          refreshRowNumbers();
        });

        resetForm();
        refreshSummary();
        showToast('Data berhasil ditambahkan.', 2000);
      });
    } else {
      console.warn('[script.js] addBtn not found');
    }

    // reset
    const resetBtn = document.getElementById('resetBtnForm');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetForm();
      });
    }

    // export
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        exportTableToCSV();
      });
    }

    // set year
    const yEl = document.getElementById('year');
    if (yEl) yEl.textContent = new Date().getFullYear();

    // small helpers
    function resetForm() {
      const fields = ['nama','wa','katalog','akun','password','profile','tglBeli','durasi','modal','harga'];
      fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      // reset custom selects
      selects.forEach(s => {
        if (s && s.hidden) {
          s.hidden.value = '';
          s.toggle.textContent = s.wrap.dataset.placeholder || 'Pilih';
          s.toggle.classList.add('placeholder');
          s.wrap.classList.remove('open');
        }
      });
    }

    function refreshRowNumbers() {
      const rows = document.querySelectorAll('#tableBody tr');
      rows.forEach((r,i) => r.children[0].textContent = i+1);
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
      const elTotalModal = document.getElementById('totalModal');
      const elTotalProfit = document.getElementById('totalProfit');
      const elTotalCust = document.getElementById('totalCust');
      if (elTotalModal) elTotalModal.textContent = 'Rp ' + totalModal.toLocaleString();
      if (elTotalProfit) elTotalProfit.textContent = 'Rp ' + totalProfit.toLocaleString();
      if (elTotalCust) elTotalCust.textContent = rows.length;
    }

    function exportTableToCSV() {
      const rows = Array.from(document.querySelectorAll('#tableBody tr'));
      if (!rows.length) { showToast('Tidak ada data untuk diexport.', 2000); return; }
      const header = ['No','Nama','Produk','Tanggal','Durasi','Modal','Harga','Profit','Tipe Buyer','Device'];
      const csv = [header.join(',')];
      rows.forEach(r => {
        const cols = Array.from(r.children).slice(0,10).map(td => `"${td.textContent.replace(/"/g,'""')}"`);
        csv.push(cols.join(','));
      });
      const blob = new Blob([csv.join('\n')], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-penjualan-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    function showToast(msg, ms = 2000) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.style.opacity = 1;
      setTimeout(() => { t.style.opacity = 0; }, ms);
    }
  }); // DOMContentLoaded
})();
