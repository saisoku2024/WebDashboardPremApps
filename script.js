<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAISOKU Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"></script>
    <style>
        /* CSS sudah lengkap - copy dari kode asli Anda */
        :root{--primary:#6366f1;--primary-light:#8b5cf6;--secondary:#06b6d4;--success:#10b981;--warning:#f59e0b;--danger:#ef4444;--dark:#1e293b;--light:#f8fafc;--border:#e2e8f0;--text:#334155;--text-light:#64748b;font-family:system-ui,-apple-system,sans-serif}*{box-sizing:border-box;margin:0;padding:0}body{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px;font-size:14px;color:var(--text)}@media (min-width:768px){body{padding:40px;font-size:16px}}.container{max-width:1400px;margin:0 auto}.grid{display:grid;grid-template-columns:1fr;gap:30px}@media (min-width:768px){.grid{grid-template-columns:1fr 1fr;gap:40px}}.card{background:#fff;border-radius:20px;box-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 10px 10px -5px rgba(0,0,0,.04);padding:30px;overflow:hidden;position:relative}.card::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--primary),var(--secondary))}.card-title{font-size:1.5em;font-weight:700;color:var(--dark);margin-bottom:20px;display:flex;align-items:center;gap:10px}.card-title svg{width:24px;height:24px;fill:currentColor}.field{position:relative;margin-bottom:20px}.field label{display:block;margin-bottom:8px;font-weight:600;color:var(--text);font-size:.9em}.field input,.field select{width:100%;padding:14px 16px;border:2px solid var(--border);border-radius:12px;font-size:16px;transition:all .3s ease;background:#fafbff;color:var(--dark)}.field input:focus,.field select:focus{outline:none;border-color:var(--primary);box-shadow:0 0 0 3px rgba(99,102,241,.1);background:#fff}.field.invalid input,.field.invalid select{border-color:var(--danger);background:#fef2f2}.field.invalid::after{content:'* Wajib diisi';position:absolute;right:10px;top:50%;transform:translateY(-50%);color:var(--danger);font-size:12px;font-weight:500}.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;transition:all .3s ease;text-decoration:none;border:none}.btn-primary{background:linear-gradient(135deg,var(--primary),var(--primary-light));color:#fff;box-shadow:0 4px 14px 0 rgba(99,102,241,.4)}.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px 0 rgba(99,102,241,.5)}.btn-secondary{background:transparent;color:var(--primary);border:2px solid var(--primary)}.btn-danger{background:var(--danger);color:#fff}.btn-danger:hover{background:#dc2626}.btn-small{padding:8px 16px;font-size:14px}.btn-group{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.table-container{overflow-x:auto;border-radius:16px;background:#fafbff;border:1px solid var(--border)}.table{width:100%;border-collapse:collapse;font-size:14px}.table th{padding:16px 12px;text-align:left;font-weight:600;color:var(--text);background:linear-gradient(90deg,#f8fafc,#f1f5f9);white-space:nowrap}.table td{padding:14px 12px;border-bottom:1px solid var(--border)}.table tr:hover{background:#f8fafc}.status-active{background:#dcfce7;color:#166534;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}.status-warning{background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}.status-expired{background:#fee2e2;color:#991b1b;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}.action-btn{margin-right:6px;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:500;transition:all .2s}.action-btn:hover{transform:translateY(-1px)}.outline-danger{background:transparent;color:var(--danger);border:1px solid var(--danger)}.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:30px}.kpi-card{padding:24px;text-align:center;border-radius:16px;background:linear-gradient(135deg,#fff7ed,#fef3c7)}.kpi-value{font-size:2.5em;font-weight:800;color:var(--warning);line-height:1;margin-bottom:4px}.kpi-label{color:var(--text-light);font-size:.95em;font-weight:500;text-transform:uppercase;letter-spacing:.5px}.empty-state{text-align:center;color:var(--text-light);font-style:italic;padding:40px;font-size:1.1em}.toast{position:fixed;top:20px;right:20px;background:#10b981;color:#fff;padding:16px 20px;border-radius:12px;box-shadow:0 10px 30px rgba(16,185,129,.4);transform:translateX(400px);transition:all .3s ease;z-index:10000;font-weight:500}.toast.show{transform:translateX(0)}.modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px}.modal-content{width:100%;max-width:500px;max-height:90vh;overflow-y:auto;background:#fff;border-radius:20px;position:relative}.modal-header{padding:24px 24px 0;border-bottom:1px solid var(--border);margin-bottom:20px}.modal-body{padding:0 24px 24px}.close-btn{position:absolute;top:20px;right:20px;background:none;border:none;font-size:28px;color:var(--text-light);cursor:pointer;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .2s}.close-btn:hover{background:#f1f5f9;color:var(--dark)}.custom-select-wrapper{position:relative;display:inline-block;width:100%}.custom-select{position:relative;display:flex;align-items:center;padding:14px 16px;border:2px solid var(--border);border-radius:12px;cursor:pointer;background:#fafbff;transition:all .3s}.custom-select.open,.custom-select:focus-within{border-color:var(--primary);box-shadow:0 0 0 3px rgba(99,102,241,.1);background:#fff}.label{flex:1;font-size:16px;color:var(--dark)}.caret{position:relative;width:16px;height:16px;margin-left:8px}.caret::after{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(0deg);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--text-light);transition:transform .2s}.custom-select.open .caret::after{transform:translate(-50%,-50%) rotate(180deg)}.custom-options{position:absolute;top:100%;left:0;right:0;background:#fff;border:2px solid var(--border);border-top:none;border-radius:0 0 12px 12px;max-height:200px;overflow-y:auto;box-shadow:0 20px 25px -5px rgba(0,0,0,.1);z-index:10;display:none}.custom-option{padding:12px 16px;cursor:pointer;transition:all .2s;font-size:16px}.custom-option:hover{background:#f8fafc}.custom-option.active{background:var(--primary);color:#fff}.page{display:none}.page.active{display:grid}.nav-tabs{display:flex;background:#fff;border-radius:16px 16px 0 0;padding:4px;box-shadow:0 -4px 20px rgba(0,0,0,.05)}.nav-tabs button{flex:1;padding:16px;font-weight:600;border:none;background:none;border-radius:12px;cursor:pointer;transition:all .3s;color:var(--text-light);position:relative}.nav-tabs button.active{color:var(--primary);background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.1))}.nav-tabs button.active::after{content:'';position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:60%;height:3px;background:linear-gradient(90deg,var(--primary),var(--secondary));border-radius:2px}@media (max-width:768px){.grid{grid-template-columns:1fr;gap:20px}.kpi-grid{grid-template-columns:repeat(2,1fr)}.card{padding:20px}}
    </style>
</head>
<body>
    <div class="container">
        <div class="grid">
            <!-- PAGE 1: Form + Table -->
            <div id="pageOne" class="page active">
                <!-- Form Input -->
                <div class="card">
                    <h2 class="card-title">📝 Input Transaksi</h2>
                    <form id="entryForm">
                        <div class="field">
                            <label for="nama">👤 Nama Pelanggan *</label>
                            <input type="text" id="nama" required placeholder="Nama lengkap pembeli">
                        </div>
                        <div class="field">
                            <label for="wa">📱 WhatsApp *</label>
                            <input type="tel" id="wa" required placeholder="081xxxxxxxxx">
                        </div>
                        <div class="field">
                            <label for="katalog">🎬 Produk *</label>
                            <select id="katalog" required>
                                <option value="">Pilih Produk</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="akun">🔑 Akun</label>
                            <input type="text" id="akun" placeholder="username@email.com">
                        </div>
                        <div class="field">
                            <label for="password">🔒 Password</label>
                            <input type="password" id="password" placeholder="••••••••">
                        </div>
                        <div class="field">
                            <label for="device">⚙️ Device</label>
                            <select id="device">
                                <option value="">Pilih Device</option>
                                <option value="Android">Android</option>
                                <option value="iOS">iOS</option>
                                <option value="PC">PC</option>
                                <option value="Smart TV">Smart TV</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="tglBeli">📅 Tanggal Beli</label>
                            <input type="date" id="tglBeli">
                        </div>
                        <div class="field">
                            <label for="durasi">⏱️ Durasi *</label>
                            <select id="durasi" required>
                                <option value="7 Hari">7 Hari</option>
                                <option value="14 Hari">14 Hari</option>
                                <option value="30 Hari" selected>30 Hari</option>
                                <option value="90 Hari">90 Hari</option>
                                <option value="Custom Text">Custom</option>
                            </select>
                            <input type="text" id="customDurasiInput" placeholder="Contoh: 45 Hari" style="display:none;margin-top:8px">
                        </div>
                        <div class="field">
                            <label for="modal">💰 Modal</label>
                            <input type="number" id="modal" placeholder="0" min="0">
                        </div>
                        <div class="field">
                            <label for="harga">💵 Harga Jual</label>
                            <input type="number" id="harga" placeholder="0" min="0">
                        </div>
                        <div class="field">
                            <label for="statusBuyer">🏷️ Status</label>
                            <select id="statusBuyer">
                                <option value="">Reguler</option>
                                <option value="VIP">VIP</option>
                                <option value="Premium">Premium</option>
                            </select>
                        </div>
                        <div class="btn-group">
                            <button type="submit" id="addBtn" class="btn btn-primary">+ Tambah Data</button>
                            <button type="button" id="resetBtn" class="btn btn-secondary">🔄 Reset</button>
                        </div>
                        <div class="field">
                            <label for="newCatalogInput">➕ Tambah Produk Baru</label>
                            <div style="display:flex;gap:10px">
                                <input type="text" id="newCatalogInput" placeholder="Contoh: Disney+ Hotstar">
                                <button type="button" id="addCatalogBtn" class="btn btn-secondary btn-small">Tambah</button>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Table -->
                <div class="card">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                        <h2 class="card-title">📊 Daftar Transaksi</h2>
                        <div style="display:flex;gap:12px">
                            <input type="text" id="searchInput" placeholder="🔍 Cari nama/WA..." style="padding:10px 12px;border:1px solid var(--border);border-radius:8px;width:200px">
                            <select id="filterProduk" style="padding:10px 12px;border:1px solid var(--border);border-radius:8px">
                                <option value="">Semua Produk</option>
                            </select>
                            <button id="exportBtn" class="btn btn-secondary btn-small">📤 Export CSV</button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Produk</th>
                                    <th>Tgl Beli</th>
                                    <th>Exp Date</th>
                                    <th>Durasi</th>
                                    <th>Modal</th>
                                    <th>Harga</th>
                                    <th>Profit</th>
                                    <th>Status</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- PAGE 2: Analytics -->
            <div id="pageTwo" class="page">
                <div class="card" style="grid-column:1/-1">
                    <div class="nav-tabs">
                        <button data-page="pageOne" class="active">📝 Transaksi</button>
                        <button data-page="pageTwo">📈 Analytics</button>
                    </div>
                    
                    <!-- KPI Cards -->
                    <div class="kpi-grid">
                        <div class="kpi-card">
                            <div class="kpi-value" id="kpi-sales">Rp 0</div>
                            <div class="kpi-label">Penjualan Hari Ini</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value" id="kpi-gmv">Rp 0</div>
                            <div class="kpi-label">Total GMV</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value" id="kpi-profit-all">Rp 0</div>
                            <div class="kpi-label">Total Profit</div>
                        </div>
                        <div class="kpi-card">
                            <div class="kpi-value" id="kpi-active">0</div>
                            <div class="kpi-label">Pelanggan Aktif</div>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:2fr 1fr;gap:30px">
                        <!-- Charts -->
                        <div>
                            <canvas id="monthlySalesChart" height="300"></canvas>
                        </div>
                        <!-- Top Buyers -->
                        <div>
                            <h3 style="margin-bottom:16px;color:var(--dark)">🏆 Top Buyers</h3>
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr><th>Nama</th><th>WA</th><th>GMV</th><th>Transaksi</th></tr>
                                    </thead>
                                    <tbody id="topBuyersBody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast -->
    <div id="toast" class="toast"></div>

    <!-- Invoice Modal -->
    <div id="invoiceModal" class="modal" style="display:none">
        <div class="modal-content">
            <button class="close-btn" id="closeInvoiceBtn">&times;</button>
            <div class="modal-header">
                <h3>🧾 Struk Penjualan</h3>
            </div>
            <div class="modal-body">
                <pre id="invoiceBody" style="background:#f8fafc;padding:24px;border-radius:12px;font-family:monospace;white-space:pre-wrap;font-size:14px;height:400px;overflow-y:auto;border:1px solid var(--border)"></pre>
            </div>
            <div style="padding:0 24px 24px;display:flex;gap:12px;justify-content:flex-end">
                <button id="copyInvoiceBtn" class="btn btn-secondary">📋 Copy</button>
                <button id="printInvoiceBtn" class="btn btn-primary">🖨️ Print</button>
                <button id="waInvoiceBtn" class="btn btn-secondary">📱 Kirim WA</button>
            </div>
        </div>
    </div>

    <script>
        // SUPABASE CONFIG
        const supabaseUrl = "https://dqvmcpbxdkybnsnxpaqx.supabase.co";
        const supabaseKey = "sb_publishable_wS5kxHmPN6jvZDxusUygTg_AquncKRI";
        const supabase = supabase.createClient(supabaseUrl, supabaseKey);

        const APPS_SCRIPT_URL = '';

        // Catalog
        let CATALOG_LIST = [
            "Canva Premium", "ChatGPT/Gemini AI", "Disney+", "HBO Max", "IQiyi",
            "Netflix Premium", "Prime Video", "Spotify Premium", "Vidio Platinum",
            "VIU Premium", "Youtube Premium"
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

        // Global chart instances
        let monthlySalesChartInstance;
        const CHART_BG_COLORS = ['#00f3ff', '#8a5cff', '#10b981', '#facc15', '#f43f5e'];

        document.addEventListener('DOMContentLoaded', function () {
            const $ = id => document.getElementById(id);
            const form = $('entryForm');
            const namaEl = $('nama');
            const waEl = $('wa');
            const akunEl = $('akun');
            const passEl = $('password');
            const profileEl = $('profile');
            const tglEl = $('tglBeli');
            const durasiEl = $('durasi');
            const customDurasiInput = $('customDurasiInput');
            const katalogSel = $('katalog');
            const deviceSel = $('device');
            const statusSel = $('statusBuyer');
            const filterSel = $('filterProduk');
            const searchInput = $('searchInput');
            const exportBtn = $('exportBtn');
            const tableBody = $('tableBody');
            const toastEl = $('toast');
            const topBuyersBody = $('topBuyersBody');
            const pageNav = $('pageNav');
            const pageNavButtons = pageNav ? pageNav.querySelectorAll('button') : [];

            const KPI = {
                sales: $('kpi-sales'),
                gmv: $('kpi-gmv'),
                profitAll: $('kpi-profit-all'),
                active: $('kpi-active')
            };

            let currentRenderList = [];

            // Utilities
            function showToast(msg, ms = 2000) {
                if (!toastEl) return;
                toastEl.textContent = msg;
                toastEl.classList.add('show');
                clearTimeout(toastEl._t);
                toastEl._t = setTimeout(() => toastEl.classList.remove('show'), ms);
            }

            function formatRupiah(n) { 
                return (Number(n) || 0).toLocaleString('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR', 
                    minimumFractionDigits: 0 
                }).replace('IDR', 'Rp '); 
            }

            function isoToday() { 
                return new Date().toISOString().slice(0,10); 
            }

            function formatDateDDMMYYYY(iso){
                if (!iso) return '-';
                const d = new Date(iso);
                if (isNaN(d)) return iso;
                const dd = String(d.getDate()).padStart(2,'0');
                const mm = String(d.getMonth()+1).padStart(2,'0');
                const yyyy = d.getFullYear();
                return `${dd}/${mm}/${yyyy}`;
            }

            // Supabase fetch
            async function fetchAllSales() {
                try {
                    const { data, error } = await supabase
                        .from('sales')
                        .select('*')
                        .order('created_at', { ascending: false });
                    if (error) throw error;
                    return data || [];
                } catch (error) {
                    console.error('Fetch error:', error);
                    showToast('Error loading data: ' + error.message);
                    return [];
                }
            }

            function getExpiryDate(tglBeli, durasi) {
                const m = String(durasi || '').match(/(\d+)/);
                if (!m || !tglBeli) return '';
                const days = parseInt(m[1], 10);
                const d = new Date(tglBeli);
                d.setDate(d.getDate() + days);
                return d.toISOString().slice(0, 10);
            }

            // FIXED RENDER FUNCTION
            async function render(filtro = '', q = '') {
                const all = await fetchAllSales();
                
                // KPI calculation (ALL DATA)
                let totalSalesToday = 0, gmv = 0, totalProfitAll = 0;
                const uniqueCustomers = new Set();
                const todayISO = isoToday();

                all.forEach(row => {
                    const modal = parseNumber(row.modal);
                    const harga = parseNumber(row.harga);
                    const profit = harga - modal;
                    
                    gmv += harga;
                    totalProfitAll += profit;
                    if (row.tanggal_beli?.slice(0,10) === todayISO) {
                        totalSalesToday += harga;
                    }
                    if (row.wa) uniqueCustomers.add(row.wa);
                });

                // Update KPIs
                if (KPI.sales) KPI.sales.textContent = formatRupiah(totalSalesToday);
                if (KPI.gmv) KPI.gmv.textContent = formatRupiah(gmv);
                if (KPI.profitAll) KPI.profitAll.textContent = formatRupiah(totalProfitAll);
                if (KPI.active) KPI.active.textContent = uniqueCustomers.size;

                // Filter table data (15 latest)
                const filteredList = all.filter(row => {
                    const rowKatalog = String(row.produk || '');
                    const rowNama = String(row.nama || '');
                    const rowWA = String(row.wa || '');
                    
                    if (filtro && rowKatalog !== filtro) return false;
                    if (q && !`${rowNama} ${rowWA}`.toLowerCase().includes(q)) return false;
                    return true;
                }).slice(0, 15);

                tableBody.innerHTML = '';
                if (!filteredList.length) {
                    tableBody.innerHTML = '<tr><td colspan="10" class="empty-state">Belum ada transaksi. Isi form di kiri lalu klik <strong>Tambah Data</strong>.</td></tr>';
                    return;
                }

                const today = new Date(isoToday()).getTime();
                const oneDay = 24 * 60 * 60 * 1000;

                filteredList.forEach((row, idx) => {
                    const modal = parseNumber(row.modal);
                    const harga = parseNumber(row.harga);
                    const profit = harga - modal;
                    
                    const expiryISO = getExpiryDate(row.tanggal_beli, row.durasi);
                    let statusText = 'Reguler', statusClass = '';

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
                    }

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td title="${escapeHtml(row.nama)}">${escapeHtml(row.nama)}</td>
                        <td title="${escapeHtml(row.produk)}">${escapeHtml(row.produk)}</td>
                        <td title="${row.tanggal_beli}">${formatDateDDMMYYYY(row.tanggal_beli)}</td>
                        <td title="${expiryISO || '-'}">${formatDateDDMMYYYY(expiryISO)}</td>
                        <td>${escapeHtml(row.durasi)}</td>
                        <td style="text-align:right">${formatRupiah(modal)}</td>
                        <td style="text-align:right">${formatRupiah(harga)}</td>
                        <td style="text-align:right">${formatRupiah(profit)}</td>
                        <td style="text-align:center"><span class="${statusClass}">${statusText}</span></td>
                        <td style="text-align:right">
                            <button class="action-btn action-struk" data-idx="${idx}" data-action="struk">Struk</button>
                            <button class="action-btn outline-danger" data-idx="${idx}" data-action="delete">Hapus</button>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            }

            function escapeHtml(s) {
                return String(s || '').replace(/[&<>"']/g, c => ({ 
                    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' 
                })[c]);
            }

            // Custom Select
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
                    sel.tabIndex = 0;
                }
            }

            function populateCatalogSelects() {
                destroyCustomSelect(katalogSel);
                destroyCustomSelect(filterSel);
                if(deviceSel) destroyCustomSelect(deviceSel);

                const sorted = sortCatalog(CATALOG_LIST);
                
                if(katalogSel) {
                    katalogSel.innerHTML = `<option value="">Pilih Produk</option>`;
                    sorted.forEach(item => {
                        const o = document.createElement('option');
                        o.value = item;
                        o.textContent = item;
                        katalogSel.appendChild(o);
                    });
                }
                
                if(filterSel) {
                    filterSel.innerHTML = `<option value="">Semua Produk</option>`;
                    sorted.forEach(item => {
                        const o = document.createElement('option');
                        o.value = item;
                        o.textContent = item;
                        filterSel.appendChild(o);
                    });
                }
                
                createCustomSelects();
            }

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
                    sel.tabIndex = -1;

                    const control = document.createElement('div');
                    control.className = 'custom-select';
                    const label = document.createElement('div');
                    label.className = 'label';
                    label.textContent = sel.options[sel.selectedIndex]?.text || 'Pilih';
                    const caret = document.createElement('div');
                    caret.className = 'caret';
                    control.appendChild(label);
                    control.appendChild(caret);

                    const opts = document.createElement('div');
                    opts.className = 'custom-options';

                    Array.from(sel.options).forEach((o,i) => {
                        const item = document.createElement('div');
                        item.className = 'custom-option';
                        item.textContent = o.text;
                        item.dataset.index = i;
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

            // Custom Durasi
            function handleDurasiChange() {
                const selectedValue = durasiEl.value;
                if (selectedValue === 'Custom Text') {
                    customDurasiInput.style.display = 'block';
                    customDurasiInput.required = true;
                } else {
                    customDurasiInput.style.display = 'none';
                    customDurasiInput.required = false;
                }
            }

            // Analytics Functions
            function aggregateData(allData) {
                const monthly = {};
                const categories = {};
                const topBuyers = {};
                const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

                allData.forEach(row => {
                    const month = new Date(row.tanggal_beli).getMonth();
                    const mKey = months[month];
                    
                    // Monthly
                    if (!monthly[mKey]) monthly[mKey] = {sales:0, profit:0, count:0};
                    monthly[mKey].sales += parseNumber(row.harga);
                    monthly[mKey].profit += (parseNumber(row.harga) - parseNumber(row.modal));
                    monthly[mKey].count++;

                    // Categories
                    const cat = row.produk || 'Lainnya';
                    if (!categories[cat]) categories[cat] = 0;
                    categories[cat] += parseNumber(row.harga);

                    // Top buyers
                    const buyerKey = row.wa || 'Anonim';
                    if (!topBuyers[buyerKey]) topBuyers[buyerKey] = {gmv:0, count:0, nama:row.nama};
                    topBuyers[buyerKey].gmv += parseNumber(row.harga);
                    topBuyers[buyerKey].count++;
                });

                return {
                    monthly: Object.entries(monthly).map(([label,data]) => ({label, ...data})),
                    categories: Object.entries(categories)
                        .sort(([,a],[,b]) => b-a)
                        .slice(0,5)
                        .map(([label,value]) => ({label, value})),
                    topBuyers: Object.entries(topBuyers)
                        .sort(([,a],[,b]) => b.gmv - a.gmv)
                        .slice(0,5)
                        .map(([wa,data]) => ({...data, wa}))
                };
            }

            function drawCharts(allData) {
                const data = aggregateData(allData);
                
                // Destroy existing chart
                if (monthlySalesChartInstance) {
                    monthlySalesChartInstance.destroy();
                }

                const ctx = document.getElementById('monthlySalesChart')?.getContext('2d');
                if (ctx) {
                    monthlySalesChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.monthly.map(m => m.label),
                            datasets: [{
                                label: 'Penjualan',
                                data: data.monthly.map(m => m.sales),
                                borderColor: '#6366f1',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                                y: { beginAtZero: true }
                            }
                        }
                    });
                }
            }

            function renderTopBuyers(allData) {
                const data = aggregateData(allData);
                topBuyersBody.innerHTML = '';
                
                if (!data.topBuyers.length) {
                    topBuyersBody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada data Top Buyer.</td></tr>';
                    return;
                }

                data.topBuyers.forEach(buyer => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${escapeHtml(buyer.nama)}</strong></td>
                        <td>${escapeHtml(buyer.wa)}</td>
                        <td style="text-align:right;font-weight:600">${formatRupiah(buyer.gmv)}</td>
                        <td style="text-align:center">${buyer.count}</td>
                    `;
                    topBuyersBody.appendChild(tr);
                });
            }

            // Validation
            function clearValidationErrors() {
                document.querySelectorAll('.field.invalid').forEach(el => el.classList.remove('invalid'));
            }

            function validateInput(el) {
                const parentField = el.closest('.field');
                let value = el.value.trim();
                
                if (el.id === 'katalog' && el.selectedIndex > 0) {
                    value = el.options[el.selectedIndex]?.text;
                }

                if (el.id === 'customDurasiInput' && durasiEl.value !== 'Custom Text') {
                    parentField?.classList.remove('invalid');
                    return true;
                }

                const isValid = el.checkValidity() && value !== '';
                if (!isValid) {
                    parentField?.classList.add('invalid');
                } else {
                    parentField?.classList.remove('invalid');
                }
                return isValid;
            }

            // Event Listeners
            populateCatalogSelects();
            
            if (tglEl && !tglEl.value) tglEl.value = isoToday();
            if (durasiEl) {
                durasiEl.addEventListener('change', handleDurasiChange);
                handleDurasiChange();
            }

            // Initial render
            render();

            // Form submit - FIXED NO DUPLICATION
            if (form) {
                form.addEventListener('submit', async function(ev) {
                    ev.preventDefault();
                    clearValidationErrors();

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
                        return;
                    }

                    const addBtn = $('addBtn');
                    addBtn.disabled = true;
                    addBtn.textContent = 'Menyimpan...';

                    const entry = {
                        nama: namaEl.value.trim(),
                        wa: waEl.value.trim(),
                        produk: katalogSel.options[katalogSel.selectedIndex]?.text || '',
                        akun: akunEl ? akunEl.value.trim() : '',
                        device: deviceSel ? deviceSel.value : '',
                        tanggal_beli: tglEl.value || isoToday(),
                        durasi: durasiFinal,
                        modal: parseNumber($('modal')?.value),
                        harga: parseNumber($('harga')?.value),
                        status: statusSel ? statusSel.value : ''
                    };

                    try {
                        const { error } = await supabase.from('sales').insert([entry]);
                        if (error) throw error;

                        await render();
                        showToast('✅ Transaksi ditambahkan!');

                        // Reset form
                        form.reset();
                        if (tglEl) tglEl.value = isoToday();
                        
                        [katalogSel, filterSel, deviceSel, statusSel, durasiEl].forEach(sel => {
                            if (sel) {
                                sel.selectedIndex = 0;
                                sel.dispatchEvent(new Event('change',{bubbles:true}));
                            }
                        });
                        
                        if (customDurasiInput) customDurasiInput.value = '';
                        handleDurasiChange();

                    } catch (error) {
                        console.error('Insert error:', error);
                        showToast('❌ Gagal simpan: ' + error.message);
                    } finally {
                        addBtn.disabled = false;
                        addBtn.textContent = '+ Tambah Data';
                    }
                });
            }

            // Reset button
            $('resetBtn')?.addEventListener('click', function(e){
                e.preventDefault();
                if (!confirm('Reset form?')) return;
                form.reset();
                if (tglEl) tglEl.value = isoToday();
                handleDurasiChange();
                clearValidationErrors();
                showToast('Form direset');
            });

            // Table actions
            tableBody.addEventListener('click', async function (e) {
                const btn = e.target.closest('button');
                if (!btn) return;
                
                const idx = Number(btn.dataset.idx);
                const action = btn.dataset.action;
                if (Number.isNaN(idx)) return;

                const all = await fetchAllSales();
                const row = all[idx];
                if (!row) return;

                if (action === 'struk') {
                    const startISO = row.tanggal_beli || isoToday();
                    const endISO = getExpiryDate(startISO, row.durasi);

                    const lines = [
                        `🧾 STRUK PENJUALAN SAISOKU.ID`,
                        `──────────`,
                        `👤 Nama     : ${row.nama || '-'}`,
                        `📱 Buyer WA : ${row.wa || '-'}`,
                        `🎬 Produk   : ${row.produk || '-'}`,
                        `🔑 Akun     : ${row.akun || '-'}`,
                        `⚙️ Device   : ${row.device || '-'}`,
                        `──────────`,
                        `📅 Buy Date : ${formatDateDDMMYYYY(startISO)}`,
                        ...(endISO ? [`📅 Exp Date  : ${formatDateDDMMYYYY(endISO)}`] : []),
                        `⏱️ Durasi   : ${row.durasi || '-'}`,
                        `──────────`,
                        `🏷️ Harga    : ${formatRupiah(parseNumber(row.harga || 0))}`,
                        `🧩 Status   : ${row.status || '-'}`,
                        `──────────`,
                        `Terima kasih telah berbelanja di SAISOKU.ID 🙏`,
                        `© 2026 SAISOKU.ID`
                    ];

                    openInvoiceModal(lines.join('\n'), row.wa);
                } else if (action === 'delete') {
                    if (!confirm('Hapus transaksi ini?')) return;
                    
                    // Get actual ID from Supabase
                    const { data: sales, error } = await supabase
                        .from('sales')
                        .select('id')
                        .eq('wa', row.wa)
                        .eq('tanggal_beli', row.tanggal_beli)
                        .limit(1);
                    
                    if (sales?.[0]?.id) {
                        const { error: deleteError } = await supabase
                            .from('sales')
                            .delete()
                            .eq('id', sales[0].id);
                        
                        if (!deleteError) {
                            await render();
                            showToast('✅ Transaksi dihapus');
                        }
                    }
                }
            });

            // Search & Filter
            if (searchInput) searchInput.addEventListener('input', debounce(() => render(filterSel?.value || '', searchInput.value.toLowerCase().trim()), 300));
            if (filterSel) filterSel.addEventListener('change', () => render(filterSel.value, searchInput?.value?.toLowerCase().trim() || ''));

            // Add new catalog
            $('addCatalogBtn')?.addEventListener('click', () => {
                const v = $('newCatalogInput')?.value?.trim();
                if (!v) return showToast('Masukkan nama produk');
                
                if (CATALOG_LIST.some(item => item.toLowerCase() === v.toLowerCase())) {
                    showToast('Produk sudah ada');
                    return;
                }
                
                CATALOG_LIST.push(v);
                CATALOG_LIST = sortCatalog(CATALOG_LIST);
                populateCatalogSelects();
                $('newCatalogInput').value = '';
                showToast('✅ Produk ditambahkan');
            });

            // Modal handling
            const invoiceModal = $('invoiceModal');
            const invoiceBody = $('invoiceBody');
            const copyInvoiceBtn = $('copyInvoiceBtn');
            const printInvoiceBtn = $('printInvoiceBtn');
            const waInvoiceBtn = $('waInvoiceBtn');
            const closeInvoiceBtn = $('closeInvoiceBtn');

            function openInvoiceModal(text, waNumber = '') {
                invoiceBody.textContent = text;
                invoiceModal.style.display = 'flex';
            }

            function closeInvoiceModal() {
                invoiceModal.style.display = 'none';
            }

            copyInvoiceBtn?.addEventListener('click', () => {
                navigator.clipboard.writeText(invoiceBody.textContent);
                showToast('📋 Teks disalin');
            });

            printInvoiceBtn?.addEventListener('click', () => {
                window.print();
            });

            waInvoiceBtn?.addEventListener('click', () => {
                const text = encodeURIComponent(invoiceBody.textContent);
                window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
            });

            closeInvoiceBtn?.addEventListener('click', closeInvoiceModal);
            invoiceModal?.addEventListener('click', (e) => {
                if (e.target === invoiceModal) closeInvoiceModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') closeInvoiceModal();
            });

            // Page navigation
            function switchPage(pageId) {
                document.querySelectorAll('.page').forEach(page => {
                    page.style.display = 'none';
                    page.classList.remove('active');
                });
                
                const targetPage = $(pageId);
                if (targetPage) {
                    targetPage.style.display = 'grid';
                    targetPage.classList.add('active');
                }

                pageNavButtons.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.page === pageId);
                });

                if (pageId === 'pageTwo') {
                    fetchAllSales().then(all => {
                        drawCharts(all);
                        renderTopBuyers(all);
                    });
                }
            }

            pageNavButtons.forEach(button => {
                button.addEventListener('click', () => {
                    switchPage(button.dataset.page);
                });
            });

            // Utils
            function debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }
        });
    </script>
</body>
</html>
