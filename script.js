// script.js - stable native-select version
(function () {
  // escape html helper
  function escapeHtml(text = '') {
    return String(text)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  // read a select-like value: handles native select element or fallback
  function readSelectValueById(id) {
    const el = document.getElementById(id);
    if (!el) return '-';
    if (el.tagName === 'SELECT') {
      const v = el.value;
      return (v && v !== '') ? v : '-';
    }
    // fallback: check if custom container holds hidden input
    const hidden = el.querySelector ? el.querySelector('input[type="hidden"]') : null;
    if (hidden) return hidden.value && hidden.value !== '' ? hidden.value : '-';
    return '-';
  }

  // add row handler
  function onAddClick(e) {
    e.preventDefault();
    const nama = (document.getElementById('nama')?.value || '').trim();
    const produk = (document.getElementById('katalog')?.value || '').trim();
    const tanggal = (document.getElementById('tglBeli')?.value || '');
    const durasi = (document.getElementById('durasi')?.value || '');
    const modal = document.getElementById('modal')?.value || 0;
    const harga = document.getElementById('harga')?.value || 0;

    const device = readSelectValueById('device-select'); // native select id
    const buyer = readSelectValueById('statusBuyer');

    if (!nama || !produk) {
      alert('Nama dan Katalog wajib diisi.');
      return;
    }

    const tbody = document.getElementById('tableBody');
    const tr = document.createElement('tr');
    const profit = Number(harga) - Number(modal);

    tr.innerHTML = `
      <td>${tbody.children.length + 1}</td>
      <td>${escapeHtml(nama)}</td>
      <td>${escapeHtml(produk)}</td>
      <td>${tanggal || '-'}</td>
      <td>${durasi || '-'}</td>
      <td>Rp ${Number(modal).toLocaleString()}</td>
      <td>Rp ${Number(harga).toLocaleString()}</td>
      <td>Rp ${Number(profit).toLocaleString()}</td>
      <td>${escapeHtml(buyer)}</td>
      <td>${escapeHtml(device)}</td>
      <td><button class="btn small remove-row">Hapus</button></td>
    `;
    tbody.appendChild(tr);

    // attach remove handler
    tr.querySelector('.remove-row').addEventListener('click', () => {
      tr.remove();
      refreshRowNumbers();
    });

    // reset and refresh summary
    resetForm();
    refreshSummary();
  }

  // reset form robustly
  function resetForm() {
    ['nama','wa','katalog','akun','password','profile','tglBeli','durasi','modal','harga'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    // reset native selects
    const dev = document.getElementById('device-select');
    if (dev && dev.tagName === 'SELECT') dev.selectedIndex = 0;
    const sb = document.getElementById('statusBuyer');
    if (sb && sb.tagName === 'SELECT') sb.selectedIndex = 0;
  }

  // refresh row numbers & summary
  function refreshRowNumbers() {
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach((r, i) => {
      r.children[0].textContent = i + 1;
    });
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

  // export CSV
  function exportTableToCSV(e) {
    e.preventDefault();
    const rows = Array.from(document.querySelectorAll('#tableBody tr'));
    if (!rows.length) { alert('Tidak ada data untuk diexport.'); return; }
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

  // init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addBtn')?.addEventListener('click', onAddClick);
    document.getElementById('resetBtnForm')?.addEventListener('click', (e) => { e.preventDefault(); resetForm(); });
    document.getElementById('exportBtn')?.addEventListener('click', exportTableToCSV);

    // set year
    document.getElementById('year').textContent = new Date().getFullYear();
  });
})();
