import { ArrowUpRight, MessageCircle, Plus } from 'lucide-react';
import { landingLinks } from '../../data/landingContent';
import { useLandingContent } from '../../hooks/useLandingContent';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';
import { SectionHeading } from '../shared/SectionHeading';

export function FaqSection() {
  const { faqs } = useLandingContent();
  const { copy } = useLandingLanguage();
  return <section className="landing-section landing-faq" id="faq"><div className="landing-container landing-faq-layout">
    <div><SectionHeading eyebrow={copy('Sebelum mulai', 'Before you begin')} title={copy('Yang sering ditanyakan.', 'Frequently asked questions.')} description={copy('Tentang akses, perangkat, dan cara kerja AU Toolkit.', 'About access, devices, and how AU Toolkit works.')} /><div className="landing-help"><MessageCircle size={21} /><h3>{copy('Masih ada pertanyaan?', 'Still have a question?')}</h3><p>{copy('Siapkan invoice jika pertanyaanmu berkaitan dengan pembayaran atau akses akun.', 'Have your invoice ready for questions about payment or account access.')}</p>{landingLinks.support ? <a className="landing-text-link" href={landingLinks.support} target="_blank" rel="noopener noreferrer">{copy('Bantuan WhatsApp', 'WhatsApp Support')}<ArrowUpRight size={16} /></a> : <a className="landing-text-link" href="/editor">{copy('Periksa akses akun', 'Check account access')}<ArrowUpRight size={16} /></a>}</div></div>
    <div className="landing-faq-list">{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary>{faq.question}<Plus size={18} /></summary><p>{faq.answer}</p></details>)}</div>
  </div></section>;
}
