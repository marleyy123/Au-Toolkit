import { ArrowUpRight, Check, Globe, RotateCw } from 'lucide-react';
import { ACCESS_PLANS } from '../../../../lib/access-plans.js';
import { useRegionalPricing } from '../hooks/useRegionalPricing';
import { SectionHeading } from './SectionHeading';

const inclusions = ['Seluruh format editor yang tersedia', 'Kustomisasi nama, avatar, tema, dan font', 'Ekspor gambar PNG dan JPG', 'Folder proyek dan pengaturan karakter'];

export function PricingSection() {
  const pricing = useRegionalPricing();
  const quote = pricing.status === 'ready' ? pricing.quote : null;
  return <section className="landing-section" id="pilihan-paket"><div className="landing-container landing-pricing-layout">
    <div><SectionHeading eyebrow="Ruang untuk ceritamu" title="Satu akses. Banyak kemungkinan." description="Pilih masa akses sesuai ritme menulismu." /><p className="landing-pricing-footnote">Tidak diperpanjang otomatis.<br />Paket berikutnya dibeli melalui Lynk.id.</p></div>
    <div className="landing-plan-grid">{ACCESS_PLANS.map(plan => {
      const offer = quote?.plans.find(item => item.id === plan.id);
      const price = offer ? `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(offer.amount)}` : null;
      return <article key={plan.id} data-plan={plan.id} className={`landing-plan${plan.id === 'monthly' ? ' landing-plan-active' : ''}`}><span className="landing-plan-label">{plan.id === 'monthly' ? 'Paket tersedia' : 'Paket testing'}</span><h3>{plan.title}</h3><p>{plan.accessDays} hari akses editor AU Toolkit.</p>
      <div className="landing-region-label"><Globe size={14} /><span>{quote ? quote.region === 'indonesia' ? 'Indonesia' : 'International' : pricing.status === 'error' ? 'Region belum tersedia' : 'Memeriksa region...'}</span>{pricing.status === 'error' && <button className="landing-icon-button" type="button" aria-label="Coba lagi deteksi region" title="Coba lagi deteksi region" onClick={pricing.retry}><RotateCw size={14} /></button>}</div>
      <div className={`landing-plan-price${price ? '' : ' landing-price-pending'}`} aria-live="polite" aria-atomic="true">{price || (pricing.status === 'error' ? 'Harga belum tersedia' : 'Memuat harga...')}<span>/ {plan.accessDays} hari</span></div><ul>{inclusions.map(item => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul>
      {offer?.checkout ? <a className="landing-button landing-button-primary" href={offer.checkout} target="_blank" rel="noopener noreferrer">Beli melalui Lynk.id<ArrowUpRight size={17} /></a> : <button className="landing-button landing-button-primary" disabled>Beli melalui Lynk.id<ArrowUpRight size={17} /></button>}
      <small className="landing-checkout-status" role="status">{pricing.status === 'loading' ? 'Memeriksa ketersediaan paket.' : pricing.status === 'error' ? 'Region belum terdeteksi. Coba lagi atau hubungi bantuan.' : offer?.checkout ? 'Produk testing.' : plan.id === 'monthly' ? 'Checkout International belum tersedia.' : 'Checkout belum tersedia.'}</small>
      <small>Gunakan email akun Google saat checkout.</small>
    </article>;
    })}</div>
  </div></section>;
}
