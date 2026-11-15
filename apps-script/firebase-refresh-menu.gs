// ==============================================================
// UPDATE onOpen() — tambahkan menu Firebase Refresh
// Ganti fungsi onOpen() yang ada di Code.gs / au-toolkit-access.gs
// dengan versi ini, atau merge item-nya.
// ==============================================================

function onOpen() {
  SpreadsheetApp.getUi().createMenu('AU Admin')
    // ── Firebase Real Refresh ──────────────────────────────────
    .addItem('Refresh Firebase (Email Terpilih)', 'refreshFromFirebase')
    .addItem('Refresh Firebase (Semua Baris)', 'refreshFirebaseForAllRows')
    .addItem('Setup Kredensial Firebase', 'setupFirebaseCredentials')
    .addItem('Debug: Cek Format Key Firebase', 'debugFirebaseKey')
    .addSeparator()
    // ── Lynk.id ───────────────────────────────────────────────
    .addItem('Tarik Transaksi Lynk.id Sekarang', 'manualSyncLynk')
    .addItem('Pasang Trigger Otomatis Lynk (Tiap 5 Menit)', 'installLynkSyncTrigger')
    .addSeparator()
    // ── Device Reset ──────────────────────────────────────────
    .addItem('Reset HP Pelanggan', 'adminResetPhone')
    .addItem('Reset Laptop Pelanggan', 'adminResetLaptop')
    .addItem('Reset Kedua Device', 'adminResetBoth')
    .addSeparator()
    // ── Status ────────────────────────────────────────────────
    .addItem('Set Status Active', 'adminSetActive')
    .addItem('Set Status Inactive (Blokir)', 'adminSetInactive')
    .addSeparator()
    // ── Utility ───────────────────────────────────────────────
    .addItem('Rapikan Format Tanggal', 'rapikanFormatTanggal')
    .addToUi();
}
