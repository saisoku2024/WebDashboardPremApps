// === Saisoku Dashboard v3.0 (Proxy Mode) ===
document.addEventListener("DOMContentLoaded", () => {
  const SHEET_URL = "https://webdashboardpremapps.netlify.app/api/proxy";

  const addBtn = document.getElementById("addBtn");
  const tableBody = document.getElementById("tableBody");
  const totalModal = document.getElementById("totalModal");
  const totalProfit = document.getElementById("totalProfit");
  const totalCust = document.getElementById("totalCust");
  const filterProduk = document.getElementById("filterProduk");
  const exportBtn = document.getElementById("exportBtn");
  const year = document.getElementById("year");

  year.textContent = new Date().getFullYear();
  let data = [];

  addBtn.addEventListener("click", async () => {
    const row = {
      nama: nama.value,
      wa: wa.value,
      katalog: katalog.value,
      akun: akun.value,
      password: password.value,
      device: device.value,
      tglBeli: tglBeli.value,
      durasi: durasi.value,
      statusBuyer: statusBuyer.value,
      modal: modal.value,
      harga: harga.value,
      profit: (Number(harga.value) || 0) - (Number(modal.value) || 0),
    };

    if (!row.nama || !row.katalog) return alert("Lengkapi data utama dulu!");

    const res = await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
    const text = await res.text();
    if (text === "OK") {
      alert("✅ Data berhasil disimpan!");
      loadData();
    } else {
      alert("⚠️ Gagal simpan: " + text);
    }
  });

  async function loadData() {
    const res = await fetch(SHEET_URL);
    const rows = await res.json();
    data = rows.slice(1).map(r => ({
      nama: r[1], katalog: r[3], tglBeli: r[7],
      durasi: r[8], modal: +r[10]||0, harga: +r[11]||0, profit: +r[12]||0
    }));
    renderTable();
  }

  function renderTable() {
    tableBody.innerHTML = "";
    let totalM = 0, totalP = 0;
    const today = new Date();
    data.forEach((r, i) => {
      const status = ((today - new Date(r.tglBeli)) / 86400000 <= +r.durasi) ? "Aktif" : "Expired";
      tableBody.innerHTML += `
        <tr>
          <td>${i + 1}</td><td>${r.nama}</td><td>${r.katalog}</td>
          <td>${r.tglBeli}</td><td>${r.durasi}</td>
          <td>Rp ${r.modal.toLocaleString()}</td>
          <td>Rp ${r.harga.toLocaleString()}</td>
          <td>Rp ${r.profit.toLocaleString()}</td>
          <td class="${status==='Aktif'?'status-active':'status-expired'}">${status}</td>
        </tr>`;
      totalM += r.modal; totalP += r.profit;
    });
    totalModal.textContent = "Rp " + totalM.toLocaleString();
    totalProfit.textContent = "Rp " + totalP.toLocaleString();
    totalCust.textContent = data.length;
  }

  exportBtn.addEventListener("click", () => {
    const csv = [["No","Nama","Produk","Tanggal","Durasi","Modal","Harga","Profit"],
      ...data.map((r,i)=>[i+1,r.nama,r.katalog,r.tglBeli,r.durasi,r.modal,r.harga,r.profit])];
    const blob = new Blob([csv.map(e=>e.join(",")).join("\n")], { type:"text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "saisoku-dashboard.csv";
    a.click();
  });

  loadData();
});
