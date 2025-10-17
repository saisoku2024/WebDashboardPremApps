// script.js (final) - timpa file lama
const APPS_SCRIPT_URL = ''; // optional sync URL to Google Apps Script

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // DOM elements
  const form = $('entryForm');
  const namaEl = $('nama');
  const waEl = $('wa');
  const akunEl = $('akun');
  const passEl = $('password');
  const profileEl = $('profile');
  const tglEl = $('tglBeli');
  const durasiEl = $('durasi');
  const modalEl = $('modal');
  const hargaEl = $('harga');
  const addBtn = $('addBtn');
  const resetBtn = $('resetBtn');
  const exportBtn = $('exportBtn');
  const tableBody = $('tableBody');
  const totalModalEl = $('totalModal');
  const totalProfitEl = $('totalProfit');
  const totalCustEl = $('totalCust');
  const toastEl = $('toast');
  const searchInput = $('searchInput');

  if (!tableBody || !form) {
    console.warn('Core elements not found. Script stopped.');
    return;
  }

  // utils
  const isoToday = () => new Date().toISOString().slice(0, 10);
  const numericOnly = s => String(s || '').replace(/[^0-9]/g, '');
  const onlyDigits = numericOnly;
  const formatRupiah = n => (Number(n) || 0).toLocaleString('id-ID');
  const STORAGE_KEY = 'saisoku_subs';

  // storage helpers
  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  };
  const save = arr => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  // toast
  function showToast(msg = '', ms = 1500) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.display = 'none';
    }, ms);
  }

  // escape
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  }

  // initial defaults
  if (tglEl && !tglEl.value) tglEl.value = isoToday();
  if (durasiEl && !durasiEl.value) durasiEl.value = '30 Hari';
  if (modalEl && !modalEl.value) modalEl.value = '';
  if (hargaEl && !hargaEl.value) hargaEl.value = '';

  // current view list (after filter/search)
  let currentRenderList = [];

  /* ===== RENDER TABLE ===== */
  function render() {
    const all = load();
    const filterSel = $('filterProduk');
    const filtro = filterSel && filterSel.value ? filterSel.value : '';
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();

    tableBody.innerHTML = '';
    currentRenderList = [];

    let sumModal = 0;
    let sumProfit = 0;
    const uniqueWA = new Set();

    all.forEach((row, originalIndex) => {
      if (!row) return;
      const katalogVal = row.katalog || row.produk || '';
      if (filtro && katalogVal !== filtro) return;

      // search by name / wa / katalog
      if (q) {
        const hay = ((row.nama||'') + ' ' + (row.wa||'') + ' ' + katalogVal).toLowerCase();
        if (hay.indexOf(q) === -1) return;
      }

      currentRenderList.push({ row, originalIndex });
    });

    if (!currentRenderList.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" class="empty-state">Belum ada transaksi. Isi form di kiri lalu klik <strong>Tambah Data</strong>.</td>`;
      tableBody.appendChild(tr);
      totalModalEl.textContent = 'Rp 0';
      totalProfitEl.textContent = 'Rp 0';
      totalCustEl.textContent = '0';
      return;
    }

    currentRenderList.forEach((entry, idx) => {
      const row = entry.row || {};
      const modal = Number(row.modal) || 0;
      const harga = Number(row.harga) || 0;
      const profit = harga - modal;
      sumModal += modal;
      sumProfit += profit;
      if (row.wa) uniqueWA.add(row.wa);

      const produk = row.katalog || row.produk || '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(row.nama || '-')}</td>
        <td>${escapeHtml(produk)}</td>
        <td>${escapeHtml(row.tglBeli || '-')}</td>
        <td>${escapeHtml(row.durasi || '-')}</td>
        <td>Rp ${formatRupiah(modal)}</td>
        <td>Rp ${formatRupiah(harga)}</td>
        <td>Rp ${formatRupiah(profit)}</td>
        <td>${escapeHtml(row.statusBuyer || '-')}</td>
        <td>
          <button class="copy-btn" data-idx="${idx}" data-action="copy">Copy</button>
          <button class="copy-btn" data-idx="${idx}" data-action="delete">Hapus</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    totalModalEl.textContent = 'Rp ' + formatRupiah(sumModal);
    totalProfitEl.textContent = 'Rp ' + formatRupiah(sumProfit);
    totalCustEl.textContent = uniqueWA.size;
  }

  /* ===== FORM SUBMIT (Add) ===== */
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const nama = namaEl.value.trim();
      const wa = waEl.value.trim();

      // robust katalog read
      let katalog = '';
      const selKatalog = $('katalog');
      if (selKatalog) katalog = selKatalog.value || '';
      else {
        const alt = document.querySelector('select[name="katalog"], select[name="produk"]');
        if (alt) katalog = alt.value || '';
      }

      const device = $('device') ? $('device').value : '';
      const akun = akunEl ? akunEl.value.trim() : '';
      const password = passEl ? passEl.value : '';
      const profile = profileEl ? profileEl.value.trim() : '';
      const tglBeli = (tglEl && tglEl.value) ? tglEl.value : isoToday();
      const dur = durasiEl ? durasiEl.value.trim() : '';
      const statusBuyer = $('statusBuyer') ? $('statusBuyer').value : '';

      const modalRaw = modalEl ? String(modalEl.value || '') : '';
      const hargaRaw = hargaEl ? String(hargaEl.value || '') : '';
      const modal = numericOnly(modalRaw);
      const harga = numericOnly(hargaRaw);

      if (!nama) { namaEl.focus(); showToast('Nama harus diisi'); return; }
      if (!wa) { waEl.focus(); showToast('No. WhatsApp harus diisi'); return; }
      if (!katalog) { showToast('Pilih produk'); return; }

      addBtn.disabled = true;
      addBtn.textContent = 'Menyimpan...';

      const entry = {
        nama, wa, katalog, akun, password, profile, device,
        tglBeli, durasi: dur, statusBuyer, modal, harga, created: new Date().toISOString()
      };

      const all = load();
      all.push(entry);
      save(all);
      render();

      // optional sync
      if (APPS_SCRIPT_URL) {
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerName: nama, buyerWA: wa, catalog: katalog, duration: dur,
            account: akun, password: password, profilePin: profile, device: device,
            buyerType: statusBuyer, paymentNum: Number(harga)||0, modalNum: Number(modal)||0, dateBuy: tglBeli
          })
        }).catch(()=>{/* ignore */});
      }

      setTimeout(() => {
        addBtn.disabled = false;
        addBtn.textContent = '+ Tambah Data';
        showToast('Transaksi ditambahkan');
        form.reset();
        if (tglEl) tglEl.value = isoToday();
        if (durasiEl) durasiEl.value = '30 Hari';
        if (modalEl) modalEl.value = '';
        if (hargaEl) hargaEl.value = '';
        document.querySelector('.table-view').scrollIntoView({ behavior: 'smooth' });
      }, 220);
    });
  }

  /* ===== RESET ===== */
  if (resetBtn && form) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!confirm('Reset form? Semua input akan kosong.')) return;
      form.reset();
      if (tglEl) tglEl.value = isoToday();
      if (durasiEl) durasiEl.value = '30 Hari';
      if (modalEl) modalEl.value = '';
      if (hargaEl) hargaEl.value = '';
      showToast('Form direset');
    });
  }

  /* ===== TABLE ACTIONS (delegate) ===== */
  tableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;
    if (Number.isNaN(idx)) return;
    const entry = currentRenderList[idx];
    if (!entry) return;
    const { row, originalIndex } = entry;

    if (action === 'copy') {
      const text = `Akun: ${row.akun || '-'}\nPassword: ${row.password || '-'}\nProfile/PIN: ${row.profile || '-'}\nDevice: ${row.device || '-'}`;
      navigator.clipboard?.writeText(text).then(() => {
        btn.textContent = '✓';
        setTimeout(() => btn.textContent = 'Copy', 900);
      }).catch(() => showToast('Gagal menyalin ke clipboard'));
    } else if (action === 'delete') {
      if (!confirm('Hapus transaksi ini?')) return;
      const all = load();
      all.splice(originalIndex, 1);
      save(all);
      render();
      showToast('Transaksi dihapus');
    }
  });

  /* ===== EXPORT (filtered) ===== */
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const rowsToExport = currentRenderList.length ? currentRenderList.map(e => e.row) : load();
      if (!rowsToExport.length) { showToast('Tidak ada data untuk diekspor'); return; }
      const header = ['Nama','WA','Produk','Durasi','Akun','Password','Profile','Device','Pembayaran','Modal','Tanggal','Created'];
      const rows = rowsToExport.map(r => [r.nama, r.wa, r.katalog, r.durasi, r.akun, r.password, r.profile, r.device, r.harga, r.modal, r.tglBeli, r.created]);
      const csv = [header, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'saisoku_subs.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('CSV diekspor');
    });
  }

  /* ===== SEARCH listener ===== */
  if (searchInput) {
    let tId = null;
    searchInput.addEventListener('input', function () {
      clearTimeout(tId);
      tId = setTimeout(render, 160);
    });
  }

  /* ===== CURRENCY INPUT FORMATTING ===== */
  function formatCurrencyForInput(v) {
    const n = Number(numericOnly(v)) || 0;
    return n === 0 ? '' : n.toLocaleString('id-ID');
  }
  [modalEl, hargaEl].forEach(el => {
    if (!el) return;
    el.addEventListener('focus', () => {
      el.value = numericOnly(el.value);
      setTimeout(() => {
        try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
      }, 0);
    });
    el.addEventListener('blur', () => {
      el.value = formatCurrencyForInput(el.value);
    });
  });

  /* ===== CUSTOM SELECT CREATION (SAFE INSERT) ===== */
  (function createCustomSelects(){
    try {
      const selects = Array.from(document.querySelectorAll('select'));
      selects.forEach(sel => {
        if (sel.dataset.customized === '1') return;

        // store original parent & sibling BEFORE changing DOM
        const originalParent = sel.parentNode;
        const originalNext = sel.nextSibling;

        // create wrapper and insert at original place first
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        originalParent.insertBefore(wrapper, originalNext);

        // move select into wrapper
        wrapper.appendChild(sel);

        // hide original select (off-screen & inert)
        sel.classList.add('custom-select-hidden');
        sel.dataset.customized = '1';
        sel.setAttribute('aria-hidden','true');
        try { sel.tabIndex = -1; } catch (e) {}

        // visible control
        const control = document.createElement('div');
        control.className = 'custom-select';
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : (sel.getAttribute('placeholder') || 'Pilih');
        const caret = document.createElement('div');
        caret.className = 'caret';
        caret.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23e6eef8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
        control.appendChild(label);
        control.appendChild(caret);

        // options container
        const opts = document.createElement('div');
        opts.className = 'custom-options';
        opts.style.display = 'none';

        Array.from(sel.options).forEach((o, i) => {
          const item = document.createElement('div');
          item.className = 'custom-option';
          item.textContent = o.text;
          item.dataset.index = i;
          if (o.disabled) item.setAttribute('aria-disabled','true');
          if (sel.selectedIndex === i) item.classList.add('active');
          item.addEventListener('click', () => {
            if (o.disabled) return;
            sel.selectedIndex = i;
            sel.dispatchEvent(new Event('change', { bubbles: true }));
            label.textContent = o.text;
            opts.querySelectorAll('.custom-option').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            opts.style.display = 'none';
            control.classList.remove('open');
          });
          opts.appendChild(item);
        });

        // toggle
        control.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = control.classList.toggle('open');
          opts.style.display = isOpen ? 'block' : 'none';
          if (isOpen) {
            const active = opts.querySelector('.custom-option.active');
            if (active) active.scrollIntoView({ block: 'nearest' });
          }
        });

        // close on outside click
        document.addEventListener('click', (e) => {
          if (!wrapper.contains(e.target)) {
            opts.style.display = 'none';
            control.classList.remove('open');
          }
        });

        // keyboard nav
        control.tabIndex = 0;
        control.addEventListener('keydown', (e) => {
          const visible = opts.style.display === 'block';
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); control.click(); return; }
          if (e.key === 'Escape') { opts.style.display = 'none'; control.classList.remove('open'); return; }
          if (!visible && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { control.click(); return; }
          if (visible && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            const items = Array.from(opts.querySelectorAll('.custom-option'));
            if (!items.length) return;
            const currentIndex = items.findIndex(it => it.classList.contains('active'));
            let nextIndex = currentIndex;
            if (e.key === 'ArrowDown') nextIndex = Math.min(items.length - 1, currentIndex + 1);
            if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
            if (currentIndex === -1) nextIndex = 0;
            items.forEach(it => it.classList.remove('active'));
            items[nextIndex].classList.add('active');
            items[nextIndex].scrollIntoView({ block: 'nearest' });
          }
          if (visible && e.key === 'Enter') {
            const active = opts.querySelector('.custom-option.active');
            if (active) active.click();
          }
        });

        // sync original select changes
        sel.addEventListener('change', () => {
          const i = sel.selectedIndex;
          if (i >= 0 && sel.options[i]) {
            label.textContent = sel.options[i].text;
            opts.querySelectorAll('.custom-option').forEach(x => x.classList.remove('active'));
            const item = opts.querySelector(`.custom-option[data-index="${i}"]`);
            if (item) item.classList.add('active');
          }
        });

        // append control & opts (wrapper already in DOM)
        wrapper.appendChild(control);
        wrapper.appendChild(opts);
      });
    } catch (e) {
      console.error('createCustomSelects error', e);
    }
  })();

  // initial render
  render();
});
