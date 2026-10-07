// ==================== KONFIGURASI ====================
const SHEET_NAME = "Booking";

function doGet() {
  return ContentService
    .createTextOutput("Sudut Camp Rental API aktif")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Data booking tidak ditemukan.");
    }

    const data = JSON.parse(e.postData.contents);

    if (!data.nama || !data.wa || !data.mulai || !data.kembali || !data.items || !data.items.length) {
      throw new Error("Data booking belum lengkap.");
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    // Pastikan kolom Spreadsheet TIDAK menyimpan nama/detail alat.
    // Jika versi lama masih memiliki kolom "Alat", hapus kolom tersebut.
    const lastColumn = sheet.getLastColumn();
    if (lastColumn > 0) {
      const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
      const alatIndex = headers.findIndex(function(header) {
        return String(header).trim().toLowerCase() === "alat";
      });
      if (alatIndex !== -1) {
        sheet.deleteColumn(alatIndex + 1);
      }
    }

    const headersSekarang = sheet.getLastColumn() > 0
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      : [];

    const headersWajib = [
      "No Booking", "Waktu Booking", "Nama", "WhatsApp",
      "Tanggal Mulai", "Tanggal Kembali", "Durasi", "Total"
    ];

    const headerSesuai = headersSekarang.length === headersWajib.length &&
      headersWajib.every(function(header, index) {
        return String(headersSekarang[index]).trim() === header;
      });

    if (!headerSesuai) {
      sheet.getRange(1, 1, 1, headersWajib.length).setValues([headersWajib]);
      sheet.getRange(1, 1, 1, headersWajib.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    const sekarang = new Date();
    const noBooking = "SCR-" + Utilities.formatDate(sekarang, "Asia/Jakarta", "yyyyMMdd-HHmmss");
    const waktuBooking = Utilities.formatDate(sekarang, "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss");

    // Hanya data booking umum yang disimpan ke Spreadsheet.
    // Data alat tetap dipakai website untuk menghitung total, tetapi tidak dikirim sebagai kolom alat.
    sheet.appendRow([
      noBooking,
      waktuBooking,
      data.nama,
      data.wa,
      data.mulai,
      data.kembali,
      data.durasi + " hari",
      Number(data.total)
    ]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 8).setNumberFormat('"Rp"#,##0');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      nomorBooking: noBooking,
      message: "Booking berhasil disimpan. Detail alat tidak disimpan di Google Spreadsheet."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
