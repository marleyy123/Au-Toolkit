import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { landingLinks, purchaseSteps } from '../data/landingContent';
import { SectionHeading } from './SectionHeading';

export function PurchaseSection() {
  return <section className="landing-section landing-purchase" id="cara-beli"><div className="landing-container">
    <SectionHeading eyebrow="Dari checkout ke chapter pertama" title="Tiga langkah untuk mulai." description="Pembayaran melalui Lynk.id, akses menggunakan akun Google milikmu." />
    <ol className="landing-step-grid">{purchaseSteps.map((step, index) => <li key={step.title}><span className="landing-step-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
    <div className="landing-access-note"><CalendarDays size={23} /><p><strong>Masa akses mengikuti tanggal pembelian.</strong> Akses 30 hari dimulai dari pembayaran di Lynk.id, bukan login pertama. Sisa hari belum diakumulasikan otomatis.</p><a className="landing-text-link" href={landingLinks.editor}>Sudah punya akses?<ArrowUpRight size={17} /></a></div>
  </div></section>;
}
