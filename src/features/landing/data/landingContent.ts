import { BookmarkCheck, Download, Eye, MessagesSquare, SlidersHorizontal, Type } from 'lucide-react';

export const navigation = [
  { label: 'Galeri Format', id: 'galeri-format' },
  { label: 'Fitur', id: 'fitur' },
  { label: 'Cara Beli', id: 'cara-beli' },
  { label: 'Pilihan Paket', id: 'pilihan-paket' },
  { label: 'FAQ', id: 'faq' },
];

export const formats = [
  { id: 'whatsapp', name: 'WhatsApp', color: '#16836a', image: '/landing/whatsapp.png', description: 'Dialog sehari-hari, centang terbaca, dan detail kecil yang menghidupkan cerita.', tag: 'Chat personal & grup' },
  { id: 'line', name: 'LINE', color: '#27843d', image: '/landing/line.png', description: 'Avatar, indikator read, dan tampilan percakapan khas LINE.', tag: 'Percakapan yang familiar' },
  { id: 'instagram', name: 'Instagram DM', color: '#a12ab4', image: '/landing/instagram.png', description: 'Dari balasan singkat sampai percakapan panjang lewat direct message.', tag: 'Cerita di balik DM' },
];

export const features = [
  { icon: MessagesSquare, title: 'Satu cerita, banyak format', description: 'WhatsApp, LINE, Instagram, dan format media sosial lainnya dalam satu editor.' },
  { icon: SlidersHorizontal, title: 'Karakter yang kamu tentukan', description: 'Nama, avatar, status, tema, dan warna percakapan mengikuti tokoh ceritamu.' },
  { icon: Type, title: 'Tipografi yang pas', description: 'Sesuaikan ukuran dan gaya teks untuk percakapan yang nyaman dibaca.' },
  { icon: BookmarkCheck, title: 'Lanjutkan episode berikutnya', description: 'Kelola folder proyek dan simpan pengaturan karakter tanpa mulai dari nol.' },
  { icon: Eye, title: 'Langsung lihat hasilnya', description: 'Perubahan dialog dan tampilan muncul langsung di pratinjau.' },
  { icon: Download, title: 'Siap jadi gambar', description: 'Ekspor hasil percakapan ke PNG atau JPG untuk konten ceritamu.' },
];

export const purchaseSteps = [
  { title: 'Pilih aksesmu', description: 'Pilih paket yang tersedia, lalu lanjutkan pembayaran melalui Lynk.id.' },
  { title: 'Gunakan email akun Google', description: 'Masukkan email yang sama dengan akun Google yang akan kamu gunakan untuk masuk.' },
  { title: 'Masuk dan mulai bercerita', description: 'Setelah pembayaran berhasil dan akses tersinkron, masuk ke editor dengan akun tersebut.' },
];

export const faqs = [
  { question: 'AU Toolkit itu aplikasi chat atau AI penulis cerita?', answer: 'AU Toolkit adalah editor visual untuk percakapan dan konten fiktif. Pesan tidak dikirim ke orang lain. Kamu menulis cerita dan dialognya sendiri.' },
  { question: 'Kapan masa akses mulai dihitung?', answer: 'Masa akses dihitung dari tanggal pembelian di Lynk.id, bukan dari login pertama: 30 hari untuk 1 bulan, 90 hari untuk 3 bulan, dan 365 hari untuk 1 tahun. Tanggal berakhir bisa diperiksa setelah akses terverifikasi.' },
  { question: 'Email apa yang harus dipakai saat checkout?', answer: 'Gunakan email akun Google yang akan dipakai untuk login. Jika email pembelian keliru atau berbeda, hubungi bantuan dan sertakan invoice untuk verifikasi.' },
  { question: 'Bisa dipakai di HP dan laptop?', answer: 'Bisa melalui browser di berbagai HP dan laptop. Masuk dengan akun yang emailnya sama dengan email pembelian dan memiliki langganan aktif. Tidak ada batas slot HP atau laptop, dan tidak perlu reset saat berganti perangkat.' },
  { question: 'Bagaimana cara memperpanjang akses?', answer: 'Beli kembali paket yang tersedia menggunakan email yang sama. Sisa hari belum diakumulasikan otomatis, jadi periksa tanggal berakhir sebelum memperpanjang.' },
  { question: 'Apakah hasil ekspor akan tetap tajam di media sosial?', answer: 'Kamu bisa mengunduh hasil dalam PNG atau JPG. Tampilan akhir setelah diunggah tetap dipengaruhi kompresi platform media sosial.' },
  { question: 'Apakah foto tersinkron ke perangkat lain?', answer: 'Foto unggahan saat ini disimpan secara lokal di browser untuk akun tersebut. Foto belum otomatis tersedia di browser atau perangkat lain.' },
];

function trustedExternalUrl(value: string | undefined, hostname: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === hostname && url.pathname !== '/' ? url.href : null;
  } catch { return null; }
}

export const landingLinks = {
  editor: '/editor',
  support: trustedExternalUrl(import.meta.env.VITE_LANDING_WHATSAPP_URL, 'wa.me') || 'https://wa.me/6285179615352',
};
