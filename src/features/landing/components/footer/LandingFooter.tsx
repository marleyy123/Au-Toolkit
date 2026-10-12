import { ArrowUpRight } from 'lucide-react';
import { Brand } from '../header/LandingHeader';
import { landingLinks } from '../../data/landingContent';
import { useLandingContent } from '../../hooks/useLandingContent';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';

export function LandingFooter() {
  const { navigation } = useLandingContent();
  const { copy } = useLandingLanguage();
  return <footer className="landing-footer"><div className="landing-container"><div className="landing-footer-main"><div><Brand /><p>{copy('Ruang visual untuk cerita yang belum selesai.', 'A visual space for stories still unfolding.')}<br />{copy('Dibuat untuk penulis dan kreator fiksi digital.', 'Made for writers and digital fiction creators.')}</p></div><nav aria-label={copy('Navigasi footer', 'Footer navigation')}>{navigation.map(item => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav><div className="landing-footer-access"><span>{copy('Chapter berikutnya menunggu.', 'Your next chapter awaits.')}</span><a className="landing-text-link" href={landingLinks.editor}>{copy('Buka editor', 'Open Editor')}<ArrowUpRight size={16} /></a></div></div><div className="landing-footer-bottom"><span>&copy; {new Date().getFullYear()} AU Toolkit.</span><div><a href="/privacy">{copy('Kebijakan Privasi', 'Privacy Policy')}</a><a href="/terms">{copy('Syarat & Ketentuan', 'Terms & Conditions')}</a></div></div></div></footer>;
}
