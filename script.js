// CONFIG: isi APPS_SCRIPT_URL jika mau sinkron ke Google Sheets
const APPS_SCRIPT_URL = ''; // contoh: 'https://script.google.com/macros/s/XXX/exec'

document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);

  const namaEl = $('nama');
  const waEl = $('wa');
  const katalogEl = $('katalog');
  const akunEl = $('akun');
  const passEl = $('password');
  const profileEl = $('profile');
  const deviceEl = $('device');
  const tglEl = $('tglBeli');
  const durasiEl = $('durasi');
  const statusEl = $('statusBuyer');
  const modalEl = $('modal');
  const hargaEl = $('harga');
  const addBtn = $('addBtn');
  const resetBtn = $('resetBtn');
  const filterProduk = $('filterProduk');
  const exportBtn = $('exportBtn');
  const tableBody = $('tableBody');
  const totalModalEl = $('totalModal');
  const totalProfitEl = $('totalProfit');
  const totalCustEl = $('totalCust');
  const toastEl = $('toast');

  if (!namaEl || !waEl || !katalogEl || !tableBody) {
    console.warn('Beberapa elemen DOM tidak ditemukan — script dihentikan sementara.');
    return;
  }

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
  function showToast(msg, ms = 1800) {
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
    const filtro = filterProduk && filterProduk.value ? filterProduk.value : '';
    tableBody.innerHTML = '';
    currentRenderList = [];

    let sumModal = 0;
    let sumProfit = 0;
    const uniqueWA = new Set();

    // prepare list
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

  // add entry
  function addEntry(ev) {
    ev.preventDefault();
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

    // simple validation
    if (!nama) { namaEl.focus(); showToast('Nama harus diisi'); return; }
    if (!wa) { waEl.focus(); showToast('No. WhatsApp harus diisi'); return; }
    if (!katalog) { katalogEl.focus(); showToast('Pilih produk'); return; }

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

    // optional sync
    if (APPS_SCRIPT_URL) {
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: nama, buyerWA: wa, catalog: katalog, duration: durasi,
          account: akun, password: password, profilePin: profile, device: device,
          buyerType: statusBuyer, paymentNum: Number(harga)||0, modalNum: Number(modal)||0, dateBuy: tglBeli
        })
      }).then(()=>{/* ignore */}).catch(()=>{/* ignore */});
    }

    // UI feedback & reset
    setTimeout(() => {
      addBtn.disabled = false;
      addBtn.textContent = '+ Tambah Data';
      showToast('Transaksi ditambahkan');
      // reset subset of form
      namaEl.value=''; waEl.value=''; katalogEl.value=''; akunEl.value=''; passEl.value=''; profileEl.value=''; deviceEl.value=''; durasiEl.value='30 Hari'; modalEl.value=''; hargaEl.value=''; if(tglEl) tglEl.value = isoToday();
      // scroll to table for visual confirmation
      document.querySelector('.table-view').scrollIntoView({ behavior: 'smooth' });
    }, 350);
  }

  // reset
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      const confirmed = confirm('Reset form? Semua input akan kosong.');
      if (!confirmed) return;
      document.getElementById('entryForm').reset();
      if (tglEl) tglEl.value = isoToday();
      if (durasiEl) durasiEl.value = '30 Hari';
    });
  }

  if (addBtn) addBtn.addEventListener('click', addEntry);

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

  // export
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

  // filter
  if (filterProduk) filterProduk.addEventListener('change', render);

  // initial render
  render();
});
