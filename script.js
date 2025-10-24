// CONFIG: isi APPS_SCRIPT_URL jika mau sinkron ke Google Sheets
const APPS_SCRIPT_URL = '';

// initial catalog list
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

function sortCatalog(list) {
    return Array.from(new Set(list)).sort((a,b)=> a.toLowerCase().localeCompare(b.toLowerCase()));
}
CATALOG_LIST = sortCatalog(CATALOG_LIST);

function parseNumber(v){
    if (v === undefined || v === null) return 0;
    const s = String(v).replace(/[^\d.-]/g,'').trim();
    if (s === '') return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

document.addEventListener('DOMContentLoaded', function () {
    const $ = id => document.getElementById(id);

    // --- Elemen Navigasi Baru ---
    const pageOne = $('pageOne');
    const pageTwo = $('pageTwo');
    const pageNav = $('pageNav');
    const pageNavButtons = pageNav ? pageNav.querySelectorAll('button') : []; 
    
    // --- Elemen Form ---
    const form = $('entryForm');
    const namaEl = $('nama');
    const waEl = $('wa');
    const akunEl = $('akun');
    const passEl = $('password');
    const profileEl = $('profile');
    const tglEl = $('tglBeli');
    const durasiEl = $('durasi');
    const customDurasiInput = $('customDurasiInput'); 
    const modalEl = $('modal');
    const hargaEl = $('harga');
    const addBtn = $('addBtn');
    const resetBtn = $('resetBtn');
    const addCatalogBtn = $('addCatalogBtn');
    const newCatalogInput = $('newCatalogInput');
    const katalogSel = $('katalog');
    const deviceSel = $('device');
    const statusSel = $('statusBuyer');
    
    // --- Elemen Dashboard & Tabel ---
    const filterSel = $('filterProduk');
    const searchInput = $('searchInput');
    const exportBtn = $('exportBtn');
    const tableBody = $('tableBody');
    const toastEl = $('toast');
    const topBuyersBody = $('topBuyersBody');

    const KPI = {
        sales: $('kpi-sales'),
        gmv: $('kpi-gmv'),
        profitAll: $('kpi-profit-all'),
        active: $('kpi-active')
    };

    const STORAGE_KEY = 'saisoku_subs_v3_fixed_v2';
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
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    }

    // Hapus custom select yang sudah ada sebelum membuat yang baru
    function destroyCustomSelect(sel) {
        if (sel.dataset.customized === '1') {
            const wrapper = sel.closest('.custom-select-wrapper');
            if (wrapper) {
                wrapper.parentNode.insertBefore(sel, wrapper);
                wrapper.remove();
            }
            sel.classList.remove('custom-select-hidden');
            sel.removeAttribute('data-customized');
            sel.removeAttribute('aria-hidden');
            try { sel.tabIndex = 0; } catch(e){}
        }
    }

    function populateCatalogSelects() {
        // FIX KRITIS: Hapus custom select lama sebelum membuat opsi baru
        // Ini memastikan elemen custom select (yang sering error saat render ulang) diinisialisasi dengan bersih
        if(katalogSel) destroyCustomSelect(katalogSel);
        if(filterSel) destroyCustomSelect(filterSel);
        if(deviceSel) destroyCustomSelect(deviceSel); // Tambahkan deviceSel

        const sorted = sortCatalog(CATALOG_LIST);
        
        // 1. Katalog Input
        if(katalogSel) {
            katalogSel.innerHTML = `<option value="">Pilih Produk</option>`;
            sorted.forEach(item => {
                const o = document.createElement('option');
                o.value = item;
                o.textContent = item;
                katalogSel.appendChild(o);
            });
        }
        
        // 2. Filter Produk
        if(filterSel) {
            filterSel.innerHTML = `<option value="">Semua Produk</option>`;
            sorted.forEach(item => {
                const o = document.createElement('option');
                o.value = item;
                o.textContent = item;
                filterSel.appendChild(o);
            });
        }
        
        // 3. Device Select
        // Tambahkan Device select options yang tidak berubah (jika ada)
        // Note: Options Device sudah ada di HTML, tapi jika logika ini diubah, ini tempatnya.
        
        // Panggil ulang create custom select setelah populate
        createCustomSelects(); 
    }
    
    // custom select (kept)
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

    // --- Logic untuk Custom Durasi ---
    function handleDurasiChange() {
        const selectedValue = durasiEl.value;
        if (selectedValue === 'Custom Text') {
            if (customDurasiInput) customDurasiInput.style.display = 'block';
            if (customDurasiInput) customDurasiInput.required = true;
        } else {
            if (customDurasiInput) customDurasiInput.style.display = 'none';
            if (customDurasiInput) customDurasiInput.required = false;
        }
    }

    if (durasiEl) {
        durasiEl.addEventListener('change', handleDurasiChange);
    }
    // ---------------------------------


    let currentRenderList = [];
    
    // utility function to get expiry date
    function getExpiryDate(tglBeli, durasi) {
        const m = String(durasi || '').match(/(\d+)/);
        if (!m || !tglBeli) return '';
        const days = parseInt(m[1], 10);
        const d = new Date(tglBeli);
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
    }

    function render() {
        const all = load();
        const filtro = filterSel && filterSel.value ? filterSel.value : '';
        const q = (searchInput && searchInput.value || '').toLowerCase().trim();
        tableBody.innerHTML = '';
        currentRenderList = [];

        // Perhitungan KPI ALL TIME
        let totalSalesToday = 0; 
        let gmv = 0;
        let totalProfitAll = 0;
        const uniqueCustomers = new Set(); 
        const todayISO = isoToday();


        all.forEach((row, originalIndex) => {
            const modal = parseNumber(row.modal);
            const harga = parseNumber(row.harga);
            const profit = harga - modal;
            
            // Perhitungan KPI berdasarkan SEMUA DATA
            gmv += harga;
            totalProfitAll += profit;
            if ((row.tglBeli || '').slice(0,10) === todayISO) {
                totalSalesToday += harga;
            }
            if (row.wa) {
                uniqueCustomers.add(row.wa); 
            }

            // Filtering untuk render list
            const rowKatalog = String(row.katalog || '');
            const rowNama = String(row.nama || '');
            const rowWA = String(row.wa || '');
            
            if (filtro && rowKatalog !== filtro) return;
            
            if (q) {
                const hay = `${rowNama} ${rowWA}`.toLowerCase();
                if (!hay.includes(q)) return;
            }
            
            currentRenderList.push({ row, originalIndex });
        });
        
        // Update KPIs (HARUS DARI SEMUA DATA)
        KPI.sales && (KPI.sales.textContent = formatRupiah(totalSalesToday));
        KPI.gmv && (KPI.gmv.textContent = formatRupiah(gmv));
        KPI.profitAll && (KPI.profitAll.textContent = formatRupiah(totalProfitAll));
        KPI.active && (KPI.active.textContent = uniqueCustomers.size); 

        
        // 2. Tentukan data yang akan ditampilkan di tabel (filter dan batasi 15 terakhir)
        let filteredList = all.filter(row => {
            const rowKatalog = String(row.katalog || '');
            const rowNama = String(row.nama || '');
            const rowWA = String(row.wa || '');

            // Logika Filter Produk
            if (filtro && rowKatalog !== filtro) return false;
            
            // Logika Search
            if (q) {
                const hay = `${rowNama} ${rowWA}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        // Terapkan batas 15 transaksi terakhir: Balik urutan dan ambil 15
        filteredList.reverse();
        const limitedList = filteredList.slice(0, 15);
        
        // Simpan index dari list yang dibatasi
        limitedList.reverse().forEach(row => { 
            const originalIndex = all.indexOf(row);
            currentRenderList.push({ row, originalIndex });
        });


        // 3. Render tabel utama
        if (!currentRenderList.length) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="10" class="empty-state">Belum ada transaksi. Isi form di kiri lalu klik <strong>Tambah Data</strong>.</td>`;
            tableBody.appendChild(tr);
        } else {
            const today = new Date(todayISO).getTime(); 
            const oneDay = 24 * 60 * 60 * 1000;
            
            currentRenderList.forEach((entry, idx) => {
                const row = entry.row;
                const modal = parseNumber(row.modal);
                const harga = parseNumber(row.harga);
                const profit = harga - modal;
                
                // Kalkulasi Status Langganan
                const expiryISO = getExpiryDate(row.tglBeli, row.durasi);
                let statusText = 'N/A';
                let statusClass = '';

                if (expiryISO && String(row.durasi).toLowerCase().includes('hari')) {
                    const expiryTime = new Date(expiryISO).getTime();
                    const diffDays = Math.ceil((expiryTime - today) / oneDay);
                    
                    if (diffDays <= 0) {
                        statusText = 'Expired';
                        statusClass = 'status-expired';
                    } else if (diffDays <= 7) {
                        statusText = 'Warning';
                        statusClass = 'status-warning';
                    } else {
                        statusText = 'Active';
                        statusClass = 'status-active';
                    }
                } else {
                    statusText = 'Reguler';
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td title="${escapeHtml(row.nama)}">${escapeHtml(row.nama)}</td>
                    <td title="${escapeHtml(row.katalog)}">${escapeHtml(row.katalog)}</td>
                    <td title="${row.tglBeli}">${formatDateDDMMYYYY(row.tglBeli)}</td>
                    <td title="${expiryISO || '-'}">${formatDateDDMMYYYY(expiryISO)}</td>
                    <td>${escapeHtml(row.durasi)}</td>
                    <td style="text-align:right">Rp ${formatRupiah(modal)}</td>
                    <td style="text-align:right">Rp ${formatRupiah(harga)}</td>
                    <td style="text-align:right">Rp ${formatRupiah(profit)}</td>
                    <td style="text-align:center"><span class="${statusClass}">${statusText}</span></td>
                    <td style="text-align:right">
                        <button class="action-btn action-struk" data-idx="${idx}" data-action="struk">Struk</button>
                        <button class="action-btn outline-danger" data-idx="${idx}" data-action="delete">Hapus</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    function escapeHtml(s) {
        return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    }
    
    // --- VALIDATION LOGIC ---
    function clearValidationErrors() {
        document.querySelectorAll('.field.invalid').forEach(el => el.classList.remove('invalid'));
    }

    function validateInput(el) {
        const parentField = el.closest('.field');
        const isSelect = el.tagName === 'SELECT';
        const isCustomDurasi = el.id === 'customDurasiInput'; 
        
        let value = el.value.trim();
        
        if (el.id === 'katalog' && el.selectedIndex > 0) {
            value = el.options[el.selectedIndex]?.text;
        }

        if (isCustomDurasi && durasiEl.value !== 'Custom Text') {
            parentField?.classList.remove('invalid');
            return true;
        }

        const isValid = el.checkValidity() && value !== '';

        if (isValid) {
            parentField?.classList.remove('invalid');
            return true;
        }
        parentField?.classList.add('invalid');
        return false;
    }

    // add catalog
    addCatalogBtn.addEventListener('click', () => {
        const v = (newCatalogInput.value || '').trim();
        if (!v) { newCatalogInput.focus(); return; }
        
        if (CATALOG_LIST.some(item => item.toLowerCase() === v.toLowerCase())) {
            showToast('Produk sudah ada');
            return;
        }
        
        CATALOG_LIST.push(v);
        CATALOG_LIST = sortCatalog(CATALOG_LIST);
        
        populateCatalogSelects();

        newCatalogInput.value = '';
        showToast('Produk ditambahkan');
    });

    // init
    
    // FIX KRITIS: Logika init sekarang dipanggil setelah DOM siap
    populateCatalogSelects(); 
    
    if (tglEl && !tglEl.value) tglEl.value = isoToday();
    if (durasiEl && !durasiEl.value) durasiEl.value = '30 Hari'; 
    handleDurasiChange();
    
    render();


    // --- PENGIKATAN EVENT FORM (KRITIS) ---
    if (form) {
        form.addEventListener('submit', function(ev) {
            ev.preventDefault();
            clearValidationErrors(); 

            // Validasi Field Wajib
            const isNamaValid = validateInput(namaEl);
            const isWaValid = validateInput(waEl);
            const isKatalogValid = validateInput(katalogSel);
            
            let durasiFinal = durasiEl.value;
            let isDurasiValid = true;

            if (durasiFinal === 'Custom Text') {
                isDurasiValid = validateInput(customDurasiInput);
                durasiFinal = customDurasiInput.value.trim();
            }


            if (!isNamaValid || !isWaValid || !isKatalogValid || !isDurasiValid) {
                showToast('Lengkapi data wajib (*).');
                const firstInvalid = document.querySelector('.field.invalid');
                if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            addBtn.disabled = true;
            addBtn.textContent = 'Menyimpan...';

            const entry = {
                nama: namaEl.value.trim(), 
                wa: waEl.value.trim(), 
                katalog: katalogSel.value, 
                akun: akunEl ? akunEl.value.trim() : '', 
                password: passEl ? passEl.value : '', 
                profile: profileEl ? profileEl.value.trim() : '', 
                device: deviceSel ? deviceSel.value : '',
                tglBeli: (tglEl && tglEl.value) ? tglEl.value : isoToday(), 
                durasi: durasiFinal, 
                statusBuyer: statusSel ? statusSel.value : '', 
                modal: modalEl ? modalEl.value : '', 
                harga: hargaEl ? hargaEl.value : '', 
                created: new Date().toISOString()
            };

            const all = load();
            
            all.push(entry);
            save(all);
            
            render();
            showToast('Transaksi ditambahkan');
            
            form.reset();
            addBtn.disabled = false;
            addBtn.textContent = '+ Tambah Data';
            
            if (tglEl) tglEl.value = isoToday();
            
            const selectsToReset = [katalogSel, filterSel, deviceSel, statusSel, durasiEl]; 
            selectsToReset.forEach(sel => {
                if (sel) {
                    sel.selectedIndex = 0; 
                    sel.dispatchEvent(new Event('change',{bubbles:true})); 
                    sel.closest('.field')?.classList.remove('invalid'); 
                }
            });
            
            if (customDurasiInput) customDurasiInput.value = '';
            handleDurasiChange(); 


            namaEl.closest('.field')?.classList.remove('invalid');
            waEl.closest('.field')?.classList.remove('invalid');
            
            document.querySelector('.table-view').scrollIntoView({ behavior: 'smooth' });
            

            if (APPS_SCRIPT_URL) {
                fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        buyerName: entry.nama, buyerWA: entry.wa, catalog: entry.katalog, duration: entry.durasi,
                        account: entry.akun, password: entry.password, profilePin: entry.profile, device: entry.device,
                        buyerType: entry.statusBuyer, paymentNum: Number(entry.harga)||0, modalNum: Number(entry.modal)||0, dateBuy: entry.tglBeli
                    })
                }).catch(()=>{/* ignore */});
            }
        });
    }

    // Tombol Reset (KRITIS FIX)
    if (resetBtn && form) {
        resetBtn.addEventListener('click', function(e){
            e.preventDefault();
            // FIX KRITIS: Konfirmasi Reset
            if (!confirm('Reset form? Semua input akan kosong.')) return;
            form.reset();
            
            if (tglEl) tglEl.value = isoToday();
            
            const selectsToReset = [katalogSel, deviceSel, statusSel, durasiEl]; 
            selectsToReset.forEach(sel => {
                if (sel) {
                    sel.selectedIndex = 0; 
                    sel.dispatchEvent(new Event('change',{bubbles:true})); 
                    sel.closest('.field')?.classList.remove('invalid');
                }
            });

            if (customDurasiInput) customDurasiInput.value = '';
            handleDurasiChange();
            
            clearValidationErrors();
            showToast('Form direset'); // FIX KRITIS: Notif berhasil reset
        });
    }
    // --- END PENGIKATAN EVENT FORM ---


    // table actions (struk/delete) - Tetap sama
    tableBody.addEventListener('click', function (e) {
        // ... (Logika struk dan delete tetap sama) ...
    });
    // export CSV - Tetap sama
    if (exportBtn) {
        // ... (Logika export tetap sama) ...
    }

    if (searchInput) searchInput.addEventListener('input', render);
    if (filterSel) filterSel.addEventListener('change', render);

    // invoice modal handling - Tetap sama
    // ... (Logika modal handling tetap sama) ...

    // --- CHART LOGIC PLACEHOLDERS ---
    function aggregateData(allData) { /* ... (Logika placeholder chart tetap sama) ... */ }
    function drawCharts(aggregatedData) { /* ... (Logika placeholder chart tetap sama) ... */ }
    function renderTopBuyers(topBuyers) { /* ... (Logika placeholder chart tetap sama) ... */ }

    // Panggil chart logic saat DOM siap
    const all = load();
    const aggregatedData = aggregateData(all);
    drawCharts(aggregatedData);
    renderTopBuyers(aggregatedData.topBuyers);
});