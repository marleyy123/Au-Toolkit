import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { landingLinks, navigation } from '../data/landingContent';

export function Brand() {
  return <a className="landing-brand" href="/#beranda" aria-label="AU Toolkit beranda"><span className="landing-brand-mark">au<span>.</span></span><span>AU Toolkit</span></a>;
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
    };
    const handleOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    if (open) { window.addEventListener('keydown', handleKey); window.addEventListener('pointerdown', handleOutside); }
    return () => { window.removeEventListener('keydown', handleKey); window.removeEventListener('pointerdown', handleOutside); };
  }, [open]);
  return <header className="landing-header" ref={menuRef}><div className="landing-container landing-header-inner">
    <Brand />
    <nav className="landing-desktop-nav" aria-label="Navigasi utama">{navigation.map(item => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav>
    <div className="landing-header-actions"><a className="landing-login" href={landingLinks.editor}>Masuk <ArrowUpRight size={15} /></a>
      <a className="landing-button landing-button-primary landing-header-cta" href="#pilihan-paket">Lihat Paket</a>
      <button ref={toggleRef} className="landing-icon-button landing-menu-toggle" title={open ? 'Tutup menu' : 'Buka menu'} aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="landing-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
    </div>
  </div>{open && <nav id="landing-mobile-nav" className="landing-mobile-nav" aria-label="Navigasi seluler">{navigation.map(item => <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)}>{item.label}<ArrowUpRight size={16} /></a>)}</nav>}</header>;
}
