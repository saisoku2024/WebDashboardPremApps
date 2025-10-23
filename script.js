// CONFIG: isi APPS_SCRIPT_URL jika mau sinkron ke Google Sheets
const APPS_SCRIPT_URL = '';

// initial catalog list (requested items)
let CATALOG_LIST = [
  "Canva Premium",
  "ChatGPT/Gemini AI",
  "Disney+",
  "HBO Max",
  "IQiyi",
  "Netflix Premium",
  "Prime Video",
  "Spotify Premium",
  "Vidio Platinum",
  "VIU Premium",
  "WeTV VIP",
  "Youtube Premium"
];

// helper: sort unique
function sortCatalog(list) {
  return Array.from(new Set(list)).sort((a,b)=> a.toLowerCase().localeCompare(b.toLowerCase()));
}
CATALOG_LIST = sortCatalog(CATALOG_LIST);

// safe number parser: strips non-numeric except minus and dot
function parseNumber(v){
  if (v === undefined || v === null) return 0;
  const s = String(v).replace(/[^\d.-]/g,'').trim();
  if (s === '') return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);

  // DOM refs
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
  const addCatalogBtn = $('addCatalogBtn');
  const newCatalogInput = $('newCatalogInput');
  const katalogSel = $('katalog');
  const deviceSel = $('device');
  const statusSel = $('statusBuyer');
  const filterSel = $('filterProduk');
  const searchInput = $('searchInput');
  const exportBtn = $('exportBtn');
  const tableBody = $('tableBody');
  const totalModalEl = $('totalModal');
  const totalProfitEl = $('totalProfit');
  const totalCustEl = $('totalCust');
  const toastEl = $('toast');

  const KPI = {
    sales: $('kpi-sales'),
    gmv: $('kpi-gmv'),
    profiles: $('kpi-profiles'),
    active: $('kpi-active')
  };

  const STORAGE_KEY = 'saisoku_subs_v3_fixed';
  const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; } };
  const save = arr => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  function showToast(msg, ms = 1400) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    toastEl.style.opacity = 1;
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => { toastEl.style.opacity = 0; toastEl.style.display = 'none'; }, ms);
  }

  function formatRupiah(n) { return (Number(n) || 0).toLocaleString('id-ID'); }
  function isoToday() { return new Date().toISOString().slice(0,10); }
  function formatDateDDMMYYYY(iso){
    if (!iso) return '-';
    // accept ISO date (YYYY-MM-DD) or JS Date string
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // populate selects (katalog & filter)
  function populateCatalogSelects() {
    const sorted = sortCatalog(CATALOG_LIST);
    katalogSel.innerHTML = `<option value="">Pilih Produk</option>`;
    sorted.forEach(item => {
      const o = document.createElement('option');
      o.value = item;
      o.textContent = item;
      katalogSel.appendChild(o);
    });
    filterSel.innerHTML = `<option value="">Semua Produk</option>`;
    sorted.forEach(item => {
      const o = document.createElement('option');
      o.value = item;
      o.textContent = item;
      filterSel.appendChild(o);
    });
  }

  // custom select (dark) - keep behavior but not mandatory to change now
  function createCustomSelects() {
    const selects = Array.from(document.querySelectorAll('select'));
    selects.forEach(sel => {
      if (sel.dataset.customized === '1') return;
      const parent = sel.parentNode;
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-select-wrapper';
      sel.classList.add('custom-select-hidden');
      sel.dataset.customized = '1';
      sel.setAttribute('aria-hidden','true');
      try { sel.tabIndex = -1; } catch(e){}

      const control = document.createElement('div');
      control.className = 'custom-select';
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : (sel.getAttribute('placeholder') || 'Pilih');
      const caret = document.createElement('div');
      caret.className = 'caret';
      caret.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%23e6eef8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
      control.appendChild(label);
      control.appendChild(caret);

      const opts = document.createElement('div');
      opts.className = 'custom-options';
      opts.style.display = 'none';

      Array.from(sel.options).forEach((o,i) => {
        const item = document.createElement('div');
        item.className = 'custom-option';
        item.textContent = o.text;
        item.dataset.index = i;
        if (o.disabled) item.setAttribute('aria-disabled','true');
        if (sel.selectedIndex === i) item.classList.add('active');
        item.addEventListener('click', () => {
          if (o.disabled) return;
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change',{bubbles:true}));
          label.textContent = o.text;
          opts.querySelectorAll('.custom-option').forEach(x=>x.classList.remove('active'));
          item.classList.add('active');
          opts.style.display = 'none';
          control.classList.remove('open');
        });
        opts.appendChild(item);
      });

      control.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = control.classList.toggle('open');
        opts.style.display = isOpen ? 'block' : 'none';
        if (isOpen) {
          const active = opts.querySelector('.custom-option.active');
          if (active) active.scrollIntoView({ block: 'nearest' });
        }
      });

      control.tabIndex = 0;
      control.addEventListener('keydown', (e) => {
        const visible = opts.style.display === 'block';
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); control.click(); return; }
        if (e.key === 'Escape') { opts.style.display='none'; control.classList.remove('open'); return; }
        if (!visible && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { control.click(); return; }
        if (visible && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          e.preventDefault();
          const items = Array.from(opts.querySelectorAll('.custom-option'));
          if (!items.length) return;
          const currentIndex = items.findIndex(it => it.classList.contains('active'));
          let nextIndex = currentIndex;
          if (e.key === 'ArrowDown') nextIndex = Math.min(items.length-1, currentIndex+1);
          if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex-1);
          if (currentIndex === -1) nextIndex = 0;
          items.forEach(it=>it.classList.remove('active'));
          items[nextIndex].classList.add('active');
          items[nextIndex].scrollIntoView({ block: 'nearest' });
        }
        if (visible && e.key === 'Enter') {
          const active = opts.querySelector('.custom-option.active');
          if (active) active.click();
        }
      });

      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
          opts.style.display = 'none';
          control.classList.remove('open');
        }
      });

      sel.addEventListener('change', () => {
        const i = sel.selectedIndex;
        if (i >= 0 && sel.options[i]) {
          label.textContent = sel.options[i].text;
          opts.querySelectorAll('.custom-option').forEach(x=>x.classList.remove('active'));
          const item = opts.querySelector(`.custom-option[data-index="${i}"]`);
          if (item) item.classList.add('active');
        }
      });

      parent.insertBefore(wrapper, sel);
      wrapper.appendChild(sel);
      wrapper.appendChild(control);
      wrapper.appendChild(opts);
    });
  }

  // render table + KPIs
  let currentRenderList = [];
  function render() {
    const all = load();
    const filtro = filterSel && filterSel.value ? filterSel.value : '';
    const q = (searchInput && searchInput.value || '').toLowerCase().trim();
    tableBody.innerHTML = '';
    currentRenderList = [];

    let sumModal = 0;
    let sumProfit = 0;
    const profilesSet = new Set();
    let totalActive = 0;

    const todayISO = isoToday();

    // prepare filtered view
    all.forEach((row, originalIndex) => {
      if (filtro && row.katalog !== filtro) return;
      if (q) {
        const hay = `${row.nama || ''} ${row.wa || ''}`.toLowerCase();
        if (!hay.includes(q)) return;
      }
      currentRenderList.push({ row, originalIndex });
    });

    if (!currentRenderList.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" class="empty-state">Belum ada transaksi. Isi form di kiri lalu klik <strong>Tambah Data</strong>.</td>`;
      tableBody.appendChild(tr);
    } else {
      currentRenderList.forEach((entry, idx) => {
        const row = entry.row;
        const modal = parseNumber(row.modal);
        const harga = parseNumber(row.harga);
        const profit = harga - modal; // CORRECT formula
        sumModal += modal;
        sumProfit += profit;
        if (row.profile) profilesSet.add(row.profile);
        totalActive += 1;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td title="${escapeHtml(row.nama)}">${escapeHtml(row.nama)}</td>
          <td title="${escapeHtml(row.katalog)}">${escapeHtml(row.katalog)}</td>
          <td title="${row.tglBeli}">${formatDateDDMMYYYY(row.tglBeli)}</td>
          <td>${escapeHtml(row.durasi)}</td>
          <td style="text-align:right">Rp ${formatRupiah(modal)}</td>
          <td style="text-align:right">Rp ${formatRupiah(harga)}</td>
          <td style="text-align:right">Rp ${formatRupiah(profit)}</td>
          <td style="text-align:center">${escapeHtml(row.statusBuyer)}</td>
          <td style="text-align:right">
            <button class="action-btn action-struk" data-idx="${idx}" data-action="struk">Struk</button>
            <button class="action-btn outline-danger" data-idx="${idx}" data-action="delete">Hapus</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    totalModalEl.textContent = 'Rp ' + formatRupiah(sumModal);
    totalProfitEl.textContent = 'Rp ' + formatRupiah(sumProfit);
    totalCustEl && (totalCustEl.textContent = currentRenderList.length);

    // KPI calculations
    const allData = load();
    const totalSalesToday = allData.filter(r => (r.tglBeli || '').slice(0,10) === todayISO).reduce((s,r)=> s + parseNumber(r.harga), 0);
    const gmv = allData.reduce((s,r)=> s + parseNumber(r.harga), 0);
    KPI.sales && (KPI.sales.textContent = formatRupiah(totalSalesToday));
    KPI.gmv && (KPI.gmv.textContent = formatRupiah(gmv));
    KPI.profiles && (KPI.profiles.textContent = profilesSet.size);
    KPI.active && (KPI.active.textContent = totalActive);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  // add catalog
  addCatalogBtn.addEventListener('click', () => {
    const v = (newCatalogInput.value || '').trim();
    if (!v) { newCatalogInput.focus(); return; }
    CATALOG_LIST.push(v);
    CATALOG_LIST = sortCatalog(CATALOG_LIST);
    populateCatalogSelects();
    setTimeout(()=> createCustomSelects(), 60);
    newCatalogInput.value = '';
    showToast('Produk ditambahkan');
  });

  // init
  populateCatalogSelects();
  createCustomSelects();
  if (tglEl && !tglEl.value) tglEl.value = isoToday();
  if (durasiEl && !durasiEl.value) durasiEl.value = '30 Hari';
  render();

  // submit
  if (form) {
    form.addEventListener('submit', function(ev) {
      ev.preventDefault();
      const nama = namaEl.value.trim();
      const wa = waEl.value.trim();
      const katalog = katalogSel ? katalogSel.value : '';
      const akun = akunEl ? akunEl.value.trim() : '';
      const password = passEl ? passEl.value : '';
      const profile = profileEl ? profileEl.value.trim() : '';
      const tglBeli = (tglEl && tglEl.value) ? tglEl.value : isoToday();
      const durasi = durasiEl ? durasiEl.value.trim() : '';
      const statusBuyer = statusSel ? statusSel.value : '';
      const modal = modalEl ? modalEl.value : '';
      const harga = hargaEl ? hargaEl.value : '';

      if (!nama) { namaEl.focus(); showToast('Nama harus diisi'); return; }
      if (!wa) { waEl.focus(); showToast('No. WhatsApp harus diisi'); return; }
      if (!katalog) { showToast('Pilih produk'); return; }

      addBtn.disabled = true;
      addBtn.textContent = 'Menyimpan...';

      const entry = {
        nama, wa, katalog, akun, password, profile, device: deviceSel ? deviceSel.value : '',
        tglBeli, durasi, statusBuyer, modal: modal, harga: harga, created: new Date().toISOString()
      };

      const all = load();
      all.push(entry);
      save(all);
      render();

      if (APPS_SCRIPT_URL) {
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerName: nama, buyerWA: wa, catalog: katalog, duration: durasi,
            account: akun, password: password, profilePin: profile, device: deviceSel ? deviceSel.value : '',
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
        if (katalogSel) { katalogSel.selectedIndex = 0; katalogSel.dispatchEvent(new Event('change',{bubbles:true})); }
        if (filterSel) { filterSel.selectedIndex = 0; filterSel.dispatchEvent(new Event('change',{bubbles:true})); }
        if (deviceSel) { deviceSel.selectedIndex = 0; deviceSel.dispatchEvent(new Event('change',{bubbles:true})); }
        if (statusSel) { statusSel.selectedIndex = 0; statusSel.dispatchEvent(new Event('change',{bubbles:true})); }
        document.querySelector('.table-view').scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });
  }

  // reset
  if (resetBtn && form) {
    resetBtn.addEventListener('click', function(e){
      e.preventDefault();
      if (!confirm('Reset form? Semua input akan kosong.')) return;
      form.reset();
      if (tglEl) tglEl.value = isoToday();
      if (durasiEl) durasiEl.value = '30 Hari';
      if (katalogSel) { katalogSel.selectedIndex = 0; katalogSel.dispatchEvent(new Event('change',{bubbles:true})); }
      if (deviceSel) { deviceSel.selectedIndex = 0; deviceSel.dispatchEvent(new Event('change',{bubbles:true})); }
      if (statusSel) { statusSel.selectedIndex = 0; statusSel.dispatchEvent(new Event('change',{bubbles:true})); }
      showToast('Form direset');
    });
  }

  // table actions
  tableBody.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;
    if (Number.isNaN(idx)) return;
    const entry = currentRenderList[idx];
    if (!entry) return;
    const { row, originalIndex } = entry;

    if (action === 'struk') {
      const startISO = row.tglBeli || isoToday();
      let endISO = '';
      const m = String(row.durasi || '').match(/(\d+)/);
      if (m && startISO) {
        const days = parseInt(m[1],10);
        const d = new Date(startISO);
        d.setDate(d.getDate() + days);
        endISO = d.toISOString().slice(0,10);
      }
      const lines = [];
      lines.push(`🧾 STRUK PENJUALAN SAISOKU.ID`);
      lines.push(`──────────`);
      lines.push(`📱 Buyer     : ${row.wa || '-'}`);
      lines.push(`👤 Tipe      : ${row.statusBuyer || '-'}`);
      lines.push(`🎬 Produk    : ${row.katalog || '-'}`);
      lines.push(`🔑 Akun      : ${row.akun || '-'}`);
      lines.push(`──────────`);
      if (endISO) {
        lines.push(`📅 Beli/Klaim: ${formatDateDDMMYYYY(startISO)} → ${formatDateDDMMYYYY(endISO)}`);
      } else {
        lines.push(`📅 Tanggal   : ${formatDateDDMMYYYY(startISO)}`);
      }
      lines.push(`⏱️ Durasi    : ${row.durasi || '-'}`);
      lines.push(`──────────`);
      lines.push(`🏷️ Harga     : Rp ${formatRupiah(parseNumber(row.harga || 0))}`);
      lines.push(`🧩 Status    : ${row.statusBuyer || '-'}`);
      lines.push(`──────────`);
      lines.push(`💎 *Net Profit: Rp ${formatRupiah(parseNumber(row.harga||0) - parseNumber(row.modal||0))}*`);
      lines.push(`──────────`);
      lines.push(`Terima kasih telah menggunakan layanan SAISOKU.ID 🙏`);
      lines.push(`© 2025 SAISOKU.ID • ${formatDateDDMMYYYY(new Date().toISOString().slice(0,10))}`);

      openInvoiceModal(lines.join('\n'));
    } else if (action === 'delete') {
      if (!confirm('Hapus transaksi ini?')) return;
      const all = load();
      all.splice(originalIndex, 1);
      save(all);
      render();
      showToast('Transaksi dihapus');
    }
  });

  // export CSV
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      const all = load();
      if (!all.length) { showToast('Tidak ada data untuk diekspor'); return; }
      const header = ['Nama','WA','Produk','Durasi','Akun','Password','Profile','Device','Pembayaran','Modal','Tanggal','Created'];
      const rows = all.map(r => [r.nama, r.wa, r.katalog, r.durasi, r.akun, r.password, r.profile, r.device, r.harga, r.modal, r.tglBeli, r.created]);
      const csv = [header, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'saisoku_subs.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('CSV diekspor');
    });
  }

  // search & filter
  if (searchInput) searchInput.addEventListener('input', render);
  if (filterSel) filterSel.addEventListener('change', render);

  // invoice modal handling
  const invoiceModal = $('invoiceModal');
  const invoiceBody = $('invoiceBody');
  const copyInvoiceBtn = $('copyInvoiceBtn');
  const printInvoiceBtn = $('printInvoiceBtn');
  const waInvoiceBtn = $('waInvoiceBtn');
  const closeInvoiceBtn = $('closeInvoiceBtn');

  function openInvoiceModal(text) {
    if (!invoiceModal) return;
    invoiceBody.innerHTML = `<pre class="invoice-pre">${escapeHtml(text)}</pre>`;
    invoiceModal.classList.add('open');
    invoiceModal.setAttribute('aria-hidden', 'false');
    invoiceBody.focus();
    invoiceModal._text = text;
  }

  function closeInvoiceModal() {
    if (!invoiceModal) return;
    invoiceModal.classList.remove('open');
    invoiceModal.setAttribute('aria-hidden', 'true');
    invoiceModal._text = '';
  }

  if (copyInvoiceBtn) copyInvoiceBtn.addEventListener('click', () => {
    const text = invoiceModal && invoiceModal._text ? invoiceModal._text : invoiceBody.textContent || '';
    navigator.clipboard?.writeText(text).then(()=> showToast('Struk disalin')).catch(()=> showToast('Gagal menyalin'));
  });
  if (printInvoiceBtn) printInvoiceBtn.addEventListener('click', () => {
    const w = window.open('', '_blank', 'width=600,height=800');
    const text = invoiceModal && invoiceModal._text ? invoiceModal._text : invoiceBody.textContent || '';
    w.document.write('<pre style="font-family:monospace;white-space:pre-wrap;">' + escapeHtml(text) + '</pre>');
    w.document.close();
    w.focus();
    w.print();
  });
  if (waInvoiceBtn) waInvoiceBtn.addEventListener('click', () => {
    const text = encodeURIComponent(invoiceModal && invoiceModal._text ? invoiceModal._text : invoiceBody.textContent || '');
    const url = `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  });
  if (closeInvoiceBtn) closeInvoiceBtn.addEventListener('click', closeInvoiceModal);
  document.querySelectorAll('.modal-backdrop').forEach(b => b.addEventListener('click', closeInvoiceModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeInvoiceModal(); });

  // ensure selects are created after populate
  populateCatalogSelects();
  setTimeout(()=> createCustomSelects(), 90);
});
