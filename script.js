<script>
/* ===============================
   SAISOKU DASHBOARD - CLEAN BUILD
   Fitur:
   - Input transaksi
   - List data Supabase
   - Tambah produk baru
   - Filter + Search
================================= */

// === SUPABASE CONFIG ===
const supabaseUrl = "https://dqvmcpbxdkybnsnxpaqx.supabase.co";
const supabaseKey = "sb_publishable_wS5kxHmPN6jvZDxusUygTg_AquncKRI";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

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
function sortCatalog(list){
  return Array.from(new Set(list)).sort((a,b)=>a.localeCompare(b));
}
CATALOG_LIST = sortCatalog(CATALOG_LIST);

function parseNumber(v){
  return Number(String(v||0).replace(/[^\d]/g,'')) || 0;
}

function formatRupiah(n){
  return "Rp " + (Number(n)||0).toLocaleString("id-ID");
}

function isoToday(){
  return new Date().toISOString().slice(0,10);
}

// === DOM READY ===
document.addEventListener("DOMContentLoaded", () => {

  const $ = id => document.getElementById(id);

  const form = $("entryForm");
  const tableBody = $("tableBody");
  const katalogSel = $("katalog");
  const filterSel = $("filterProduk");
  const searchInput = $("searchInput");
  const toastEl = $("toast");

  // =========================
  // TOAST
  // =========================
  function showToast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(()=>toastEl.classList.remove("show"),2000);
  }

  // =========================
  // POPULATE PRODUK SELECT
  // =========================
  function populateCatalog(){
    katalogSel.innerHTML = `<option value="">Pilih Produk</option>`;
    filterSel.innerHTML = `<option value="">Semua Produk</option>`;

    CATALOG_LIST.forEach(p=>{
      katalogSel.innerHTML += `<option value="${p}">${p}</option>`;
      filterSel.innerHTML += `<option value="${p}">${p}</option>`;
    });
  }

  populateCatalog();

  // =========================
  // FETCH DATA FROM SUPABASE
  // =========================
  async function fetchData(){
    const { data, error } = await supabaseClient
      .from("sales")
      .select("*")
      .order("created_at",{ascending:false});

    if(error){
      console.error(error);
      showToast("Gagal load data");
      return [];
    }
    return data || [];
  }

  // =========================
  // RENDER TABLE
  // =========================
  async function render(){
    const filtro = filterSel.value;
    const q = searchInput.value.toLowerCase();

    const all = await fetchData();

    let rows = all.filter(r=>{
      if(filtro && r.produk !== filtro) return false;
      if(q && !(`${r.nama} ${r.wa}`).toLowerCase().includes(q)) return false;
      return true;
    });

    tableBody.innerHTML = "";

    if(!rows.length){
      tableBody.innerHTML = `<tr>
        <td colspan="10" class="empty-state">Belum ada transaksi</td>
      </tr>`;
      return;
    }

    rows.slice(0,15).forEach((row,idx)=>{
      const profit = parseNumber(row.harga) - parseNumber(row.modal);

      tableBody.innerHTML += `
        <tr>
          <td>${row.nama}</td>
          <td>${row.produk}</td>
          <td>${row.tanggal_beli||"-"}</td>
          <td>-</td>
          <td>${row.durasi}</td>
          <td style="text-align:right">${formatRupiah(row.modal)}</td>
          <td style="text-align:right">${formatRupiah(row.harga)}</td>
          <td style="text-align:right">${formatRupiah(profit)}</td>
          <td>${row.status||"Reguler"}</td>
          <td>
            <button class="action-btn outline-danger" data-id="${row.id}">Hapus</button>
          </td>
        </tr>
      `;
    });
  }

  // =========================
  // SUBMIT FORM
  // =========================
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const entry = {
      nama: $("nama").value.trim(),
      wa: $("wa").value.trim(),
      produk: katalogSel.value,
      akun: $("akun").value,
      device: $("device").value,
      tanggal_beli: $("tglBeli").value || isoToday(),
      durasi: $("durasi").value,
      modal: parseNumber($("modal").value),
      harga: parseNumber($("harga").value),
      status: $("statusBuyer").value
    };

    if(!entry.nama || !entry.wa || !entry.produk){
      showToast("Lengkapi data wajib");
      return;
    }

    const { error } = await supabaseClient.from("sales").insert([entry]);

    if(error){
      console.error(error);
      showToast("Gagal simpan data");
      return;
    }

    form.reset();
    showToast("Data berhasil ditambahkan");
    render();
  });

  // =========================
  // DELETE DATA
  // =========================
  tableBody.addEventListener("click", async e=>{
    if(!e.target.dataset.id) return;
    if(!confirm("Hapus transaksi?")) return;

    await supabaseClient
      .from("sales")
      .delete()
      .eq("id", e.target.dataset.id);

    render();
  });

  // =========================
  // SEARCH + FILTER
  // =========================
  searchInput.addEventListener("input", render);
  filterSel.addEventListener("change", render);

  // =========================
  // ADD PRODUK BARU
  // =========================
  document.getElementById("addCatalogBtn").addEventListener("click", ()=>{
    const val = document.getElementById("newCatalogInput").value.trim();
    if(!val) return;

    if(CATALOG_LIST.includes(val)){
      showToast("Produk sudah ada");
      return;
    }

    CATALOG_LIST.push(val);
    CATALOG_LIST = sortCatalog(CATALOG_LIST);
    populateCatalog();
    document.getElementById("newCatalogInput").value="";
    showToast("Produk ditambahkan");
  });

  // INIT
  render();
});
</script>
