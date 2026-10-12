import { useEffect } from 'react';
import { ArrowUpRight, Check, Globe, RotateCw } from 'lucide-react';
import { ACCESS_PLANS } from '../../../../../lib/access-plans.js';
import { useRegionalPricing } from '../../hooks/useRegionalPricing';
import { SectionHeading } from '../shared/SectionHeading';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';

const inclusions = ['Seluruh format editor yang tersedia', 'Kustomisasi nama, avatar, tema, dan font', 'Ekspor gambar PNG dan JPG', 'Folder proyek dan pengaturan karakter'];

export function PricingSection() {
  const { copy, language, preferredLanguage, setLanguage } = useLandingLanguage();
  const localizedInclusions = language === 'id' ? inclusions : ['All available editor formats', 'Customize names, avatars, themes, and fonts', 'Export PNG and JPG images', 'Project folders and character settings'];
  const pricing = useRegionalPricing();
  const quote = pricing.status === 'ready' ? pricing.quote : null;
  const country = quote?.country;
  useEffect(() => {
    if (country && preferredLanguage === null) {
      setLanguage(country === 'ID' ? 'id' : 'en', { persist: false });
    }
  }, [country, preferredLanguage]);
  return <section className="landing-section" id="pilihan-paket"><div className="landing-container landing-pricing-layout">
    <div><SectionHeading eyebrow={copy('Ruang untuk ceritamu', 'Room for your story')} title={copy('Satu akses. Banyak kemungkinan.', 'One subscription. So many possibilities.')} description={copy('Pilih masa akses sesuai ritme menulismu.', 'Choose an access period that fits your writing rhythm.')} /><p className="landing-pricing-footnote">{copy('Tidak diperpanjang otomatis.', 'No automatic renewal.')}<br />{copy('Paket berikutnya dibeli melalui Lynk.id.', 'Purchase your next plan through Lynk.id.')}</p></div>
    <div className="landing-plan-grid">{ACCESS_PLANS.map(plan => {
      const offer = quote?.plans.find(item => item.id === plan.id);
      const price = offer ? language === 'id' ? `Rp${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(offer.amount)}` : `IDR ${new Intl.NumberFormat('en-US').format(offer.amount)}` : null;
      const title = language === 'id' ? plan.title : ({ monthly: '1 Month', quarterly: '3 Months', yearly: '1 Year' } as Record<string, string>)[plan.id];
      return <article key={plan.id} data-plan={plan.id} className={`landing-plan${plan.id === 'monthly' ? ' landing-plan-active' : ''}`}><span className="landing-plan-label">{plan.id === 'monthly' ? copy('Paket tersedia', 'Available plan') : copy('Paket testing', 'Test plan')}</span><h3>{title}</h3><p>{copy(`${plan.accessDays} hari akses editor AU Toolkit.`, `${plan.accessDays} days of access to the AU Toolkit editor.`)}</p>
      <div className="landing-region-label"><Globe size={14} /><span>{quote ? quote.region === 'indonesia' ? 'Indonesia' : 'International' : pricing.status === 'error' ? copy('Region belum tersedia', 'Region unavailable') : copy('Memeriksa region...', 'Checking region...')}</span>{pricing.status === 'error' && <button className="landing-icon-button" type="button" aria-label={copy('Coba lagi deteksi region', 'Retry region detection')} title={copy('Coba lagi deteksi region', 'Retry region detection')} onClick={pricing.retry}><RotateCw size={14} /></button>}</div>
      <div className={`landing-plan-price${price ? '' : ' landing-price-pending'}`} aria-live="polite" aria-atomic="true">{price || (pricing.status === 'error' ? copy('Harga belum tersedia', 'Price unavailable') : copy('Memuat harga...', 'Loading price...'))}<span>/ {plan.accessDays} {copy('hari', 'days')}</span></div><ul>{localizedInclusions.map(item => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul>
      {offer?.checkout ? <a className="landing-button landing-button-primary" href={offer.checkout} target="_blank" rel="noopener noreferrer">{copy('Beli melalui Lynk.id', 'Buy through Lynk.id')}<ArrowUpRight size={17} /></a> : <button className="landing-button landing-button-primary" disabled>{copy('Beli melalui Lynk.id', 'Buy through Lynk.id')}<ArrowUpRight size={17} /></button>}
      <small className="landing-checkout-status" role="status">{pricing.status === 'loading' ? copy('Memeriksa ketersediaan paket.', 'Checking plan availability.') : pricing.status === 'error' ? copy('Region belum terdeteksi. Coba lagi atau hubungi bantuan.', 'Region could not be detected. Retry or contact support.') : offer?.checkout ? copy('Produk testing.', 'Test product.') : plan.id === 'monthly' ? copy('Checkout International belum tersedia.', 'International checkout is not available yet.') : copy('Checkout belum tersedia.', 'Checkout is not available yet.')}</small>
      <small>{copy('Gunakan email akun Google saat checkout.', 'Use your Google account email at checkout.')}</small>
    </article>;
    })}</div>
  </div></section>;
}
