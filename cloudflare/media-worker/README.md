# AU Toolkit Cloudflare R2 Media Storage

Worker ini bertugas sebagai gateway penyimpanan media privat di Cloudflare R2 dengan autentikasi Firebase.
Semua data aplikasi & metadata tetap 100% berada di Firebase Firestore, sedangkan Cloudflare R2 murni digunakan sebagai media object storage.

## Setup Cepat via Cloudflare Dashboard (Tanpa CLI)

1. **Buat R2 Bucket**:
   - Di dashboard Cloudflare, buka menu **Storage & Databases** > **R2**.
   - Klik **Create bucket**, beri nama `au-toolkit-media` (private).
2. **Buat Worker**:
   - Buka menu **Compute (Workers & Pages)** > **Create application** > **Create Worker**.
   - Beri nama `au-toolkit-media` > klik **Deploy**.
3. **Hubungkan Binding R2 & Variables di Settings Worker**:
   - Buka tab **Settings** > **Bindings**:
     - Tambah **R2 bucket binding**:
       - Variable name: `MEDIA`
       - R2 bucket: `au-toolkit-media`
   - Buka tab **Settings** > **Variables and Secrets**:
     - `FIREBASE_PROJECT_ID`: `gen-lang-client-0839250297`
     - `ALLOWED_ORIGINS`: `https://autoolkit.com,https://www.autoolkit.com,http://localhost:3000,http://localhost:5173`
     - `MAX_FILE_BYTES`: `15728640`
4. **Deploy Kode Worker**:
   - Di halaman Worker, klik **Edit Code**.
   - Hapus kode bawaan, lalu salin isi file `cloudflare/media-worker/dist/worker.js` dan paste ke editor.
   - Klik **Deploy**.
5. **Konfigurasi Frontend**:
   - Salin URL Worker yang dihasilkan (misal `https://au-toolkit-media.<subdomain>.workers.dev`).
   - Masukkan ke file `.env` di root project:
     ```env
     VITE_CLOUDFLARE_MEDIA_URL="https://au-toolkit-media.<subdomain>.workers.dev"
     ```
   - Jalankan `pnpm dev`.
