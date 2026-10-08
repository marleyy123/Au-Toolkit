import { ArrowUpRight, Check, Clock3, Globe, RotateCw } from 'lucide-react';
import { useRegionalPricing } from '../hooks/useRegionalPricing';
import { SectionHeading } from './SectionHeading';

const inclusions = ['Seluruh format editor yang tersedia', 'Kustomisasi nama, avatar, tema, dan font', 'Ekspor gambar PNG dan JPG', 'Folder proyek dan pengaturan karakter'];

export function PricingSection() {
  const pricing = useRegionalPricing();
  const quote = pricing.status === 'ready' ? pricing.quote : null;
  const price = quote ? `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(quote.amount)}` : null;
  return <section className="landing-section" id="pilihan-paket"><div className="landing-container landing-pricing-layout">
    <div><SectionHeading eyebrow="Ruang untuk ceritamu" title="Satu akses. Banyak kemungkinan." description="Pilih akses sesuai ritme menulismu. Mulai dengan satu bulan untuk merangkai chapter berikutnya." /><p className="landing-pricing-footnote">Tidak diperpanjang otomatis.<br />Paket berikutnya dibeli melalui Lynk.id.</p></div>
    <div className="landing-plan-grid"><article className="landing-plan landing-plan-active"><span className="landing-plan-label">Paket tersedia</span><h3>Akses 1 Bulan</h3><p>30 hari akses editor AU Toolkit.</p>
      <div className="landing-region-label"><Globe size={14} /><span>{quote ? quote.region === 'indonesia' ? 'Indonesia' : 'International' : pricing.status === 'error' ? 'Region belum tersedia' : 'Memeriksa region...'}</span>{pricing.status === 'error' && <button className="landing-icon-button" type="button" aria-label="Coba lagi deteksi region" title="Coba lagi deteksi region" onClick={pricing.retry}><RotateCw size={14} /></button>}</div>
      <div className={`landing-plan-price${price ? '' : ' landing-price-pending'}`} aria-live="polite" aria-atomic="true">{price || (pricing.status === 'error' ? 'Harga belum tersedia' : 'Memuat harga...')}<span>/ 30 hari</span></div><ul>{inclusions.map(item => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul>
      {quote?.checkout ? <a className="landing-button landing-button-primary" href={quote.checkout} target="_blank" rel="noopener noreferrer">Beli melalui Lynk.id<ArrowUpRight size={17} /></a> : <button className="landing-button landing-button-primary" disabled>Beli melalui Lynk.id<ArrowUpRight size={17} /></button>}
      <small className="landing-checkout-status" role="status">{pricing.status === 'loading' ? 'Memeriksa ketersediaan paket.' : pricing.status === 'error' ? 'Region belum terdeteksi. Coba lagi atau hubungi bantuan.' : quote?.checkout ? 'Produk testing. Aktivasi otomatis belum tersedia.' : 'Checkout International belum tersedia.'}</small>
      <small>Gunakan email akun Google saat checkout.</small>
    </article><article className="landing-plan landing-plan-future"><span className="landing-plan-label"><Clock3 size={13} />Dalam perencanaan</span><h3>Akses 3 Bulan</h3><p>Lebih banyak waktu untuk serial yang panjang.</p><strong>Segera hadir</strong><p>Paket 90 hari belum tersedia untuk pembelian.</p><button className="landing-button landing-button-secondary" disabled>Belum tersedia</button></article></div>
  </div></section>;
}
