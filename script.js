// CONFIG: jika pakai Apps Script / endpoint, masukkan URL di sini:
const APPS_SCRIPT_URL = ''; // contoh: 'https://script.google.com/macros/s/XXX/exec'

document.addEventListener('DOMContentLoaded', function () {
  // DOM refs (guard: jika salah satu null => stop gracefully)
  const get = id => document.getElementById(id);
  const namaEl = get('nama');
  const waEl = get('wa');
  const katalogEl = get('katalog');
  const akunEl = get('akun');
  const passEl = get('password');
  const profileEl = get('profile');
  const deviceEl = get('device');
  const tglEl = get('tglBeli');
  const durasiEl = get('durasi');
  const statusEl = get('statusBuyer');
  const modalEl = get('modal');
  const hargaEl = get('harga');
  const addBtn = get('addBtn');
  const filterProduk = get('filterProduk');
  const exportBtn = get('exportBtn');
  const tableBody = get('tableBody');
  const totalModalEl = get('totalModal');
  const totalProfitEl = get('totalProfit');
  const totalCustEl = get('totalCust');

  if (!namaEl || !waEl || !katalogEl || !tableBody) {
    console.warn('Beberapa elemen DOM tidak ditemukan — script dihentikan sementara.');
    return;
  }

  // utils
  const onlyDigits = s => String(s || '').replace(/[^0-9]/g, '');
  const formatRupiah = n => (Number(n) || 0).toLocaleString('id-ID');
  const isoToday = () => new Date().toISOString().slice(0, 10);

  // init
  if (tglEl && !tglEl.value) tglEl.value = isoToday();

  // storage helpers
  const STORAGE_KEY = 'saisoku_subs';
  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } 
    catch (e) { return []; }
  };
  const save = arr => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

  // current rendered list (array of {row, originalIndex}) to map actions reliably
  let currentRenderList = [];

  // render
  function render() {
    const all = load();
    const filtro = filterProduk && filterProduk.value ? filterProduk.value : '';
    tableBody.innerHTML = '';
    currentRenderList = [];

    let sumModal = 0;
    let sumProfit = 0;
    const uniqueWA = new Set();

    // build list of rows that WILL be rendered
    all.forEach((row, originalIndex) => {
      if (filtro && row.katalog !== filtro) return;
      currentRenderList.push({ row, originalIndex });
    });

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

    if (totalModalEl) totalModalEl.textContent = 'Rp ' + formatRupiah(sumModal);
    if (totalProfitEl) totalProfitEl.textContent = 'Rp ' + formatRupiah(sumProfit);
    if (totalCustEl) totalCustEl.textContent = uniqueWA.size;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  // add entry (validate)
  if (addBtn) {
    addBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const nama = namaEl.value.trim();
      const wa = waEl.value.trim();
      const katalog = katalogEl.value;
      const akun = akunEl ? akunEl.value.trim() : '';
      const password = passEl ? passEl.value : '';
      const profile = profileEl ? profileEl.value.trim() : '';
      const device = deviceEl ? deviceEl.value : '';
      const tglBeli = (tglEl && tglEl.value) ? tglEl.value : isoToday();
      const durasi = durasiEl ? durasiEl.value.trim() : '';
      const statusBuyer = statusEl ? statusEl.value : '';
      const modal = modalEl ? onlyDigits(modalEl.value) : '';
      const harga = hargaEl ? onlyDigits(hargaEl.value) : '';

      if (!nama) { alert('Nama pembeli harus diisi'); namaEl.focus(); return; }
      if (!wa) { alert('No. WhatsApp harus diisi'); waEl.focus(); return; }
      if (!katalog) { alert('Pilih produk'); katalogEl.focus(); return; }

      const entry = {
        nama, wa, katalog, akun, password, profile, device,
        tglBeli, durasi, statusBuyer, modal: modal, harga: harga, created: new Date().toISOString()
      };

      const all = load();
      all.push(entry);
      save(all);
      render();

      // kirim ke Apps Script jika URL dikonfigurasi (optional)
      if (APPS_SCRIPT_URL) {
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerName: nama, buyerWA: wa, catalog: katalog, duration: durasi,
            account: akun, password: password, profilePin: profile, device: device,
            buyerType: statusBuyer, paymentNum: Number(harga) || 0, modalNum: Number(modal) || 0, dateBuy: tglBeli
          })
        }).then(res => {
          // optional feedback
          console.log('Sheets sync result', res);
        }).catch(err => console.warn('Sync to Sheets failed', err));
      }

      // reset form to defaults
      namaEl.value = ''; waEl.value = ''; katalogEl.value = ''; if (akunEl) akunEl.value = ''; if (passEl) passEl.value = '';
      if (profileEl) profileEl.value = ''; if (deviceEl) deviceEl.value = ''; if (durasiEl) durasiEl.value = '30';
      if (modalEl) modalEl.value = ''; if (hargaEl) hargaEl.value = ''; if (tglEl) tglEl.value = isoToday();
    });
  }

  // table actions (copy / delete)
  if (tableBody) {
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
        }).catch(() => alert('Gagal copy'));
      } else if (action === 'delete') {
        if (!confirm('Hapus transaksi ini?')) return;
        const all = load();
        // remove by originalIndex to keep correct mapping
        all.splice(originalIndex, 1);
        save(all);
        render();
      }
    });
  }

  // export CSV (exports ALL data)
  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      const all = load();
      if (!all.length) { alert('Tidak ada data'); return; }
      const header = ['Nama','WA','Produk','Durasi','Akun','Password','Profile','Device','Pembayaran','Modal','Tanggal','Created'];
      const rows = all.map(r => [
        r.nama, r.wa, r.katalog, r.durasi, r.akun, r.password, r.profile, r.device, r.harga, r.modal, r.tglBeli, r.created
      ]);
      const csv = [header, ...rows].map(r => r.map(c => `"${String(c || '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'saisoku_subs.csv'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  // filter change
  if (filterProduk) filterProduk.addEventListener('change', render);

  // initial render
  render();
});
