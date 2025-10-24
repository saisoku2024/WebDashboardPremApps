// ... (Bagian atas script.js tetap sama) ...

document.addEventListener('DOMContentLoaded', function () {
    const $ = id => document.getElementById(id);

    // --- Elemen Navigasi Baru ---
    const pageOne = $('pageOne');
    const pageTwo = $('pageTwo');
    
    // FIX KRITIS: Ambil tombol dari elemen pageNav
    const pageNav = $('pageNav');
    const pageNavButtons = pageNav ? pageNav.querySelectorAll('button') : []; 
    // ... (deklarasi elemen form lainnya tetap sama) ...

    // --- CHART LOGIC PLACEHOLDERS ---
    // ... (Fungsi aggregateData, drawCharts, renderTopBuyers tetap sama) ...

    // --- NAVIGASI PAGE LOGIC ---
    function switchPage(pageId) {
        // Sembunyikan semua page container (main/div)
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
        });
        const targetPage = $(pageId);
        if (targetPage) {
            // Khusus pageOne (Input), pakai display:grid
            targetPage.style.display = pageId === 'pageOne' ? 'grid' : 'block'; 
            targetPage.classList.add('active');
        }

        // Update button visual
        pageNavButtons.forEach(btn => {
            if (btn.dataset.page === pageId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // KRITIS: Re-render chart jika pindah ke Page Two
        if (pageId === 'pageTwo') {
             const all = load();
             const aggregatedData = aggregateData(all);
             drawCharts(aggregatedData);
             renderTopBuyers(aggregatedData.topBuyers);
        }
    }

    pageNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            switchPage(pageId); // Panggil fungsi switchPage langsung dengan ID halaman
        });
    });
    // --- END NAVIGASI PAGE LOGIC ---
    
    // ... (sisa kode inisialisasi dan fungsi utama) ...
    
    // Panggil logika inisialisasi form dan pastikan pageOne aktif di awal
    populateCatalogSelects(); 
    if (tglEl && !tglEl.value) tglEl.value = isoToday();
    if (durasiEl && !durasiEl.value) durasiEl.value = '30 Hari'; 
    handleDurasiChange();
    render();
    
    // Pastikan Page One (Input) tampil sebagai default
    switchPage('pageOne'); 
});