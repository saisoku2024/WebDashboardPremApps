// === SAISOKU Web Dashboard Premium Apps ===
// Version: v1.5 (CORS Fix + JSON Response + OPTIONS + Auto Timestamp)
// Author: SIVA · saisoku.id

const SHEET_ID = "1G-it-zMhd_MZvlHb27Vy7Bj-24GNtzIN5xVk5FpbFwA";
const SHEET_NAME = "Tracker_Data";

// Tentukan domain yang diizinkan. Gunakan '*' untuk mengizinkan semua domain.
// Jika ingin lebih aman, ganti dengan domain GitHub Pages Anda, misalnya: "https://saisoku2024.github.io"
const ALLOWED_ORIGIN = "*"; 

// Fungsi pembantu untuk mengatur respons JSON dan CORS yang benar
function setCorsResponse(data, status = ContentService.MimeType.JSON) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(status)
                       .setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
                       .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

// Fungsi pembantu untuk respons Teks (OK)
function setPlainTextResponse(text) {
  return ContentService.createTextOutput(text)
                       .setMimeType(ContentService.MimeType.TEXT)
                       .setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
                       .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}


// === OPTIONS Handler (Mengizinkan Preflight CORS) ===
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Penting untuk POST JSON
}

// === GET: Ambil semua data dari Sheet ===
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);
    const data = sh.getDataRange().getValues();
    
    // Mengembalikan data sebagai array (termasuk header)
    return setCorsResponse(data); 
    
  } catch (err) {
    // Mengembalikan error dalam format JSON
    return setCorsResponse({ status: "ERROR", message: err.message });
  }
}

// === POST: Tambah 1 baris data baru dari Web App ===
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("No valid POST data received");
    }

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME);

    // Parse data dari JSON body
    let data;
    try {
        data = JSON.parse(e.postData.contents);
    } catch(err) {
        throw new Error("Invalid JSON format in POST body");
    }

    // Memastikan urutan kolom sesuai dengan struktur Sheet
    sh.appendRow([
      new Date(),              // 1. Timestamp otomatis
      data.nama || "",        // 2. nama
      data.wa || "",          // 3. wa
      data.katalog || "",     // 4. katalog
      data.akun || "",        // 5. akun
      data.password || "",    // 6. password
      data.device || "",      // 7. device
      data.tglBeli || "",     // 8. tglBeli
      data.durasi || "",      // 9. durasi
      data.statusBuyer || "", // 10. statusBuyer
      data.modal || "",       // 11. modal
      data.harga || "",       // 12. harga
      data.profit || ""       // 13. profit
    ]);

    // MENGEMBALIKAN TEKS POLOS "OK" agar sesuai dengan logika klien yang lama
    return setPlainTextResponse("OK");
    
  } catch (err) {
    // Untuk error, tetap kembalikan JSON agar klien bisa tahu detail errornya
    return setCorsResponse({ status: "ERROR", message: err.message });
  }
}
