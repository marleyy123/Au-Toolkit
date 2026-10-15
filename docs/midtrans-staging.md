# Midtrans Snap di staging

Integrasi hanya aktif untuk Firebase `au-toolkit-staging-20261005` ketika
`MIDTRANS_SERVER_KEY` terisi. Production dan fallback checkout Lynk tetap memakai
alur sebelumnya. Key server tidak menggunakan awalan `VITE_` dan tidak dikirim ke browser.

## Konfigurasi

Di `.env.staging.vercel` untuk lokal dan environment Vercel **staging**:

```dotenv
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=Mid-server-... # salin persis dari dashboard Sandbox
MIDTRANS_CLIENT_KEY=Mid-client-...
ACCESS_BACKEND=firestore
FIREBASE_ADMIN_SERVICE_ACCOUNT={...}
```

Service account harus berasal dari project staging tersebut. Gunakan kredensial
staging yang sama dengan API akses yang sudah berjalan. `MIDTRANS_MERCHANT_ID`
boleh disimpan, tetapi tidak diperlukan untuk request Snap standar.
Key Sandbox dapat memakai format `Mid-*` maupun `SB-Mid-*`; awalan bukan
penentu environment. Jangan menambahkan `SB-` secara manual. Mode eksplisit
`false` dan endpoint API/skrip Sandbox yang menentukan tujuan request.
`ALLOWED_ORIGINS` mencantumkan origin staging dan origin lokal yang digunakan.
Jangan mengaktifkan backend Firestore sebelum konfigurasi akses staging yang ada
siap; lihat [panduan akses](./firestore-access-staging.md).

Jalankan `npm run dev:staging` (restart setelah mengubah env). Server lokal
mensimulasikan region Indonesia; `LANDING_DEV_COUNTRY=US` menguji harga
internasional. Pada Vercel hanya header negara dari Vercel yang dipakai.
Mode lokal tidak berlaku di server production.

Setelah kode dan environment dideploy ke Vercel staging, atur **Payment
Notification URL** di dashboard Midtrans **Sandbox**:

```text
https://au-toolkit-testing.vercel.app/api/midtrans-webhook
```

URL itu belum tersedia sebelum deploy. Webhook tidak dapat menjangkau localhost.
Tombol **Periksa status pembayaran** juga dapat memverifikasi dan mengaktifkan
akses dari API Midtrans saat tes lokal, tanpa webhook.

## Metode dan harga

Request Snap sengaja tidak mengirim `enabled_payments`; seluruh metode aktif
di merchant ditampilkan, sesuai pengaturan Snap Preferences dan kelayakan
masing-masing kanal. Mengaktifkan kanal di dashboard tetap diperlukan.
Integrasi tidak menjanjikan kanal yang belum diaktifkan merchant.

Harga bulanan mengikuti harga server yang sudah ada: Indonesia Rp15.000,
internasional Rp30.000, akses 30 hari. Paket 90/365 hari dinonaktifkan pada
Midtrans sampai harga ditentukan; nilai nol lama untuk produk testing Lynk
tidak dikirim sebagai pembayaran Midtrans. Browser tidak dapat menentukan harga,
durasi akses atau negara transaksi.

## Verifikasi dan penyimpanan

Email pembelian harus sama dengan email Google yang digunakan untuk masuk.
Checkout publik tidak memerlukan akun terdaftar terlebih dahulu. Pembayaran
baru dibatasi per email (30 detik) dan alamat IP (10 detik), atomik di Firestore.
Order server acak, `statusToken` acak 256 bit; hanya hash token disimpan di
`midtransOrders`. Token dan token Snap disimpan di sessionStorage browser untuk
melanjutkan transaksi di tab yang sama. Jangan membagikan token transaksi.

Webhook diperiksa dengan signature SHA-512, kemudian server mengambil status
langsung dari API Midtrans Sandbox. Status browser/callback/redirect tidak
memberi akses. Settlement atau capture dengan fraud accept dan nominal/mata
uang yang cocok baru masuk melalui `createAccessStore.ingest` yang sudah ada.
Transaksi yang sama tidak dapat memperpanjang akses berulang. Status paid
disimpan setelah ingest selesai; retry dapat memulihkan kegagalan di antaranya.
Order lain, pending, fraud challenge/deny, cancel, expire dan refund tidak
membuat grant baru. Refund setelah akses teraktivasi memerlukan penanganan admin;
integrasi ini tidak mencabut akses otomatis setelah refund.

`midtransOrders`, `midtransLimits`, `billingPurchases`, dan `billingAccounts`
hanya diakses Admin SDK; rules staging default deny menolak akses browser.
Dokumen rate limit memiliki `expiresAt` (opsional atur TTL Firestore pada field
ini). Status hanya diperiksa saat pengguna meminta atau callback Snap terjadi;
tidak ada polling terus-menerus.

## Pengujian

```text
node tests/midtrans.test.mjs
npm run dev:staging
node tests/midtrans-browser.mjs
npm run lint
npm run build
```

Tes otomatis memakai provider palsu dan database dalam memori; browser memakai
mock Snap pada Edge dan WebKit. Untuk uji nyata, ganti key ke Sandbox, lengkapi
Admin SDK staging, buat order dari landing, bayar melalui simulator Sandbox,
periksa status dan login menggunakan email pembelian. Periksa order di dashboard
Sandbox dan satu purchase/grant di Firestore. Tes nyata tidak boleh menggunakan
key production atau pembayaran uang sungguhan.

Referensi resmi: [parameter Snap](https://docs.midtrans.com/reference/request-body-json-parameter),
[notifikasi dan verifikasi](https://docs.midtrans.com/docs/https-notification-webhooks),
[pengaturan notifikasi](https://docs.midtrans.com/docs/payment-settings).
