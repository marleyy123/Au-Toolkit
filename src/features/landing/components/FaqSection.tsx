import { ArrowUpRight, MessageCircle, Plus } from 'lucide-react';
import { faqs, landingLinks } from '../data/landingContent';
import { SectionHeading } from './SectionHeading';

export function FaqSection() {
  return <section className="landing-section landing-faq" id="faq"><div className="landing-container landing-faq-layout">
    <div><SectionHeading eyebrow="Sebelum mulai" title="Yang sering ditanyakan." description="Tentang akses, perangkat, dan cara kerja AU Toolkit." /><div className="landing-help"><MessageCircle size={21} /><h3>Masih ada pertanyaan?</h3><p>Siapkan invoice jika pertanyaanmu berkaitan dengan pembayaran atau akses akun.</p>{landingLinks.support ? <a className="landing-text-link" href={landingLinks.support} target="_blank" rel="noopener noreferrer">Bantuan WhatsApp<ArrowUpRight size={16} /></a> : <a className="landing-text-link" href="/editor">Periksa akses akun<ArrowUpRight size={16} /></a>}</div></div>
    <div className="landing-faq-list">{faqs.map((faq, index) => <details key={faq.question} open={index === 0}><summary>{faq.question}<Plus size={18} /></summary><p>{faq.answer}</p></details>)}</div>
  </div></section>;
}
