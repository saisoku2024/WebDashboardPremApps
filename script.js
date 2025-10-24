// ... (Bagian atas script.js tetap sama) ...

document.addEventListener('DOMContentLoaded', function () {
    const $ = id => document.getElementById(id);

    // --- Elemen Navigasi Baru ---
    const pageOne = $('pageOne');
    const pageTwo = $('pageTwo');
    const pageNavButtons = document.querySelectorAll('.page-nav button');

    // --- Elemen Form ---
    const form = $('entryForm');
    // ... (deklarasi elemen form lainnya tetap sama) ...
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
    
    // ... (Kode STORAGE_KEY dan fungsi utilitas tetap sama) ...
    const STORAGE_KEY = 'saisoku_subs_v3_fixed_v2';
    const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; } };
    const save = arr => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));

    function showToast(msg, ms = 1400) { /* ... */ }
    function formatRupiah(n) { /* ... */ return (Number(n) || 0).toLocaleString('id-ID'); }
    function isoToday() { /* ... */ return new Date().toISOString().slice(0,10); }
    function formatDateDDMMYYYY(iso){ /* ... */ }

    // Hapus custom select (fungsi helper)
    function destroyCustomSelect(sel) { /* ... */ }
    function populateCatalogSelects() { /* ... */ }
    function createCustomSelects() { /* ... */ }

    // --- Logic untuk Custom Durasi ---
    function handleDurasiChange() { /* ... */ }
    if (durasiEl) { durasiEl.addEventListener('change', handleDurasiChange); }
    // ---------------------------------


    let currentRenderList = [];
    
    // utility function to get expiry date
    function getExpiryDate(tglBeli, durasi) { /* ... */ }

    function render() {
        const all = load();
        // ... (Perhitungan KPI ALL TIME tetap sama) ...
        // ... (Update KPIs tetap sama) ...
        
        // 2. Tentukan data yang akan ditampilkan di tabel (filter dan batasi 15 terakhir)
        // ... (Logic filtering dan pembatasan 15 data tetap sama) ...

        // 3. Render tabel utama
        // ... (Logic rendering tabel tetap sama) ...
        
        // 4. Proses Aggregasi dan Gambar Chart
        const aggregatedData = aggregateData(all);
        drawCharts(aggregatedData);
        renderTopBuyers(aggregatedData.topBuyers);
    }
    
    // ... (Fungsi escapeHtml dan Validasi tetap sama) ...

    // --- NAVIGASI PAGE LOGIC ---
    function switchPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
        });
        const targetPage = $(pageId);
        if (targetPage) {
            targetPage.style.display = pageId === 'pageOne' ? 'grid' : 'block';
            targetPage.classList.add('active');
        }

        // Update button visual
        pageNavButtons.forEach(btn => {
            if (btn.dataset.page === (pageId === 'pageOne' ? 'input' : 'metrics')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // KRITIS: Re-render chart jika pindah ke Page 2
        if (pageId === 'pageTwo') {
             const all = load();
             const aggregatedData = aggregateData(all);
             drawCharts(aggregatedData);
             renderTopBuyers(aggregatedData.topBuyers);
        }
    }

    pageNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageName = button.dataset.page;
            if (pageName === 'input') {
                switchPage('pageOne');
            } else if (pageName === 'metrics') {
                switchPage('pageTwo');
            }
        });
    });
    // --- END NAVIGASI PAGE LOGIC ---
    
    // ... (Fungsi addCatalog, init, submit, reset, table actions, export CSV, dan modal handling tetap sama) ...
    
    // Panggil logika inisialisasi form
    populateCatalogSelects(); 
    if (tglEl && !tglEl.value) tglEl.value = isoToday();
    if (durasiEl && !durasiEl.value) durasiEl.value = '30 Hari'; 
    handleDurasiChange();
    render();
});