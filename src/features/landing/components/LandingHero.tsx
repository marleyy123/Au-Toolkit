import { ArrowDown, ArrowUpRight, Sparkles } from 'lucide-react';
import { StudioDemo } from './StudioDemo';
import { useLandingLanguage } from '../hooks/useLandingLanguage';

export function LandingHero() {
  const { copy } = useLandingLanguage();
  return <section id="beranda" className="landing-hero"><div className="landing-container">
    <div className="landing-hero-intro"><div><span className="landing-eyebrow"><Sparkles size={14} />{copy('Untuk penulis & kreator Alternate Universe', 'For Alternate Universe writers & creators')}</span>
      <h1>AU Toolkit<span className="landing-heading-dot">.</span></h1>
      <p className="landing-hero-lead">{copy('Cerita dari imajinasimu.', 'Stories from your imagination.')} <br />{copy('Percakapan yang terasa nyata.', 'Conversations that feel real.')}</p>
      <p className="landing-hero-description">{copy('Rangkai chat fiktif, bangun karakter, dan ubah dialogmu menjadi visual yang siap dibaca.', 'Create fictional chats, build your characters, and turn dialogue into visuals ready to read.')}</p>
    </div><div className="landing-hero-actions"><a className="landing-button landing-button-primary" href="#pilihan-paket">{copy('Lihat Pilihan Paket', 'Explore Plans')}<ArrowUpRight size={17} /></a><a className="landing-text-link" href="#galeri-format">{copy('Jelajahi format', 'Explore formats')}<ArrowDown size={15} /></a></div></div>
    <StudioDemo />
    <div className="landing-hero-bottom"><span>WhatsApp<span aria-hidden="true"> / </span>LINE<span aria-hidden="true"> / </span>Instagram DM</span><a href="#galeri-format">{copy('Temukan format ceritamu', 'Find your story format')}<ArrowDown size={14} /></a></div>
  </div></section>;
}
