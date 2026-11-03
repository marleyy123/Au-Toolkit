# Midtrans Snap di staging

Integrasi aktif untuk Firebase `au-toolkit-staging-20261005`. Pilih Sandbox
atau Production dengan `MIDTRANS_IS_PRODUCTION`. Kedua mode memberi akses pada
backend staging ini; mode Production memproses pembayaran uang sungguhan dan
tidak memindahkan data akses ke Firebase production. Key server tidak memakai
awalan `VITE_` dan tidak dikirim ke browser.

## Konfigurasi

Di `.env.staging.vercel` untuk lokal dan environment Vercel **staging**:

```dotenv
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-... # gunakan key sesuai mode
MIDTRANS_CLIENT_KEY=Mid-client-...
ACCESS_BACKEND=firestore
FIREBASE_ADMIN_SERVICE_ACCOUNT={...}
```

Gunakan `true` dengan key dashboard Production atau `false` dengan key
Sandbox. Server memilih endpoint berdasarkan flag tersebut. Service account
harus tetap berasal dari project staging.
`ALLOWED_ORIGINS` mencantumkan origin staging dan origin lokal yang digunakan.
Jangan mengaktifkan backend Firestore sebelum konfigurasi akses staging yang ada
siap; lihat [panduan akses](./firestore-access-staging.md).

Jalankan `npm run dev:staging` (restart setelah mengubah env). Server lokal
mensimulasikan region Indonesia; `LANDING_DEV_COUNTRY=US` menguji harga
internasional. Pada Vercel hanya header negara dari Vercel yang dipakai.
Mode lokal tidak berlaku di server production.

Setelah kode dan environment dideploy ke Vercel staging, atur **Payment
Notification URL** di dashboard Midtrans yang sesuai dengan mode yang digunakan:

```text
https://au-toolkit-testing.vercel.app/api/midtrans-webhook
```

URL itu belum tersedia sebelum deploy. Webhook tidak dapat menjangkau localhost.
Tombol **Periksa status pembayaran** juga memverifikasi status melalui API
Midtrans yang sesuai dengan order, tanpa webhook.

## Metode dan harga

Request Snap sengaja tidak mengirim `enabled_payments`; seluruh metode aktif
di merchant ditampilkan, sesuai pengaturan Snap Preferences dan kelayakan
masing-masing kanal. Mengaktifkan kanal di dashboard tetap diperlukan.
Integrasi tidak menjanjikan kanal yang belum diaktifkan merchant.

Harga development per 17 Oktober 2026 (seluruh transaksi dalam IDR):

| Paket | Durasi akses | Indonesia | Internasional |
| --- | --- | --- | --- |
| 1 bulan | 30 hari | Rp15.000 | Rp39.000 |
| 6 bulan | 180 hari | Rp90.000 | Rp234.000 |
| 1 tahun | 365 hari | Rp180.000 | Rp468.000 |

Harga internasional sementara untuk uji pasar. Katalog berada di
`lib/midtrans-plans.js`, terpisah dari katalog Lynk lama agar transaksi historis
tetap dapat diverifikasi. Browser hanya mengirim ID paket dan email; server
menentukan harga, durasi akses, dan negara transaksi dari region tepercaya.
Paket 6 bulan memakai ID `semiannual`, tidak mengganti ID `quarterly` milik
transaksi lama. Order pending menyimpan harga/durasi saat dibuat, sehingga
perubahan harga tidak mengubah nominal order yang sudah ada. Sesi checkout
disimpan per paket agar melanjutkan order tidak tertukar dengan paket lain.

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
mock Snap pada Edge dan WebKit. Untuk uji nyata, gunakan Sandbox dan simulator
Sandbox. Order Sandbox lama tetap memakai endpoint Sandbox; order Production
memakai endpoint Production dan dicatat dengan sumber `midtrans-production`.

Referensi resmi: [parameter Snap](https://docs.midtrans.com/reference/request-body-json-parameter),
[notifikasi dan verifikasi](https://docs.midtrans.com/docs/https-notification-webhooks),
[pengaturan notifikasi](https://docs.midtrans.com/docs/payment-settings).
