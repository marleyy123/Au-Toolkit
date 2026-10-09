# Akses Firestore dan Pengelolaan Spreadsheet (Staging)

Backend Firestore diaktifkan melalui `ACCESS_BACKEND=firestore`. Tanpa variabel
ini, staging tetap memakai backend spreadsheet yang sudah ada. Endpoint Netlify
dan Apps Script produksi tidak diubah.

## Sumber Utama Data

```text
Lynk -> webhook Vercel dengan validasi signature -> Firestore -> laporan spreadsheet
Firebase Auth -> verifikasi akses di Vercel -> Firestore
Menu admin AU Access -> API admin Vercel dengan autentikasi -> Firestore
```

- `billingPurchases/{ref}` menyimpan identitas transaksi sukses, email, nama
  pembeli, produk, jumlah barang, nominal, mata uang, waktu pembelian, sumber,
  dan status sinkronisasi laporan.
- `billingAccounts/{sha256(normalizedEmail)}` menyimpan langganan saat ini,
  UID Firebase setelah login pertama yang terverifikasi, dua slot perangkat,
  dan nomor revisi data.
- `billingAdminAudit/{commandId}` menyimpan data sebelum dan sesudah perubahan
  yang dilakukan administrator.
- Konten editor dan salinan data perangkat dari aplikasi tetap di `users/{uid}`.
  Data profil/perangkat yang ditulis aplikasi bukan dasar pemberian akses
  berlangganan.

Rules staging menolak seluruh akses langsung dari browser ke koleksi tersebut.
Admin SDK di server memakai service account khusus project
`au-toolkit-staging-20261005`. Jangan menaruh credential di variabel `VITE_`,
sel spreadsheet, Git, atau chat.

Masa akses dihitung dari tanggal pembelian + 30 hari kalender, memakai zona
waktu Asia/Jakarta. Akses berakhir pada awal tanggal kedaluwarsa: pembelian
10 Oktober dengan kedaluwarsa 9 November menampilkan sisa 30 hari pada hari
pembelian, lalu berakhir pukul 00.00 WIB tanggal 9 November. Pembelian baru
mempertahankan slot perangkat dan blokir dari admin. Pengiriman ulang transaksi
lama tidak dapat menggantikan langganan dari pembelian yang lebih baru.
Email Firebase yang terverifikasi harus sama dengan email checkout. Akun
dikaitkan dengan UID pada verifikasi pertama. Jika akun Authentication dibuat
ulang dengan UID baru, perlu migrasi oleh administrator di server; reset
perangkat lewat spreadsheet saja tidak mengganti UID akun.

## Deployment dan Migrasi

Lakukan langkah ini hanya di `au-toolkit-testing`. Pergantian backend merupakan
proses pemeliharaan staging: selesaikan impor sebelum menguji login pembeli
yang sudah terdaftar.

1. Deploy perubahan branch `development` ke Vercel testing dengan variabel
   environment yang sudah ada.
2. Buka Firebase staging, lalu **Project Settings > Service accounts**.
   Buat/unduh JSON service account secara privat. Masukkan seluruh isi JSON ke
   variabel Vercel khusus server `FIREBASE_ADMIN_SERVICE_ACCOUNT`. Project ID
   dan email service account harus milik project staging. Backend memakai
   database Firestore `(default)`.
3. Pertahankan variabel `APPS_SCRIPT_SHARED_SECRET`, `GOOGLE_SHEETS_SCRIPT_URL`,
   `LYNK_MERCHANT_KEY`, dan `LYNK_TEST_PRODUCT_UUID` yang sudah ada. UUID produk
   TEST yang diizinkan tetap
   `6ac7974f231dbec1e86e7926-4778-9122419287-1791465295969`.
   Pertahankan juga Script Properties Apps Script: `API_SHARED_SECRET` dan
   `LYNK_TEST_PRODUCT_UUID`, dengan nilai yang cocok dengan Vercel.
4. Ganti seluruh kode Apps Script yang terhubung ke **AU Access Test** dengan
   isi `apps-script/au-toolkit-firestore-admin-staging.gs`. Jangan menjalankan
   kedua script lengkap dalam satu project karena keduanya mendefinisikan
   `doPost`, `doGet`, dan fungsi lain dengan nama yang sama. Simpan, lalu
   perbarui deployment web app yang sudah ada ke versi baru. Pertahankan URL
   `/exec`, pengaturan eksekusi sebagai pemilik, dan izin akses untuk server.
5. Hapus trigger lama untuk penghitungan ulang langganan atau pengisian data
   dummy dari Apps Script staging tersebut, jika ada. Script baru mengambil
   data Firestore untuk laporan; keputusan akses berasal dari Firestore.
   Script ini hanya memakai **Reguler Test** dan **AU Access Test**. Fast Track
   tidak diperlukan dalam mode Firestore.
6. Di Vercel testing, setel `ACCESS_BACKEND=firestore`,
   `LYNK_WEBHOOK_MODE=activate`, dan sementara `FIRESTORE_IMPORT_ENABLED=true`.
   Terapkan pada environment **Production milik project testing**, serta
   Preview jika digunakan, lalu redeploy.
7. Muat ulang AU Access Test untuk menampilkan menu **AU Admin**. Jalankan
   **Import existing staging buyers**, lalu selesaikan otorisasi Google sendiri
   jika diminta. Proses ini mengimpor pembelian Reguler sukses terbaru setiap
   pembeli, dengan mempertahankan kedaluwarsa, status nonaktif, dan slot
   perangkat yang sudah ada. Akun yang sudah ada di Firestore tidak ditimpa.
   Impor ulang Ref yang sama aman. Transaksi Reguler sukses yang lebih lama
   kemudian diimpor sebagai riwayat tanpa mengganti langganan saat ini.
   Fast Track dan transaksi gagal/pending tidak diimpor oleh alat migrasi ini.
   Nominal transaksi hasil impor tidak diketahui (`null`), karena sheet lama
   tidak menyimpannya. Transaksi webhook baru menyimpan total sebenarnya,
   termasuk nominal nol. Baris spreadsheet lama tidak dihapus. Jika muncul
   `ACCOUNT_ALREADY_EXISTS`, periksa akun tersebut sebelum melanjutkan;
   jangan menimpanya secara paksa.
8. Nonaktifkan/hapus `FIRESTORE_IMPORT_ENABLED`, lalu redeploy. Jalankan
   **Refresh from Firebase**. Kolom M dan N di AU Access menjadi
   `Firestore Revision` dan `Synced At`.
9. Jika ingin laporan diperbarui otomatis, jalankan **Install report refresh
   trigger** dari menu AU Admin. Trigger ini memperbarui laporan transaksi dan
   akses setiap lima menit. Webhook baru juga langsung mengirim laporan setiap
   pembelian. Data pendaftaran perangkat muncul setelah laporan diperbarui.
10. Deploy rules staging memakai konfigurasi `firebase.staging.json` yang sudah
    ada dan tentukan project staging secara eksplisit. Rule bawaan yang menolak
    akses ke path lain sudah melindungi koleksi billing baru; rule tambahan
    memperjelas pembatasan tersebut.

Pengaturan service account mengikuti
[dokumentasi Firebase Admin](https://firebase.google.com/docs/admin/setup).
Perubahan transaksi, perangkat, dan tindakan admin yang harus tersimpan secara
utuh mengikuti
[transaksi Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Langkah Administrator

Editor spreadsheet yang punya akses ke Apps Script terkait dianggap sebagai
administrator tepercaya. Jangan bagikan script atau Script Properties-nya
kepada pelanggan biasa.

1. Jalankan **Refresh from Firebase** sebelum mengedit. Pilih baris akun pembeli
   saat ini di AU Access yang kolom `Firestore Revision`-nya sudah terisi.
2. Ubah kolom F (`Active` atau `Inactive`) dan/atau kolom E (tanggal kedaluwarsa),
   lalu jalankan **Apply status and expiry (selected row)**. Status `Expired`
   dihitung otomatis dari tanggal kedaluwarsa.
3. Untuk reset perangkat, pilih baris pembeli lalu jalankan menu reset
   handphone, laptop, atau kedua perangkat. Tindakan ini juga menerapkan status
   dan kedaluwarsa pada baris yang dipilih. Mengosongkan sel perangkat saja
   tidak melakukan reset di Firebase.
4. Jika muncul `STALE_ADMIN_REVISION`, perbarui laporan lalu terapkan ulang
   perubahan yang diinginkan. Login, pembelian baru, atau administrator lain
   mungkin sudah memperbarui akun tersebut.

Mengedit sel tidak langsung mengubah Firebase. Pembaruan laporan atau webhook
bisa mengganti edit yang belum diterapkan, jadi jalankan menu penerapan perubahan
sebelum memperbarui laporan. Email, Ref, tanggal pembelian, dan nomor revisi
merupakan data identitas/laporan, bukan pengaturan yang boleh diubah melalui
perintah admin.
Tindakan yang berhasil memperbarui baris spreadsheet dan menambahkan catatan
audit di server. Blokir, perubahan kedaluwarsa, dan reset berlaku pada pemeriksaan
akses server berikutnya. Fitur ini belum mengeluarkan pengguna secara langsung
dari sesi editor yang sedang terbuka. Jika server bermasalah, verifikasi akses
staging tidak memakai status akses lama dari cache sebagai pengganti.

## Kegagalan dan Pengiriman Ulang

Transaksi Firestore disimpan sebelum laporan dikirim ke spreadsheet. Jika
pelaporan gagal, webhook mengembalikan HTTP 503 `SHEET_REPORT_PENDING` dengan
`accessStored: true`. Pembeli tetap dapat memverifikasi akses lewat Firestore.
Pengiriman ulang Ref Lynk yang sama memperbaiki laporan tanpa memberikan
langganan tambahan. Pembaruan laporan secara manual juga mengisi kembali baris
yang belum tercatat. Namun, penanda `reportPending` baru dihapus setelah
pengiriman ulang webhook berhasil, bukan saat pembaruan manual. Periksa
mekanisme pengiriman ulang Lynk di dashboard merchant; jangan menganggap
jadwal pengiriman ulang tertentu pasti tersedia.

Pembaruan laporan mengambil data per halaman berisi maksimal 100 catatan.
Untuk data besar, batas waktu eksekusi Apps Script mungkin memerlukan proses
ekspor bertahap nantinya. Jangan aktifkan integrasi Google Sheets bawaan Lynk
pada tab laporan yang sama, karena akan ada dua proses terpisah yang menulis
transaksi.

Jangan langsung beralih kembali ke backend Sheets setelah ada perubahan admin
di Firestore. Data akses dari sheet lama dapat berbeda sampai laporan selesai
disinkronkan. Untuk kembali ke backend lama, pulihkan versi script dan variabel
sebelumnya, lalu periksa juga aturan perangkat dan kedaluwarsanya.

## Verifikasi

Jalankan pemeriksaan lokal berikut:

```text
node tests/firestore-access.test.mjs
node tests/firestore-sheet-admin.test.mjs
node tests/lynk-webhook.test.mjs
node tests/vercel-buyer.test.mjs
npm run lint
```

Tes baru menjalankan kode penyimpanan yang sebenarnya dengan simulasi Firestore
di memori yang mendukung transaksi, serta kode Apps Script sebenarnya dengan
layanan spreadsheet tiruan. Tes ini belum membuktikan izin IAM, pengiriman
ulang transaksi Firestore secara langsung, otorisasi Google, atau alur lengkap
pada deployment.
Setelah setup, lakukan checkout Rp0 baru dan periksa datanya di Firestore serta
kedua spreadsheet laporan. Kemudian uji login, blokir/aktifkan akun, perubahan
kedaluwarsa, reset satu perangkat, dan pengiriman ulang webhook jika Lynk
menyediakan fitur tersebut. Pastikan laptop lain ditolak sebelum reset, dan
reset laptop tetap mempertahankan slot handphone.
