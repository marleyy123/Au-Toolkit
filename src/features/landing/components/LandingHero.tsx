import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react';
import { StudioDemo } from './StudioDemo';

export function LandingHero() {
  return <section id="beranda" className="landing-hero"><div className="landing-container">
    <div className="landing-hero-intro"><div><span className="landing-eyebrow"><Sparkles size={14} />Untuk penulis & kreator Alternate Universe</span>
      <h1>AU Toolkit<span className="landing-heading-dot">.</span></h1>
      <p className="landing-hero-lead">Cerita dari imajinasimu. <br />Percakapan yang terasa nyata.</p>
      <p className="landing-hero-description">Rangkai chat fiktif, bangun karakter, dan ubah dialogmu menjadi visual yang siap dibaca.</p>
    </div><div className="landing-hero-actions"><a className="landing-button landing-button-primary" href="#pilihan-paket">Lihat Pilihan Paket<ArrowUpRight size={17} /></a><a className="landing-text-link" href="#galeri-format">Jelajahi format<ArrowDown size={15} /></a></div></div>
    <StudioDemo />
    <div className="landing-hero-bottom"><span>WhatsApp<span aria-hidden="true"> / </span>LINE<span aria-hidden="true"> / </span>Instagram DM</span><a href="#galeri-format">Temukan format ceritamu<ArrowDown size={14} /></a></div>
  </div></section>;
}
