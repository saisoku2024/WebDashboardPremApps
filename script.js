// CONFIG: isi APPS_SCRIPT_URL jika mau sinkron ke Google Sheets
const APPS_SCRIPT_URL = ''; // contoh: 'https://script.google.com/macros/s/XXX/exec'

document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);

  // form & DOM
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

  if (!namaEl || !waEl || !tableBody) {
    console.warn('Beberapa elemen DOM tidak ditemukan — script dihentikan sementara.');
    return;
  }

  // utils
  const onlyDigits = s => String(s || '').replace(/[^0-9]/g, '');
  const formatRupiah = n => (Number(n) || 0).toLocaleString('id-ID');
  const isoToday = () => new Date().toISOString().slice(0, 10);

  if (tglEl && !tglEl.value) tglEl.value = isoToday();
  if (durasiEl && !durasiEl.value) durasiEl.value = '30 Hari';

  const STORAGE_KEY = 'saisoku_subs';
  const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; } };
  const save = arr => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  let currentRenderList = [];

  // show temporary toast
  function showToast(msg, ms = 1600) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    toastEl.style.opacity = 1;
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => { toastEl.style.opacity = 0; toastEl.style.display = 'none'; }, ms);
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function render() {
    const all = load();
    const filterSel = document.getElementById('filterProduk');
    const filtro = filterSel && filterSel.value ? filterSel.value : '';
    tableBody.innerHTML = '';
    currentRenderList = [];

    let sumModal = 0;
    let sumProfit = 0;
    const uniqueWA = new Set();

    all.forEach((row, originalIndex) => {
      if (filtro && row.katalog !== filtro) return;
      currentRenderList.push({ row, originalIndex });
    });

    if (!currentRenderList.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" class="empty-state">Belum ada transaksi. Isi form di kiri lalu klik <strong>Tambah Data</strong>.</td>`;
      tableBody.appendChild(tr);
    } else {
      currentRenderList.forEach((entry, idx) => {
        const row = entry.row;
        const modal = Number(row.modal) || 0;
        const harga = Number(row.harga) || 0;
        const profit = harga - modal;
        sumModal += modal;
        sumProfit += profit;
        if (row.wa) uniqueWA.add(row.wa);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(row.nama)}</td>
          <td>${escapeHtml(row.katalog)}</td>
          <td>${escapeHtml(row.tglBeli)}</td>
          <td>${escapeHtml(row.durasi)}</td>
          <td>Rp ${formatRupiah(modal)}</td>
          <td>Rp ${formatRupiah(harga)}</td>
          <td>Rp ${formatRupiah(profit)}</td>
          <td>${escapeHtml(row.statusBuyer)}</td>
          <td>
            <button class="copy-btn" data-idx="${idx}" data-action="copy">Copy</button>
            <button class="copy-btn" data-idx="${idx}" data-action="delete">Hapus</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }

    totalModalEl.textContent = 'Rp ' + formatRupiah(sumModal);
    totalProfitEl.textContent = 'Rp ' + formatRupiah(sumProfit);
    totalCustEl.textContent = uniqueWA.size;
  }

  // form submit handler (add entry)
  if (form) {
    form.addEventListener('submit', function(ev) {
      ev.preventDefault();
      const nama = namaEl.value.trim();
      const wa = waEl.value.trim();
      const katalogSel = document.getElementById('katalog');
      const deviceSel = document.getElementById('device');
      const statusSel = document.getElementById('statusBuyer');
      const katalog = katalogSel ? katalogSel.value : '';
      const device = deviceSel ? deviceSel.value : '';
      const akun = akunEl ? akunEl.value.trim() : '';
      const password = passEl ? passEl.value : '';
      const profile = profileEl ? profileEl.value.trim() : '';
      const tglBeli = (tglEl && tglEl.value) ? tglEl.value : isoToday();
      const durasi = durasiEl ? durasiEl.value.trim() : '';
      const statusBuyer = statusSel ? statusSel.value : '';
      const modal = modalEl ? onlyDigits(modalEl.value) : '';
      const harga = hargaEl ? onlyDigits(hargaEl.value) : '';

      if (!nama) { namaEl.focus(); showToast('Nama harus diisi'); return; }
      if (!wa) { waEl.focus(); showToast('No. WhatsApp harus diisi'); return; }
      if (!katalog) { showToast('Pilih produk'); return; }

      addBtn.disabled = true;
      addBtn.textContent = 'Menyimpan...';

      const entry = {
        nama, wa, katalog, akun, password, profile, device,
        tglBeli, durasi, statusBuyer, modal: modal, harga: harga, created: new Date().toISOString()
      };

      const all = load();
      all.push(entry);
      save(all);
      render();

      // optional sync (fire-and-forget)
      if (APPS_SCRIPT_URL) {
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerName: nama, buyerWA: wa, catalog: katalog, duration: durasi,
            account: akun, password: password, profilePin: profile, device: device,
            buyerType: statusBuyer, paymentNum: Number(harga)||0, modalNum: Number(modal)||0, dateBuy: tglBeli
          })
        }).catch(()=>{/* ignore */});
      }

      setTimeout(() => {
        addBtn.disabled = false;
        addBtn.textContent = '+ Tambah Data';
        showToast('Transaksi ditambahkan');
        // reset form values
        form.reset();
        if (tglEl) tglEl.value = isoToday();
        if (durasiEl) durasiEl.value = '30 Hari';
        // bring user's attention to table
        document.querySelector('.table-view').scrollIntoView({ behavior: 'smooth' });
      }, 300);
    });
  }

  // reset button
  if (resetBtn && form) {
    resetBtn.addEventListener('click', function(e){
      e.preventDefault();
      if (!confirm('Reset form? Semua input akan kosong.')) return;
      form.reset();
      if (tglEl) tglEl.value = isoToday();
      if (durasiEl) durasiEl.value = '30 Hari';
      showToast('Form direset');
    });
  }

  // table actions (delegate)
  tableBody.addEventListener('click', function (e) {
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

  // filter change
  const filterSel = document.getElementById('filterProduk');
  if (filterSel) filterSel.addEventListener('change', render);

  /* ========== Robust Custom Select (replace native selects) ========== */
  (function createCustomSelects(){
    // convert all selects on page except those already converted
    const selects = Array.from(document.querySelectorAll('select'));
    selects.forEach(sel => {
      // skip if already converted
      if (sel.dataset.customized === '1') return;

      // create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-select-wrapper';

      // make original invisible/off-screen but keep it in DOM (for forms)
      sel.classList.add('custom-select-hidden');
      sel.dataset.customized = '1';
      sel.setAttribute('aria-hidden','true');
      try { sel.tabIndex = -1; } catch(e){}

      // create visible control
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

      // create options container
      const opts = document.createElement('div');
      opts.className = 'custom-options';
      opts.style.display = 'none';

      // build options
      Array.from(sel.options).forEach((o,i) => {
        const item = document.createElement('div');
        item.className = 'custom-option';
        item.textContent = o.text;
        item.dataset.index = i;
        if (o.disabled) item.setAttribute('aria-disabled','true');
        if (sel.selectedIndex === i) item.classList.add('active');
        item.addEventListener('click', (ev) => {
          if (o.disabled) return;
          // update original select
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change',{bubbles:true}));
          // update UI label
          label.textContent = o.text;
          // mark active
          opts.querySelectorAll('.custom-option').forEach(x=>x.classList.remove('active'));
          item.classList.add('active');
          // close
          opts.style.display = 'none';
          control.classList.remove('open');
        });
        opts.appendChild(item);
      });

      // attach toggle
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

      // keyboard navigation
      control.tabIndex = 0;
      control.addEventListener('keydown', (e) => {
        const visible = opts.style.display === 'block';
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); control.click(); return; }
        if (e.key === 'Escape') { opts.style.display='none'; control.classList.remove('open'); return; }
        if (!visible && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          control.click();
          return;
        }
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

      // when original select value changes (programmatically), update label
      sel.addEventListener('change', () => {
        const i = sel.selectedIndex;
        if (i >= 0 && sel.options[i]) {
          label.textContent = sel.options[i].text;
          // update active classes
          opts.querySelectorAll('.custom-option').forEach(x=>x.classList.remove('active'));
          const item = opts.querySelector(`.custom-option[data-index="${i}"]`);
          if (item) item.classList.add('active');
        }
      });

      // assemble & insert
      wrapper.appendChild(sel);
      wrapper.appendChild(control);
      wrapper.appendChild(opts);
      sel.parentNode.insertBefore(wrapper, sel.nextSibling);
    });
  })();

  // initial render
  render();
});
