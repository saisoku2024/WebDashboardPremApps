
/* ===============================
   SAISOKU DASHBOARD - FULL FEATURES
   Fitur:
   - Input transaksi & Validasi
   - List data Supabase (Realtime-ish via refresh)
   - Tab Navigation (Input vs Analysis)
   - Charts & Metrics (Aggregated Data)
   - Invoice Modal (Struk)
   - Export CSV
   - Filter + Search
================================= */

// === SUPABASE CONFIG ===
const supabaseUrl = "https://dqvmcpbxdkybnsnxpaqx.supabase.co";
const supabaseKey = "sb_publishable_wS5kxHmPN6jvZDxusUygTg_AquncKRI";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// === GLOBAL STATE ===
let TRANSACTION_DATA = [];
let CHART_INSTANCES = {};

// === PRODUK DEFAULT ===
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
  "Youtube Premium"
];

// === UTILS ===
const $ = id => document.getElementById(id);
const parseNumber = v => Number(String(v || 0).replace(/[^\d]/g, '')) || 0;
const formatRupiah = n => "Rp " + (Number(n) || 0).toLocaleString("id-ID");
const isoToday = () => new Date().toISOString().slice(0, 10);
const sortCatalog = list => Array.from(new Set(list)).sort((a, b) => a.localeCompare(b));

// === DOM READY ===
document.addEventListener("DOMContentLoaded", () => {
  CATALOG_LIST = sortCatalog(CATALOG_LIST);
  initApp();
});

function initApp() {
  // 1. Initial Render
  populateCatalog();
  setupEventListeners();

  // 2. Fetch Data
  fetchData().then(() => {
    updateUI();
    setupRealtime(); // Aktifkan Realtime
  });
}

// =========================
// REALTIME SUBSCRIPTION
// =========================
function setupRealtime() {
  // PENTING: Pastikan "Realtime" sudah diaktifkan di Supabase Dashboard (Table Editor -> sales -> Enable Realtime)
  supabaseClient
    .channel('sales-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales' },
      (payload) => {
        // Simple approach: Refetch all data to keep consistency
        // (Bisa dioptimalkan dengan memanipulasi array lokal jika data sangat besar)
        console.log('Change received!', payload);
        fetchData().then(updateUI);
        showToast("Data diperbarui...");
      }
    )
    .subscribe();
}

// =========================
// DATA HANDLING
// =========================
async function fetchData() {
  const { data, error } = await supabaseClient
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showToast("Gagal load data: " + error.message);
    return;
  }

  TRANSACTION_DATA = data || [];
}

function updateUI() {
  // Update Table
  renderTable();
  // Update KPI Cards (Page 1)
  updateKPIs();
  // Update Charts (Page 2) - only if visible or just update data
  if (!$("pageTwo").style.display || $("pageTwo").style.display === "none") {
    // If hidden, charts will update when tab switches
  } else {
    updateCharts();
  }
}

// =========================
// UI RENDERING
// =========================
function populateCatalog() {
  const katalogSel = $("katalog");
  const filterSel = $("filterProduk");

  katalogSel.innerHTML = `<option value="">Pilih Produk</option>`;
  filterSel.innerHTML = `<option value="">Semua Produk</option>`;

  CATALOG_LIST.forEach(p => {
    katalogSel.innerHTML += `<option value="${p}">${p}</option>`;
    filterSel.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

function renderTable() {
  const tableBody = $("tableBody");
  const filterVal = $("filterProduk").value;
  const searchVal = $("searchInput").value.toLowerCase();

  // Filter Data
  const filtered = TRANSACTION_DATA.filter(r => {
    if (filterVal && r.produk !== filterVal) return false;
    if (searchVal && !(`${r.nama} ${r.wa}`).toLowerCase().includes(searchVal)) return false;
    return true;
  });

  tableBody.innerHTML = "";

  if (!filtered.length) {
    tableBody.innerHTML = `<tr><td colspan="10" class="text-center p-4">Data tidak ditemukan</td></tr>`;
    return;
  }

  // Show top 15
  filtered.slice(0, 15).forEach(row => {
    const profit = parseNumber(row.harga) - parseNumber(row.modal);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.nama}</td>
      <td>${row.produk}</td>
      <td>${row.tanggal_beli || "-"}</td>
      <td>${calculateEndDate(row.tanggal_beli, row.durasi)}</td>
      <td>${row.durasi}</td>
      <td class="text-right">${formatRupiah(row.modal)}</td>
      <td class="text-right">${formatRupiah(row.harga)}</td>
      <td class="text-right text-success font-weight-bold">${formatRupiah(profit)}</td>
      <td><span class="badge ${row.status === 'Reseller' ? 'badge-info' : 'badge-secondary'}">${row.status || 'Reguler'}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn-icon small" onclick="openInvoice('${row.id}')" title="Struk">📄</button>
          <button class="btn-icon small text-danger" onclick="deleteItem('${row.id}')" title="Hapus">🗑️</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function calculateEndDate(startDate, durationStr) {
  if (!startDate || !durationStr) return "-";
  const days = parseInt(durationStr) || 30; // Default 30 if parsing fails
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// =========================
// KPI & METRICS
// =========================
function updateKPIs() {
  const today = isoToday();

  // 1. Sales Hari Ini
  const todaySales = TRANSACTION_DATA
    .filter(r => (r.tanggal_beli || "").startsWith(today))
    .reduce((sum, r) => sum + parseNumber(r.harga), 0);

  // 2. Total GMV (All Time)
  const totalGMV = TRANSACTION_DATA.reduce((sum, r) => sum + parseNumber(r.harga), 0);

  // 3. Total Profit
  const totalProfit = TRANSACTION_DATA.reduce((sum, r) => {
    return sum + (parseNumber(r.harga) - parseNumber(r.modal));
  }, 0);

  // 4. Active Customers (Unique WA)
  const uniqueCustomers = new Set(TRANSACTION_DATA.map(r => r.wa)).size;

  // Render
  $("kpi-sales").textContent = formatRupiah(todaySales).replace("Rp ", "");
  $("kpi-gmv").textContent = formatRupiah(totalGMV).replace("Rp ", "");
  $("kpi-profit-all").textContent = formatRupiah(totalProfit).replace("Rp ", "");
  $("kpi-active").textContent = uniqueCustomers;
}

// =========================
// CHARTS
// =========================
function initCharts() {
  const ctx1 = $("monthlySalesChart");
  const ctx2 = $("topCategoriesChart");
  const ctx3 = $("monthlyCustomersChart");

  if (!ctx1 || !ctx2 || !ctx3) return;

  // Destroy existing if any
  if (CHART_INSTANCES.sales) CHART_INSTANCES.sales.destroy();
  if (CHART_INSTANCES.cat) CHART_INSTANCES.cat.destroy();
  if (CHART_INSTANCES.cust) CHART_INSTANCES.cust.destroy();

  // --- PREPARE DATA ---
  const months = {}; // "2023-10": {sales: 0, profit: 0}
  const categories = {}; // "Netflix": 0 (GMV)
  const custMonths = {}; // "2023-10": Set(wa)

  TRANSACTION_DATA.forEach(r => {
    const d = r.tanggal_beli ? r.tanggal_beli.slice(0, 7) : "Unknown"; // YYYY-MM

    // Monthly Sales
    if (!months[d]) months[d] = { sales: 0, profit: 0 };
    months[d].sales += parseNumber(r.harga);
    months[d].profit += (parseNumber(r.harga) - parseNumber(r.modal));

    // Categories
    if (!categories[r.produk]) categories[r.produk] = 0;
    categories[r.produk] += parseNumber(r.harga);

    // Active Cust
    if (!custMonths[d]) custMonths[d] = new Set();
    custMonths[d].add(r.wa);
  });

  const sortedMonths = Object.keys(months).sort();
  const sortedCats = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5

  // 1. Monthly Sales Chart
  CHART_INSTANCES.sales = new Chart(ctx1, {
    type: 'line',
    data: {
      labels: sortedMonths,
      datasets: [
        { label: 'Sales (Omset)', data: sortedMonths.map(m => months[m].sales), borderColor: '#4F46E5', tension: 0.3 },
        { label: 'Profit (Bersih)', data: sortedMonths.map(m => months[m].profit), borderColor: '#10B981', tension: 0.3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // 2. Top Categories Chart
  CHART_INSTANCES.cat = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: sortedCats.map(c => c[0]),
      datasets: [{
        data: sortedCats.map(c => c[1]),
        backgroundColor: ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#6366F1']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  // 3. Monthly Active Customers
  CHART_INSTANCES.cust = new Chart(ctx3, {
    type: 'bar',
    data: {
      labels: sortedMonths,
      datasets: [{
        label: 'Pelanggan Unik',
        data: sortedMonths.map(m => custMonths[m].size),
        backgroundColor: '#8B5CF6'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function updateTopBuyers() {
  const buyers = {}; // WA: {name, gmv, count}

  TRANSACTION_DATA.forEach(r => {
    if (!buyers[r.wa]) buyers[r.wa] = { name: r.nama, gmv: 0, count: 0, wa: r.wa };
    buyers[r.wa].gmv += parseNumber(r.harga);
    buyers[r.wa].count += 1;
  });

  const sorted = Object.values(buyers).sort((a, b) => b.gmv - a.gmv).slice(0, 5);
  const tbody = $("topBuyersBody");
  tbody.innerHTML = "";

  sorted.forEach(b => {
    tbody.innerHTML += `
      <tr>
        <td>${b.name}</td>
        <td>${b.wa}</td>
        <td>${formatRupiah(b.gmv)}</td>
        <td>${b.count} Transaksi</td>
      </tr>
    `;
  });
}

function updateCharts() {
  initCharts(); // Re-init for simplicity
  updateTopBuyers();
}

// =========================
// EVENT HANDLERS
// =========================
function setupEventListeners() {
  // Tab Navigation
  document.querySelectorAll(".page-nav button").forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active
      document.querySelectorAll(".page-nav button").forEach(b => b.classList.remove("active"));
      document.querySelectorAll("main.page").forEach(p => {
        p.classList.remove("active");
        p.style.display = "none";
      });

      // Set active
      btn.classList.add("active");
      const targetId = btn.getAttribute("data-page");
      const targetPage = $(targetId);
      targetPage.classList.add("active");
      targetPage.style.display = targetId === "pageOne" ? "grid" : "block";

      if (targetId === "pageTwo") {
        updateCharts();
      }
    });
  });

  // Form Submit
  $("entryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = $("addBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Menyimpan...";

    const entry = {
      nama: $("nama").value.trim(),
      wa: $("wa").value.trim(),
      produk: $("katalog").value,
      akun: $("akun").value,
      device: $("device").value,
      tanggal_beli: $("tglBeli").value || isoToday(),
      durasi: $("durasi").value === "Custom Text" ? $("customDurasiInput").value : $("durasi").value,
      modal: parseNumber($("modal").value),
      harga: parseNumber($("harga").value),
      status: $("statusBuyer").value,
      created_at: new Date().toISOString()
    };

    if (!entry.nama || !entry.wa || !entry.produk) {
      showToast("Lengkapi data wajib (*)");
      submitBtn.disabled = false;
      submitBtn.textContent = "+ Tambah Data";
      return;
    }

    const { error } = await supabaseClient.from("sales").insert([entry]);

    if (error) {
      showToast("Gagal: " + error.message);
    } else {
      showToast("Berhasil Disimpan!");
      $("entryForm").reset();
      // Refresh Data
      await fetchData();
      updateUI();
    }
    submitBtn.disabled = false;
    submitBtn.textContent = "+ Tambah Data";
  });

  // Search & Filter
  $("searchInput").addEventListener("input", renderTable);
  $("filterProduk").addEventListener("change", renderTable);

  // Add Product
  $("addCatalogBtn").addEventListener("click", () => {
    const val = $("newCatalogInput").value.trim();
    if (val && !CATALOG_LIST.includes(val)) {
      CATALOG_LIST.push(val);
      CATALOG_LIST = sortCatalog(CATALOG_LIST);
      populateCatalog();
      $("newCatalogInput").value = "";
      showToast("Produk ditambahkan ke list");
    }
  });

  // Duration Custom Input
  $("durasi").addEventListener("change", (e) => {
    const customInput = $("customDurasiInput");
    if (e.target.value === "Custom Text") {
      customInput.style.display = "block";
      customInput.required = true;
    } else {
      customInput.style.display = "none";
      customInput.required = false;
    }
  });

  // Export CSV
  $("exportBtn").addEventListener("click", exportToCSV);

  // Modal Actions
  $("closeInvoiceBtn").addEventListener("click", () => {
    $("invoiceModal").style.display = "none";
  });
  $("copyInvoiceBtn").addEventListener("click", () => {
    const text = $("invoiceBody").innerText;
    navigator.clipboard.writeText(text).then(() => showToast("Teks Invoice Disalin!"));
  });
  $("waInvoiceBtn").addEventListener("click", () => {
    const data = window.currentInvoiceData;
    if (!data) return;
    const text = encodeURIComponent($("invoiceBody").innerText);
    window.open(`https://wa.me/${data.wa}?text=${text}`, "_blank");
  });
  $("printInvoiceBtn").addEventListener("click", () => {
    const content = $("invoiceBody").innerHTML;
    const win = window.open("", "", "height=500,width=500");
    win.document.write(`<html><head><title>Struk</title></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  });
}

// =========================
// INVOICE & ACTIONS
// =========================
window.openInvoice = (id) => {
  const item = TRANSACTION_DATA.find(r => r.id == id); // Loose equality for string/int IDs
  if (!item) return;

  window.currentInvoiceData = item; // Store for WA button

  const dateStr = item.tanggal_beli || isoToday();
  const content = `
    <div style="font-family: monospace; line-height: 1.5;">
      <center><b>SAISOKU.ID DASHBOARD</b></center>
      <center>Terima kasih atas pembelian Anda</center>
      <hr dashed>
      <br>
      <b>Tanggal:</b> ${dateStr}<br>
      <b>Customer:</b> ${item.nama}<br>
      <b>WhatsApp:</b> ${item.wa}<br>
      <br>
      <b>Produk:</b> ${item.produk}<br>
      <b>Durasi:</b> ${item.durasi}<br>
      <b>Status:</b> LUNAS<br>
      <br>
      <b>Total Bayar:</b> ${formatRupiah(item.harga)}
      <br><br>
      <hr dashed>
      <center>Simpan struk ini sebagai bukti pembayaran yang sah.</center>
    </div>
  `;

  $("invoiceBody").innerHTML = content;
  $("invoiceModal").style.display = "flex";
};

window.deleteItem = async (id) => {
  if (!confirm("Yakin hapus data ini?")) return;

  const { error } = await supabaseClient.from("sales").delete().eq("id", id);
  if (error) {
    showToast("Gagal hapus: " + error.message);
  } else {
    showToast("Data dihapus");
    await fetchData();
    updateUI();
  }
};

function exportToCSV() {
  if (!TRANSACTION_DATA.length) {
    showToast("Tidak ada data untuk diexport");
    return;
  }

  const headers = ["Nama", "WhatsApp", "Produk", "Akun", "Password", "Profile/PIN", "Device", "Tanggal Beli", "Durasi", "Modal", "Harga Jual", "Status"];
  const csvRows = [headers.join(",")];

  TRANSACTION_DATA.forEach(r => {
    const row = [
      `"${r.nama}"`,
      `'${r.wa}`, // Force string for excel phone numbers
      `"${r.produk}"`,
      `"${r.akun || ''}"`,
      `"${r.password || ''}"`,
      `"${r.profile || ''}"`,
      `"${r.device || ''}"`,
      r.tanggal_beli,
      `"${r.durasi}"`,
      r.modal,
      r.harga,
      r.status
    ];
    csvRows.push(row.join(","));
  });

  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Data_Sales_Saisoku_${isoToday()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast show";
  setTimeout(() => t.className = "toast", 3000);
}
