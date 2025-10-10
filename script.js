// --- custom dropdown helper ---
function setupCustomSelect(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const toggle = wrap.querySelector('.select-toggle');
  const list = wrap.querySelector('.select-options');
  const hidden = wrap.querySelector('input[type="hidden"]');
  const placeholder = wrap.dataset.placeholder || 'Pilih';

  // init placeholder
  toggle.textContent = placeholder;

  // toggle dropdown
  toggle.addEventListener('click', (e) => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    if (expanded) close();
    else open();
    e.stopPropagation();
  });

  // option click
  list.querySelectorAll('li[role="option"]').forEach(li => {
    li.addEventListener('click', (ev) => {
      const v = li.dataset.value || li.textContent.trim();
      hidden.value = v;
      toggle.textContent = li.textContent.trim();
      close();
    });
  });

  // open / close functions
  function open() {
    list.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    // optional: focus first item
    const first = list.querySelector('li[role="option"]');
    if (first) first.focus();
  }
  function close() {
    list.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  // close on outside click
  document.addEventListener('click', (ev) => {
    if (!wrap.contains(ev.target)) close();
  });

  // close on Esc
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') close();
  });

  // allow keyboard selection (Enter) when option focused
  list.querySelectorAll('li[role="option"]').forEach(li => {
    li.tabIndex = 0;
    li.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        li.click();
      }
    });
  });
}

// Initialize selects
document.addEventListener('DOMContentLoaded', () => {
  setupCustomSelect('device-select');
  setupCustomSelect('buyer-select');

  // basic form add
  const addBtn = document.getElementById('addBtn');
  addBtn.addEventListener('click', function(e) {
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
      alert('Nama dan Katalog wajib diisi.');
      return;
    }

    // append row
    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    const profit = Number(harga) - Number(modal);
    row.innerHTML = `
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
    tbody.appendChild(row);

    // attach remove handler
    row.querySelector('.remove-row').addEventListener('click', () => {
      row.remove();
      refreshRowNumbers();
    });

    // reset form
    resetForm();
  });

  document.getElementById('resetBtnForm').addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });

  // small helpers
  function resetForm() {
    const fields = ['nama','wa','katalog','akun','password','profile','tglBeli','durasi','modal','harga'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    // reset custom selects to placeholder
    const deviceWrap = document.getElementById('device-select');
    const buyerWrap = document.getElementById('buyer-select');
    if (deviceWrap) {
      deviceWrap.querySelector('input[type="hidden"]').value = '';
      deviceWrap.querySelector('.select-toggle').textContent = deviceWrap.dataset.placeholder || 'Device Type';
    }
    if (buyerWrap) {
      buyerWrap.querySelector('input[type="hidden"]').value = '';
      buyerWrap.querySelector('.select-toggle').textContent = buyerWrap.dataset.placeholder || 'Tipe Buyer';
    }
  }

  function refreshRowNumbers(){
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach((r,i) => {
      r.children[0].textContent = i+1;
    });
  }

  // escape html to avoid injection
  function escapeHtml(text) {
    return text
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  // set year footer
  const y = new Date().getFullYear();
  document.getElementById('year').textContent = y;
});
