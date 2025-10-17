// CONFIG: isi APPS_SCRIPT_URL jika mau sinkron ke Google Sheets
const APPS_SCRIPT_URL = ''; // contoh: 'https://script.google.com/macros/s/XXX/exec'

document.addEventListener('DOMContentLoaded', function () {
  const $ = id => document.getElementById(id);

  // form & DOM
  const form = $('entryForm');
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
  function showToast(msg, ms = 1700) {
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
    const filtro = filterProduk && filterProduk.value ? filterProduk.value : '';
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
  tableBod
