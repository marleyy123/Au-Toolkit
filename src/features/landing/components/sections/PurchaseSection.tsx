import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { landingLinks } from '../../data/landingContent';
import { useLandingContent } from '../../hooks/useLandingContent';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';
import { SectionHeading } from '../shared/SectionHeading';

export function PurchaseSection() {
  const { purchaseSteps } = useLandingContent();
  const { copy } = useLandingLanguage();
  return <section className="landing-section landing-purchase" id="cara-beli"><div className="landing-container">
    <SectionHeading eyebrow={copy('Dari checkout ke chapter pertama', 'From checkout to chapter one')} title={copy('Tiga langkah untuk mulai.', 'Three steps to get started.')} description={copy('Pembayaran melalui Lynk.id, akses menggunakan akun Google milikmu.', 'Pay through Lynk.id and access the editor with your Google account.')} />
    <ol className="landing-step-grid">{purchaseSteps.map((step, index) => <li key={step.title}><span className="landing-step-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}</ol>
    <div className="landing-access-note"><CalendarDays size={23} /><p><strong>{copy('Masa akses mengikuti tanggal pembelian.', 'Access starts on your purchase date.')}</strong> {copy('Akses 30 hari dimulai dari pembayaran di Lynk.id, bukan login pertama. Sisa hari belum diakumulasikan otomatis.', 'Your 30-day access starts with payment on Lynk.id, rather than your first login. Remaining days are not automatically carried over.')}</p><a className="landing-text-link" href={landingLinks.editor}>{copy('Sudah punya akses?', 'Already have access?')}<ArrowUpRight size={17} /></a></div>
  </div></section>;
}
