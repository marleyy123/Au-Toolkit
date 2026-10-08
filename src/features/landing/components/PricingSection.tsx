import { ArrowUpRight, Check, Clock3 } from 'lucide-react';
import { landingLinks, monthlyPrice } from '../data/landingContent';
import { SectionHeading } from './SectionHeading';

const inclusions = ['Seluruh format editor yang tersedia', 'Kustomisasi nama, avatar, tema, dan font', 'Ekspor gambar PNG dan JPG', 'Folder proyek dan pengaturan karakter'];

export function PricingSection() {
  return <section className="landing-section" id="pilihan-paket"><div className="landing-container landing-pricing-layout">
    <div><SectionHeading eyebrow="Ruang untuk ceritamu" title="Satu akses. Banyak kemungkinan." description="Pilih akses sesuai ritme menulismu. Mulai dengan satu bulan untuk merangkai chapter berikutnya." /><p className="landing-pricing-footnote">Tidak diperpanjang otomatis.<br />Paket berikutnya dibeli melalui Lynk.id.</p></div>
    <div className="landing-plan-grid"><article className="landing-plan landing-plan-active"><span className="landing-plan-label">Paket tersedia</span><h3>Akses 1 Bulan</h3><p>30 hari akses editor AU Toolkit.</p><div className="landing-plan-price">{monthlyPrice || 'Harga di Lynk.id'}<span>/ 30 hari</span></div><ul>{inclusions.map(item => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul>
      {landingLinks.checkout ? <a className="landing-button landing-button-primary" href={landingLinks.checkout} target="_blank" rel="noopener noreferrer">Beli melalui Lynk.id<ArrowUpRight size={17} /></a> : <button className="landing-button landing-button-primary" disabled>Checkout segera tersedia</button>}
      <small>Produk testing. Aktivasi otomatis belum tersedia. Gunakan email akun Google saat checkout.</small>
    </article><article className="landing-plan landing-plan-future"><span className="landing-plan-label"><Clock3 size={13} />Dalam perencanaan</span><h3>Akses 3 Bulan</h3><p>Lebih banyak waktu untuk serial yang panjang.</p><strong>Segera hadir</strong><p>Paket 90 hari belum tersedia untuk pembelian.</p><button className="landing-button landing-button-secondary" disabled>Belum tersedia</button></article></div>
  </div></section>;
}
