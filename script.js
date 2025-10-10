// script.js — SAISOKU Dashboard (v1.3) — includes robust Reset handler
document.addEventListener("DOMContentLoaded", () => {
  // ===== Config =====
  const SHEET_URL = "/.netlify/functions/proxy"; // ganti kalau perlu

  // ===== Elements =====
  const addBtn = document.getElementById("addBtn");
  const resetBtnForm = document.getElementById("resetBtnForm");
  const tableBody = document.getElementById("tableBody");
  const totalModal = document.getElementById("totalModal");
  const totalProfit = document.getElementById("totalProfit");
  const totalCust = document.getElementById("totalCust");
  const filterProduk = document.getElementById("filterProduk");
  const exportBtn = document.getElementById("exportBtn");
  const toastEl = document.getElementById("toast");

  let data = [];

  // ===== Utility helpers =====
  const qs = (id) => document.getElementById(id);
  const esc = (s) =>
    (s || "")
      .toString()
      .replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ===== Toast helper =====
  function toast(message, ok = true, ms = 2200) {
    if (!toastEl) {
      alert(message);
      return;
    }
    toastEl.className = ok ? "toast ok" : "toast err";
    toastEl.textContent = message;
    toastEl.style.opacity = "1";
    toastEl.style.transform = "translateY(0)";
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => {
      toastEl.style.opacity = "0";
      toastEl.style.transform = "translateY(6px)";
    }, ms);
  }

  // ===== Clear / Reset form =====
  function clearForm() {
    const ids = ["nama","wa","katalog","akun","password","profile","device","tglBeli","durasi","statusBuyer","modal","harga"];
    ids.forEach((id) => {
      const el = qs(id);
      if (!el) return;
      if (el.tagName === "SELECT") el.selectedIndex = 0;
      else el.value = "";
    });
    const first = qs("nama");
    if (first) first.focus();
  }

  // expose for console/testing
  window._saisoku_clearForm = clearForm;
  window._saisoku_toast = toast;

  // ===== Add (POST) =====
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      addBtn.disabled = true;
      addBtn.classList.add("loading");

      const payload = {
        nama: qs("nama")?.value.trim() || "",
        wa: qs("wa")?.value.trim() || "",
        katalog: qs("katalog")?.value.trim() || "",
        akun: qs("akun")?.value.trim() || "",
        password: qs("password")?.value.trim() || "",
        profile: qs("profile")?.value.trim() || "",
        device: qs("device")?.value || "All",
        tglBeli: qs("tglBeli")?.value || "",
        durasi: qs("durasi")?.value.trim() || "",
        statusBuyer: qs("statusBuyer")?.value || "Reguler",
        modal: qs("modal")?.value || 0,
        harga: qs("harga")?.value || 0,
        profit: (Number(qs("harga")?.value) || 0) - (Number(qs("modal")?.value) || 0)
      };

      if (!payload.nama || !payload.katalog || !payload.tglBeli) {
        toast("Lengkapi Nama / Produk / Tanggal Beli", false);
        addBtn.disabled = false;
        addBtn.classList.remove("loading");
        return;
      }

      try {
        const res = await fetch(SHEET_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        if (text.trim() === "OK") {
          toast("✅ Data berhasil disimpan", true);
          clearForm();
          await loadData();
        } else {
          console.warn("POST result:", text);
          toast("⚠️ Gagal menyimpan: " + text.replace(/\n/g,' '), false);
        }
      } catch (err) {
        console.error("POST error:", err);
        toast("❌ Gagal konek ke server. Periksa proxy/URL.", false);
      } finally {
        addBtn.disabled = false;
        addBtn.classList.remove("loading");
      }
    });
  }

  // ===== Robust Reset handler (delegation + direct attach) =====
  // Delegation: catches clicks even if button added later / overlay issues
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest && ev.target.closest("#resetBtnForm");
    if (btn) {
      ev.preventDefault();
      try {
        clearForm();
        toast("Form dikosongkan");
      } catch (err) {
        console.error("Reset handler error:", err);
        toast("Error saat mereset form", false);
      }
    }
  });

  // Direct attach (redundant but safe)
  if (resetBtnForm) {
    resetBtnForm.addEventListener("click", (e) => {
      e.preventDefault();
      try {
        clearForm();
        toast("Form dikosongkan");
      } catch (err) {
        console.error("Direct reset error:", err);
        toast("Error saat mereset form", false);
      }
    });
  }

  // ===== Load data (GET) =====
  async function loadData() {
    try {
      const res = await fetch(SHEET_URL, { method: "GET" });
      const rows = await res.json();
      if (!Array.isArray(rows)) {
        console.error("Invalid format", rows);
        toast("Data dari server tidak valid", false);
        return;
      }

      data = rows.slice(1).map((r, idx) => ({
        id: idx + 1,
        nama: r[1],
        wa: r[2],
        katalog: r[3],
        akun: r[4],
        password: r[5],
        profile: r[6],
        device: r[7],
        tglBeli: r[8],
        durasi: r[9],
        statusBuyer: r[10],
        modal: Number(r[11]) || 0,
        harga: Number(r[12]) || 0,
        profit: Number(r[13]) || 0
      }));
      renderTable();
    } catch (err) {
      console.error("LoadData error:", err);
      toast("Gagal memuat data. Lihat console.", false);
    }
  }

  // ===== Render table =====
  function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    let totalM = 0, totalP = 0;
    const filter = filterProduk?.value || "";

    data.forEach((r, i) => {
      if (filter && r.katalog !== filter) return;
      const buyDate = r.tglBeli ? new Date(r.tglBeli) : null;
      const diffDays = buyDate ? Math.floor((Date.now() - buyDate.getTime()) / (1000 * 60 * 60 * 24)) : 9999;
      const dur = parseInt(r.durasi) || 30;
      const status = (diffDays <= dur) ? "Aktif" : "Expired";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${esc(r.nama)}</td>
        <td>${esc(r.katalog)}</td>
        <td>${r.tglBeli || "-"}</td>
        <td>${r.durasi || "-"}</td>
        <td>Rp ${r.modal.toLocaleString()}</td>
        <td>Rp ${r.harga.toLocaleString()}</td>
        <td>Rp ${r.profit.toLocaleString()}</td>
        <td class="${status === "Aktif" ? "status-active" : "status-expired"}">${status}</td>
        <td><button class="btn small" onclick="copyDetail('${(r.nama||'').replace(/'/g,\"\\\\'\")}','${(r.katalog||'').replace(/'/g,\"\\\\'\")}','${(r.tglBeli||'').replace(/'/g,\"\\\\'\")}','${(r.durasi||'').replace(/'/g,\"\\\\'\")}','${r.harga}')">Copy</button></td>
      `;
      tableBody.appendChild(tr);
      totalM += r.modal;
      totalP += r.profit;
    });

    if (totalModal) totalModal.textContent = "Rp " + totalM.toLocaleString();
    if (totalProfit) totalProfit.textContent = "Rp " + totalP.toLocaleString();
    if (totalCust) totalCust.textContent = data.length;

    // populate filterProduk options once
    if (filterProduk && filterProduk.children.length <= 1) {
      const uniques = Array.from(new Set(data.map(d => d.katalog).filter(Boolean)));
      uniques.forEach(k => {
        const opt = document.createElement("option");
        opt.value = k; opt.textContent = k;
        filterProduk.appendChild(opt);
      });
    }
  }

  // ===== copyDetail (global) =====
  window.copyDetail = (nama, katalog, tgl, durasi, harga) => {
    const text = `🧾 DETAIL ORDER\nNama: ${nama}\nProduk: ${katalog}\nTanggal: ${tgl}\nDurasi: ${durasi} Hari\nHarga: Rp ${Number(harga).toLocaleString()}`;
    navigator.clipboard.writeText(text).then(() => toast("✅ Detail disalin"), () => toast("❌ Gagal menyalin", false));
  };

  // ===== export csv =====
  exportBtn?.addEventListener("click", () => {
    const csvArr = [
      ["No","Nama","Produk","Tanggal","Durasi","Modal","Harga","Profit"],
      ...data.map((r, i) => [i + 1, r.nama, r.katalog, r.tglBeli, r.durasi, r.modal, r.harga, r.profit])
    ];
    const csv = csvArr.map(row => row.map(cell => `"${(cell||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "saisoku-dashboard.csv";
    a.click();
  });

  // ===== manual reset button (already handled but keep attach) =====
  if (resetBtnForm) {
    resetBtnForm.addEventListener("click", (e) => {
      e.preventDefault();
      clearForm();
      toast("Form dikosongkan");
    });
  }

  // ===== filter change =====
  filterProduk?.addEventListener("change", renderTable);

  // ===== init =====
  const yearEl = qs("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  loadData();
});
