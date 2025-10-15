// CONFIG: jika pakai Apps Script / endpoint, masukkan URL di sini:
const APPS_SCRIPT_URL = ''; // contoh: 'https://script.google.com/macros/s/XXX/exec'

(function(){
  // DOM refs
  const namaEl = document.getElementById('nama');
  const waEl = document.getElementById('wa');
  const katalogEl = document.getElementById('katalog');
  const akunEl = document.getElementById('akun');
  const passEl = document.getElementById('password');
  const profileEl = document.getElementById('profile');
  const deviceEl = document.getElementById('device');
  const tglEl = document.getElementById('tglBeli');
  const durasiEl = document.getElementById('durasi');
  const statusEl = document.getElementById('statusBuyer');
  const modalEl = document.getElementById('modal');
  const hargaEl = document.getElementById('harga');
  const addBtn = document.getElementById('addBtn');
  const filterProduk = document.getElementById('filterProduk');
  const exportBtn = document.getElementById('exportBtn');
  const tableBody = document.getElementById('tableBody');
  const totalModalEl = document.getElementById('totalModal');
  const totalProfitEl = document.getElementById('totalProfit');
  const totalCustEl = document.getElementById('totalCust');

  // utils
  function onlyDigits(s){ return String(s||'').replace(/[^0-9]/g,''); }
  function formatRupiah(n){ const num = Number(n) || 0; return num.toLocaleString('id-ID'); }
  function isoToday(){ const d=new Date(); return d.toISOString().slice(0,10); }

  // init
  if(!tglEl.value) tglEl.value = isoToday();

  // storage helpers
  function load(){ try{ return JSON.parse(localStorage.getItem('saisoku_subs')||'[]'); }catch(e){ return []; } }
  function save(arr){ localStorage.setItem('saisoku_subs', JSON.stringify(arr)); }

  // render
  function render(){
    const all = load();
    const filtro = (filterProduk && filterProduk.value) ? filterProduk.value : '';
    tableBody.innerHTML = '';

    let sumModal = 0;
    let sumProfit = 0;
    const uniqueWA = new Set();

    for(let i=0;i<all.length;i++){
      const row = all[i];
      if(filtro && row.katalog !== filtro) continue;

      const modal = Number(row.modal)||0;
      const harga = Number(row.harga)||0;
      const profit = harga - modal;

      sumModal += modal;
      sumProfit += profit;
      if(row.wa) uniqueWA.add(row.wa);

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
        <td><button class="copy-btn" data-idx="${i}">Copy</button></td>
      `;
      tableBody.appendChild(tr);
    }

    totalModalEl.textContent = 'Rp ' + formatRupiah(sumModal);
    totalProfitEl.textContent = 'Rp ' + formatRupiah(sumProfit);
    totalCustEl.textContent = uniqueWA.size;
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  // add entry (validate basic)
  addBtn.addEventListener('click', function(e){
    e.preventDefault();
    const nama = namaEl.value.trim();
    const wa = waEl.value.trim();
    const katalog = katalogEl.value;
    const akun = akunEl.value.trim();
    const password = passEl.value;
    const profile = profileEl.value.trim();
    const device = deviceEl.value;
    const tglBeli = tglEl.value || isoToday();
    const durasi = durasiEl.value.trim();
    const statusBuyer = statusEl.value || '';
    const modal = onlyDigits(modalEl.value) || '';
    const harga = onlyDigits(hargaEl.value) || '';

    if(!nama){ alert('Nama pembeli harus diisi'); namaEl.focus(); return; }
    if(!wa){ alert('No. WhatsApp harus diisi'); waEl.focus(); return; }
    if(!katalog){ alert('Pilih produk'); katalogEl.focus(); return; }

    const entry = {
      nama, wa, katalog, akun, password, profile, device,
      tglBeli, durasi, statusBuyer, modal: modal, harga: harga, created: new Date().toISOString()
    };

    const all = load();
    all.push(entry);
    save(all);
    render();

    // kirim ke Apps Script jika URL dikonfigurasi
    if(APPS_SCRIPT_URL){
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: nama, buyerWA: wa, catalog: katalog, duration: durasi,
          account: akun, password: password, profilePin: profile, device: device,
          buyerType: statusBuyer, paymentNum: Number(harga)||0, modalNum: Number(modal)||0, dateBuy: tglBeli
        })
      })
      .then(r => r.json ? r.json() : r.text())
      .then(res => {
        // optional: visual feedback, ignore errors silently
        console.log('Sheets sync result', res);
      })
      .catch(err => console.warn('Sync to Sheets failed', err));
    }

    // reset form partially
    namaEl.value = ''; waEl.value=''; katalogEl.value=''; akunEl.value=''; passEl.value=''; profileEl.value=''; deviceEl.value=''; durasiEl.value='30'; modalEl.value=''; hargaEl.value=''; tglEl.value = isoToday();
  });

  // copy / delete actions on table
  tableBody.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const idx = Number(btn.dataset.idx);
    if(Number.isNaN(idx)) return;
    const all = load();
    const row = all[idx];
    if(!row) return;

    // copy useful info
    const text = `Akun: ${row.akun || '-'}\nPassword: ${row.password || '-'}\nProfile/PIN: ${row.profile || '-'}\nDevice: ${row.device || '-'}`;
    navigator.clipboard?.writeText(text).then(()=> {
      btn.textContent = '✓';
      setTimeout(()=> btn.textContent = 'Copy', 1000);
    }).catch(()=> alert('Gagal copy'));
  });

  // export CSV (Excel-friendly)
  exportBtn.addEventListener('click', function(){
    const all = load();
    if(!all.length){ alert('Tidak ada data'); return; }
    const header = ['Nama','WA','Produk','Durasi','Akun','Password','Profile','Device','Pembayaran','Modal','Tanggal','Created'];
    const rows = all.map(r => [
      r.nama, r.wa, r.katalog, r.durasi, r.akun, r.password, r.profile, r.device, r.harga, r.modal, r.tglBeli, r.created
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'saisoku_subs.csv'; a.click();
    URL.revokeObjectURL(url);
  });

  // filter change
  if(filterProduk) filterProduk.addEventListener('change', render);

  // initial render
  render();
})();
