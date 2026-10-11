import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useLandingLanguage } from '../hooks/useLandingLanguage';

const options = [{ value: 'id', label: 'Bahasa Indonesia' }, { value: 'en', label: 'English' }] as const;

export function LanguageMenu() {
  const { language, setLanguage, copy } = useLandingLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  const close = () => { setOpen(false); triggerRef.current?.focus(); };
  return <div className="landing-language" ref={containerRef} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <button ref={triggerRef} type="button" className="landing-language-trigger" aria-label={copy('Bahasa', 'Language')}
      aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => setOpen(current => !current)} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); }
      }}><Languages size={15} aria-hidden="true" /><span>{language.toUpperCase()}</span><ChevronDown size={13} aria-hidden="true" /></button>
    {open && <div ref={menuRef} id={menuId} role="menu" aria-label={copy('Bahasa', 'Language')} className="landing-language-menu"
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
        const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        const target = event.key === 'ArrowDown' ? (index + 1) % items.length
          : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length
          : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : null;
        if (target !== null) { event.preventDefault(); items[target].focus(); }
      }}>
      {options.map(option => <button key={option.value} type="button" role="menuitemradio" aria-checked={language === option.value}
        className="landing-language-option" tabIndex={-1} onClick={() => { setLanguage(option.value); close(); }}>
        <span className="landing-language-check">{language === option.value && <Check size={14} aria-hidden="true" />}</span>
        <span>{option.label}</span><span className="landing-language-code">{option.value.toUpperCase()}</span>
      </button>)}
    </div>}
  </div>;
}
