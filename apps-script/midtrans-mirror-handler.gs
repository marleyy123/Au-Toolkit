// ==============================================================
// TAMBAHAN di doPost() — handle mirrorFirestorePurchase dari Midtrans webhook
// Paste bagian ini ke dalam blok doPost() yang sudah ada,
// di bawah baris: const action = String(payload.action || ...).trim();
//
// Atau jika lebih mudah, tambahkan fungsi terpisah ini dan panggil dari doPost()
// ==============================================================

// Tambahkan ke dalam doPost(), setelah cek action:
//
//   if (action === 'mirrorFirestorePurchase' || action === 'ingestPayment') {
//     return handleMidtransMirror_(payload);
//   }

function handleMidtransMirror_(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return jsonReply_({ success: false, reason: 'SHEET_NOT_FOUND' });

    // Ambil data dari payload
    // Webhook kirim: { action, serverSecret, purchase: {...}, account: {...} }
    const purchase = payload.purchase || {};
    const account  = payload.account  || {};

    const email = String(purchase.email || account.email || '').trim().toLowerCase();
    const ref   = String(purchase.ref   || account.ref   || '').trim();
    const name  = String(purchase.name  || account.buyerName || '').trim();

    if (!email || !ref) {
      return jsonReply_({ success: false, reason: 'EMAIL_OR_REF_MISSING' });
    }

    // Hitung tanggal
    const accessDays = Number(purchase.accessDays || account.accessDays || 30);
    const purchasedAt = purchase.purchasedAt || account.purchaseDate || new Date().toISOString();
    const pDate = new Date(purchasedAt);
    const pDateStr = Utilities.formatDate(pDate, CONFIG.TIMEZONE, 'dd-MM-yyyy HH:mm');

    const expDate = new Date(pDate.getTime());
    expDate.setDate(expDate.getDate() + accessDays);
    const expStr = Utilities.formatDate(expDate, CONFIG.TIMEZONE, 'yyyy-MM-dd');

    // Cek apakah email sudah ada di sheet
    const data = sheet.getDataRange().getValues();
    let existingRow = -1;
    let existingRef = '';

    for (let i = 1; i < data.length; i++) {
      const rowEmail = String(data[i][0] || '').trim().toLowerCase();
      if (rowEmail === email) {
        existingRow = i + 1; // 1-based
        existingRef = String(data[i][1] || '').trim();
        break;
      }
    }

    if (existingRow === -1) {
      // Email belum ada → append baris baru
      sheet.appendRow([
        email, ref, name, pDateStr, expStr, 'Active',
        '', '', '', '', 'midtrans', 'Midtrans'
      ]);
      SpreadsheetApp.flush();
      return jsonReply_({ success: true, action: 'inserted', email: email });
    } else {
      // Email sudah ada, cek apakah ref beda (perpanjangan)
      if (existingRef !== ref) {
        // Perpanjang: hitung expiry dari expiry lama
        const currentExpRaw = sheet.getRange(existingRow, 5).getValue();
        const currentExp = currentExpRaw ? new Date(String(currentExpRaw)) : null;

        let finalExpStr = expStr;
        if (currentExp && !isNaN(currentExp.getTime()) && currentExp.getTime() > pDate.getTime()) {
          // Tambahkan accessDays dari tanggal expiry lama
          currentExp.setDate(currentExp.getDate() + accessDays);
          finalExpStr = Utilities.formatDate(currentExp, CONFIG.TIMEZONE, 'yyyy-MM-dd');
        }

        sheet.getRange(existingRow, 2).setValue(ref);
        sheet.getRange(existingRow, 4).setValue(pDateStr);
        sheet.getRange(existingRow, 5).setValue(finalExpStr);
        sheet.getRange(existingRow, 6).setValue('Active');
        SpreadsheetApp.flush();
        return jsonReply_({ success: true, action: 'extended', email: email, newExpiry: finalExpStr });
      } else {
        // Ref sama, sudah pernah diproses
        return jsonReply_({ success: true, action: 'skipped_duplicate', email: email });
      }
    }
  } catch (err) {
    return jsonReply_({ success: false, reason: 'MIRROR_ERROR', message: err.toString() });
  }
}
