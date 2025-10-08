document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addBtn");
  const tableBody = document.getElementById("tableBody");
  const totalModal = document.getElementById("totalModal");
  const totalProfit = document.getElementById("totalProfit");
  const totalCust = document.getElementById("totalCust");

  let data = [];

  addBtn.addEventListener("click", () => {
    const nama = document.getElementById("nama").value;
    const katalog = document.getElementById("katalog").value;
    const tgl = document.getElementById("tglBeli").value;
    const durasi = document.getElementById("durasi").value;
    const modal = Number(document.getElementById("modal").value) || 0;
    const harga = Number(document.getElementById("harga").value) || 0;
    const profit = harga - modal;

    if (!nama || !katalog || !tgl || !durasi) return alert("Lengkapi data utama dulu!");

    const today = new Date();
    const buyDate = new Date(tgl);
    const diff = (today - buyDate) / (1000 * 60 * 60 * 24);
    const status = diff <= parseInt(durasi) ? "Aktif" : "Expired";

    data.push({ nama, katalog, tgl, durasi, modal, harga, profit, status });
    renderTable();
  });

  function renderTable() {
    tableBody.innerHTML = "";
    let totalM = 0, totalP = 0;

    data.forEach((r) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.nama}</td>
        <td>${r.katalog}</td>
        <td>${r.tgl}</td>
        <td>${r.durasi}</td>
        <td>Rp ${r.modal.toLocaleString()}</td>
        <td>Rp ${r.harga.toLocaleString()}</td>
        <td>Rp ${r.profit.toLocaleString()}</td>
        <td class="${r.status === "Aktif" ? "status-active" : "status-expired"}">${r.status}</td>
        <td><button class="btn small" onclick="copyDetail('${r.nama}','${r.katalog}','${r.tgl}','${r.durasi}','${r.harga}')">Copy</button></td>
      `;
      tableBody.appendChild(row);
      totalM += r.modal;
      totalP += r.profit;
    });

    totalModal.textContent = "Rp " + totalM.toLocaleString();
    totalProfit.textContent = "Rp " + totalP.toLocaleString();
    totalCust.textContent = data.length;
  }

  window.copyDetail = (nama, katalog, tgl, durasi, harga) => {
    const text = `🧾 *DETAIL LANGGANAN*\nNama: ${nama}\nProduk: ${katalog}\nTanggal Beli: ${tgl}\nDurasi: ${durasi}\nHarga: Rp ${Number(harga).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    alert("Detail disalin ke clipboard!");
  };
});
