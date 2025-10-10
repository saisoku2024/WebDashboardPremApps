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
    toggle.textContent = placeholder;
    toggle.classList.add('placeholder');
    toggle.setAttribute('aria-expanded', 'false');

    // toggle dropdown
    toggle.addEventListener('click', (e) => {
      const isOpen = wrap.classList.contains('open');
      if (isOpen) close();
      else open();
      e.stopPropagation();
    });

    // option click
    const options = list.querySelectorAll('li[role="option"]');
    options.forEach(li => {
      li.addEventListener('click', (ev) => {
        const v = li.dataset.value || li.textContent.trim();
        hidden.value = v;
        toggle.textContent = li.textContent.trim();
        toggle.classList.remove('placeholder');
        close();
      });
    });

    function open() {
      wrap.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function close() {
      wrap.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      if (!hidden.value) {
        toggle.textContent = placeholder;
        toggle.classList.add('placeholder');
      }
    }

    // close on outside click
    document.addEventListener('click', (ev) => {
      if (!wrap.contains(ev.target)) close();
    });

    // close on Esc
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') close();
    });

    // keyboard support for options
    options.forEach(li => {
      li.tabIndex = 0;
      li.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          li.click();
        }
      });
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
    setupCustomSelect('device-select');
    setupCustomSelect('buyer-select');

    const addBtn = document.getElementById('addBtn');
    addBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const nama = document.getElementById('nama').value.trim();
      const produk = document.getElementById('katalog').value.trim();
      const tanggal = document.getElementById('tglBeli').value;
      const durasi = document.getElementById('durasi').value;
      const modal = document.getElementById('modal').value || 0;
      const harga = document.getElementById('harga').value || 0;
      const device = document.getElementById('device-value').value || '-';
      const buyer = document.getElementById('buyer-value').value || '-';

      if (!nama || !produk) {
        showToast('Nama dan Katalog wajib diisi.', 3000);
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

    document.getElementById('resetBtnForm').addEventListener('click', (e) => {
      e.preventDefault();
      resetForm();
    });

    // export CSV (simple)
    document.getElementById('exportBtn').addEventListener('click', (e) => {
      e.preventDefault();
      exportTableToCSV();
    });

    // helpers
    function resetForm() {
      const fields = ['nama','wa','katalog','akun','password','profile','tglBeli','durasi','modal','harga'];
      fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const deviceWrap = document.getElementById('device-select');
      const buyerWrap = document.getElementById('buyer-select');
      if (deviceWrap) {
        deviceWrap.querySelector('input[type="hidden"]').value = '';
        deviceWrap.querySelector('.select-toggle').textContent = deviceWrap.dataset.placeholder || 'Device Type';
        deviceWrap.querySelector('.select-toggle').classList.add('placeholder');
      }
      if (buyerWrap) {
        buyerWrap.querySelector('input[type="hidden"]').value = '';
        buyerWrap.querySelector('.select-toggle').textContent = buyerWrap.dataset.placeholder || 'Tipe Buyer';
        buyerWrap.querySelector('.select-toggle').classList.add('placeholder');
      }
    }

    function refreshRowNumbers() {
      const rows = document.querySelectorAll('#tableBody tr');
      rows.forEach((r,i) => {
        r.children[0].textContent = i+1;
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

    function exportTableToCSV() {
      const rows = Array.from(document.querySelectorAll('#tableBody tr'));
      if (!rows.length) { showToast('Tidak ada data untuk diexport.', 2000); return; }
      const header = ['No','Nama','Produk','Tanggal','Durasi','Modal','Harga','Profit','Tipe Buyer','Device'];
      const csv = [header.join(',')];
      rows.forEach(r => {
        const cols = Array.from(r.children).slice(0,10).map(td => {
          // remove Rp and commas for numeric
          return `"${td.textContent.replace(/"/g,'""')}"`;
        });
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

    // toast
    function showToast(msg, ms = 2000) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.opacity = 1;
      setTimeout(() => {
        t.style.opacity = 0;
      }, ms);
    }

    // set year
    document.getElementById('year').textContent = new Date().getFullYear();
  });
})();
