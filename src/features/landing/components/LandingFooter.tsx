import { ArrowUpRight } from 'lucide-react';
import { Brand } from './LandingHeader';
import { landingLinks, navigation } from '../data/landingContent';

export function LandingFooter() {
  return <footer className="landing-footer"><div className="landing-container"><div className="landing-footer-main"><div><Brand /><p>Ruang visual untuk cerita yang belum selesai.<br />Dibuat untuk penulis dan kreator fiksi digital.</p></div><nav aria-label="Navigasi footer">{navigation.map(item => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav><div className="landing-footer-access"><span>Chapter berikutnya menunggu.</span><a className="landing-text-link" href={landingLinks.editor}>Buka editor<ArrowUpRight size={16} /></a></div></div><div className="landing-footer-bottom"><span>&copy; {new Date().getFullYear()} AU Toolkit.</span><div><a href="/privacy">Kebijakan Privasi</a><a href="/terms">Syarat & Ketentuan</a></div></div></div></footer>;
}
