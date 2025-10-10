// script.js - custom select + form handlers
(function () {
  // helper: setup custom select that opens on click and uses .open class
  function setupCustomSelect(containerId) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    const toggle = wrap.querySelector('.select-toggle');
    const list = wrap.querySelector('.select-options');
    const hidden = wrap.querySelector('input[type="hidden"]');
    const placeholder = wrap.dataset.placeholder || 'Pilih';

    // init placeholder look
    if (toggle) {
      toggle.textContent = placeholder;
      toggle.classList.add('placeholder');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.addEventListener('click', (e) => {
        const isOpen = wrap.classList.contains('open');
        if (isOpen) close();
        else open();
        e.stopPropagation();
      });
    }

    if (list) {
      const options = list.querySelectorAll('li[role="option"]');
      options.forEach(li => {
        li.addEventListener('click', (ev) => {
          const v = li.dataset.value || li.textContent.trim();
          if (hidden) hidden.value = v;
          if (toggle) {
            toggle.textContent = li.textContent.trim();
            toggle.classList.remove('placeholder');
          }
          close();
        });
      });
    }

    function open() {
      wrap.classList.add('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
    function close() {
      wrap.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      if (toggle && hidden && !hidden.value) {
        toggle.textContent = placeholder;
        toggle.classList.add('placeholder');
      }
    }

    // close on outside click
    document.addEventListener('click', (ev) => {
      if (!wrap.contains(ev.target)) close();
    });

    // keyboard support
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') close();
    });
  }

  // escape html
  function escapeHtml(text = '') {
    return String(text)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  // on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // If you used native selects earlier, no custom init needed. We'll proceed with basic handlers.

    const addBtn = document.getElementById('addBtn');
    addBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const nama = document.getElementById('nama').value.trim();
      const produk = document.getElementById('katalog').value.trim();
      const tanggal = document.getElementById('tglBeli').value;
      const durasi = document.getElementById('durasi').value;
      const modal = document.getElementById('modal').value || 0;
      const harga = document.getElementById('harga').value || 0;
      const deviceEl = document.getElementById('device-select');
      const device = deviceEl ? deviceEl.value || '-' : '-';
      const status = document.getElementById('statusBuyer').value || '-';

      if (!nama || !produk) {
        alert('Nama dan Katalog wajib diisi.');
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
        <td>${escapeHtml(status)}</td>
        <td>${escapeHtml(device)}</td>
        <td><button class="btn small">Hapus</button></td>
      `;
      tbody.appendChild(row);

      // attach remove handler
      row.querySelector('.btn.small').addEventListener('click', () => {
        row.remove();
        refreshRowNumbers();
      });

      // reset form
      document.getElementById('nama').value = '';
      document.getElementById('wa').value = '';
      document.getElementById('katalog').value = '';
      document.getElementById('akun').value = '';
      document.getElementById('password').value = '';
      document.getElementById('profile').value = '';
      if (deviceEl) deviceEl.selectedIndex = 0;
      document.getElementById('tglBeli').value = '';
      document.getElementById('durasi').value = '';
      document.getElementById('modal').value = '';
      document.getElementById('harga').value = '';

      refreshSummary();
    });

    document.getElementById('resetBtnForm').addEventListener('click', (e) => {
      e.preventDefault();
      // simple reset
      ['nama','wa','katalog','akun','password','profile','tglBeli','durasi','modal','harga'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const deviceEl = document.getElementById('device-select');
      if (deviceEl) deviceEl.selectedIndex = 0;
    });

    // export CSV (simple)
    document.getElementById('exportBtn').addEventListener('click', (e) => {
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
    });

    function refreshRowNumbers(){
      const rows = document.querySelectorAll('#tableBody tr');
      rows.forEach((r,i) => {
        r.children[0].textContent = i+1;
      });
      refreshSummary();
    }

    function refreshSummary(){
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

    // set year
    document.getElementById('year').textContent = new Date().getFullYear();
  });
})();
