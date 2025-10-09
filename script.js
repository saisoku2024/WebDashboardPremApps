// === Saisoku Dashboard v1.0 Lite ===
// Connected to Google Sheets – by SIVA SAISOKU.ID

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const tableBody = document.getElementById("tableBody");
  const totalModal = document.getElementById("totalModal");
  const totalProfit = document.getElementById("totalProfit");
  const totalCust = document.getElementById("totalCust");
  const filterProduk = document.getElementById("filterProduk");
  const exportBtn = document.getElementById("exportBtn");

  const SHEET_URL = "https://script.google.com/macros/s/AKfycbznz80LfStO623g_Hh0aAcEopnLbgXT2ZCsxoHOlkNYxNIwChZEUevkzbOyeDGfuAYL/exec";
  let data = [];

  // === POST: Kirim data ke Google Sheets ===
  addBtn.addEventListener("click", async () => {
    const row = {
      nama: document.getElementById("nama").value.trim(),
      wa: document.getElementById("wa").value.trim(),
      katalog: document.getElementById("katalog").value.trim(),
      akun: document.getElementById("akun").value.trim(),
      password: document.getElementById("password").value.trim(),
      device: document.getElementById("device").value,
      tglBeli: document.getElementById("tglBeli").value,
      durasi: document.getElementById("durasi").value.trim(),
      statusBuyer: document.getElementById("statusBuyer").value,
      modal: document.getElementById("modal").value,
      harga: document.getElementById("harga").value,
      profit: (Number(document.getElementById("harga").value) || 0) - (Number(document.getElementById("modal").value) || 0),
    };

    if (!row.nama || !row.katalog || !row.tglBeli) {
      alert("⚠️ Lengkapi data utama terlebih dahulu!");
      return;
    }

    try {
      const res = await fetch(SHEET_URL, {
        method: "POST",
        body: JSON.stringify(row),
        headers: { "Content-Type": "application/json" },
      });
      const text = await res.text();
      if (text === "OK") {
        alert("✅ Data berhasil dikirim ke Google Sheets!");
        clearForm();
        await loadData();
      } else {
        alert("⚠️ Gagal menyimpan data. Periksa izin akses Apps Script.");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Gagal konek ke server. Periksa URL Web App atau koneksi internet.");
    }
  });

  // === GET: Ambil data dari Sheets ===
  async function loadData() {
    try {
      const res = await fetch(SHEET_URL);
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error("Invalid data format");

      // Lewati header (index 0)
      data = rows.slice(1).map(r => ({
        nama: r[1],
        wa: r[2],
        katalog: r[3],
        akun: r[4],
        password: r[5],
        device: r[6],
        tglBeli: r[7],
        durasi: r[8],
        statusBuyer: r[9],
        modal: Number(r[10]) || 0,
        harga: Number(r[11]) || 0,
        profit: Number(r[12]) || 0,
      }));

      renderTable();
    } catch (err) {
      console.error("Load error:", err);
    }
  }

  // === RENDER TABEL ===
  function renderTable() {
    tableBody.innerHTML = "";
    let totalM = 0, totalP = 0;
    const filterVal = filterProduk.value;
    const today = new Date();

    const filtered = data.filter(r => !filterVal || r.katalog === filterVal);

    filtered.forEach((r, i) => {
      const buyDate = new Date(r.tglBeli);
      const diff = (today - buyDate) / (1000 * 60 * 60 * 24);
      const durasiNum = parseInt(r.durasi) || 30;
      const status = diff <= durasiNum ? "Aktif" : "Expired";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.nama}</td>
        <td>${r.katalog}</td>
        <td>${r.tglBeli}</td>
        <td>${r.durasi}</td>
        <td>Rp ${r.modal.toLocaleString()}</td>
        <td>Rp ${r.harga.toLocaleString()}</td>
        <td>Rp ${r.profit.toLocaleString()}</td>
        <td class="${status === "Aktif" ? "status-active" : "status-expired"}">${status}</td>
        <td><button class="btn small" onclick="copyDetail('${r.nama}','${r.katalog}','${r.tglBeli}','${r.durasi}','${r.harga}')">Copy</button></td>
      `;
      tableBody.appendChild(row);

      totalM += r.modal;
      totalP += r.profit;
    });

    totalModal.textContent = "Rp " + totalM.toLocaleString();
    totalProfit.textContent = "Rp " + totalP.toLocaleString();
    totalCust.textContent = filtered.length;
  }

  // === COPY DETAIL KE CLIPBOARD ===
  window.copyDetail = (nama, katalog, tgl, durasi, harga) => {
    const text = `🧾 *DETAIL PESANAN*\nNama: ${nama}\nProduk: ${katalog}\nTanggal Beli: ${tgl}\nDurasi: ${durasi} Hari\nHarga: Rp ${Number(harga).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    alert("✅ Detail disalin ke clipboard!");
  };

  // === CLEAR FORM ===
  function clearForm() {
    document.querySelectorAll("input, select").forEach(el => el.value = "");
  }

  // === EXPORT CSV ===
  exportBtn.addEventListener("click", () => {
    const csv = [
      ["No","Nama","Produk","Tanggal","Durasi","Modal","Harga","Profit"],
      ...data.map((r,i) => [i+1, r.nama, r.katalog, r.tglBeli, r.durasi, r.modal, r.harga, r.profit])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "saisoku-dashboard.csv";
    a.click();
  });

  // === FILTER PRODUK ===
  filterProduk.addEventListener("change", renderTable);

  // === INIT ===
  document.getElementById("year").textContent = new Date().getFullYear();
  loadData();
});
