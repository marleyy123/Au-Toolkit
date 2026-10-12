import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { LanguageMenu } from './LanguageMenu';
import { AuBrand } from '../../../../components/AuBrand';
import { landingLinks } from '../../data/landingContent';
import { useLandingContent } from '../../hooks/useLandingContent';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';

export function Brand() {
  const { copy } = useLandingLanguage();
  return <a className="landing-brand" href="/#beranda" aria-label={copy('AU Toolkit beranda', 'AU Toolkit home')}><AuBrand className="landing-brand-mark" /><span>AU Toolkit</span></a>;
}

export function LandingHeader() {
  const { copy } = useLandingLanguage();
  const { navigation } = useLandingContent();
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
    <nav className="landing-desktop-nav" aria-label={copy('Navigasi utama', 'Main navigation')}>{navigation.map(item => <a key={item.id} href={`#${item.id}`}>{item.label}</a>)}</nav>
    <div className="landing-header-actions"><LanguageMenu /><a className="landing-login" href={landingLinks.editor}>{copy('Masuk', 'Sign In')} <ArrowUpRight size={15} /></a>
      <a className="landing-button landing-button-primary landing-header-cta" href="#pilihan-paket">{copy('Lihat Paket', 'View Plans')}</a>
      <button ref={toggleRef} className="landing-icon-button landing-menu-toggle" title={open ? copy('Tutup menu', 'Close menu') : copy('Buka menu', 'Open menu')} aria-label={open ? copy('Tutup menu', 'Close menu') : copy('Buka menu', 'Open menu')} aria-expanded={open} aria-controls="landing-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button>
    </div>
  </div>{open && <nav id="landing-mobile-nav" className="landing-mobile-nav" aria-label={copy('Navigasi seluler', 'Mobile navigation')}>{navigation.map(item => <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)}>{item.label}<ArrowUpRight size={16} /></a>)}</nav>}</header>;
}
