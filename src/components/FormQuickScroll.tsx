import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, ChevronsUpDown, GripHorizontal, Scaling, X } from 'lucide-react';

type Direction = 'up' | 'down';
type Position = { x: number; y: number };
interface Props { uiTheme?: 'light' | 'dark'; language?: 'id' | 'en' }

function readPreference(key: string): unknown {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function savePreference(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable. */ }
}
function scrollTarget(): HTMLElement {
  const panel = document.getElementById('customization-panel');
  if (panel && panel.clientHeight > 0 && panel.scrollHeight > panel.clientHeight
    && /auto|scroll|overlay/.test(getComputedStyle(panel).overflowY)) return panel;
  return (document.scrollingElement || document.documentElement) as HTMLElement;
}

export function FormQuickScroll({ uiTheme = 'light', language = 'id' }: Props) {
  const id = language === 'id';
  const dark = uiTheme === 'dark';
  const [expanded, setExpanded] = useState(() => readPreference('form_quick_scroll_expanded') === true);
  const [size, setSize] = useState(() => {
    const saved = readPreference('form_quick_scroll_dock_size');
    return typeof saved === 'number' && Number.isFinite(saved) ? Math.max(20, Math.min(48, saved)) : 26;
  });
  const [position, setPosition] = useState<Position>(() => {
    const saved = readPreference('form_quick_scroll_pos') as Partial<Position> | null;
    if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return saved as Position;
    return { x: typeof window === 'undefined' ? 24 : window.innerWidth - 48,
      y: typeof window === 'undefined' ? 300 : window.innerHeight - 150 };
  });
  const [picker, setPicker] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; origin: Position; moved: boolean } | null>(null);
  const moved = useRef(false);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<number | null>(null);
  const holding = useRef(false);
  const taps = useRef<Partial<Record<Direction, { time: number; timer: ReturnType<typeof setTimeout> }>>>({});
  const feedback = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clamp = useCallback((next: Position) => {
    const rect = root.current?.getBoundingClientRect();
    const width = rect?.width || 32, height = rect?.height || 32;
    return { x: Math.max(8, Math.min(window.innerWidth - width - 8, next.x)),
      y: Math.max(8, Math.min(window.innerHeight - height - 8, next.y)) };
  }, []);
  useLayoutEffect(() => {
    const fit = () => setPosition(prev => clamp(prev));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [clamp, expanded, size]);
  useEffect(() => savePreference('form_quick_scroll_pos', position), [position]);
  useEffect(() => savePreference('form_quick_scroll_expanded', expanded), [expanded]);
  useEffect(() => savePreference('form_quick_scroll_dock_size', size), [size]);

  const stopHold = useCallback(() => {
    if (hold.current !== null) clearTimeout(hold.current);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    hold.current = null;
    frame.current = null;
    holding.current = false;
    setActive(previous => previous === 'up' || previous === 'down' ? null : previous);
  }, []);
  useEffect(() => {
    const cancel = () => {
      stopHold();
      setActive(null);
      Object.values(taps.current).forEach(tap => tap && clearTimeout(tap.timer));
      taps.current = {};
      if (feedback.current !== null) clearTimeout(feedback.current);
    };
    const visibility = () => { if (document.hidden) cancel(); };
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancel();
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [stopHold]);
  useEffect(() => {
    if (!picker) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setPicker(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setPicker(false); };
    window.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', escape); };
  }, [picker]);

  const step = (direction: Direction) => scrollTarget().scrollBy({ top: direction === 'up' ? -340 : 340, behavior: 'smooth' });
  const tap = (direction: Direction) => {
    const previous = taps.current[direction];
    if (previous && performance.now() - previous.time <= 320) {
      clearTimeout(previous.timer);
      delete taps.current[direction];
      const target = scrollTarget();
      target.scrollTo({ top: direction === 'up' ? 0 : target.scrollHeight, behavior: 'smooth' });
      setActive(direction === 'up' ? 'top' : 'bottom');
      if (feedback.current !== null) clearTimeout(feedback.current);
      feedback.current = setTimeout(() => setActive(null), 700);
    } else {
      taps.current[direction] = { time: performance.now(), timer: setTimeout(() => {
        step(direction);
        delete taps.current[direction];
      }, 320) };
    }
  };
  const arrowDown = (direction: Direction, event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    stopHold();
    if (feedback.current !== null) clearTimeout(feedback.current);
    hold.current = setTimeout(() => {
      const pending = taps.current[direction];
      if (pending) clearTimeout(pending.timer);
      delete taps.current[direction];
      holding.current = true;
      setActive(direction);
      const started = performance.now();
      let last = started;
      const animate = (now: number) => {
        const speed = Math.min(1560, 720 + (now - started) * .6);
        scrollTarget().scrollTop += (direction === 'up' ? -1 : 1) * speed * Math.min(40, now - last) / 1000;
        last = now;
        frame.current = requestAnimationFrame(animate);
      };
      frame.current = requestAnimationFrame(animate);
    }, 220);
  };
  const arrowUp = (direction: Direction, event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const wasHolding = holding.current;
    stopHold();
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!wasHolding) tap(direction);
  };
  const startDrag = (event: React.PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || (event.target as HTMLElement).closest('[data-scroll-action]')) return;
    moved.current = false;
    drag.current = { x: event.clientX, y: event.clientY, origin: position, moved: false };
    const handle = (event.target as HTMLElement).closest('button') || event.currentTarget;
    handle.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
    if (Math.hypot(dx, dy) > 5) drag.current.moved = true;
    if (!drag.current.moved) return;
    moved.current = true;
    setDragging(true);
    setPosition(clamp({ x: drag.current.origin.x + dx, y: drag.current.origin.y + dy }));
  };
  const endDrag = () => { drag.current = null; setDragging(false); };
  const surface = dark ? 'bg-slate-900 text-slate-100 border-purple-500/50' : 'bg-white text-slate-700 border-purple-200';
  const arrowSize = Math.max(14, Math.round(size * .55));

  return <div ref={root} data-form-quick-scroll="true" className="fixed z-[75] select-none"
    style={{ left: position.x, top: position.y, touchAction: 'none' }} onContextMenu={event => event.preventDefault()}
    onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
    {!expanded ? <button type="button" aria-label={id ? 'Buka tombol scroll' : 'Open scroll controls'}
      title={id ? 'Klik untuk buka, geser untuk pindahkan' : 'Click to open, drag to move'}
      onClick={event => { if (event.detail === 0 || !moved.current) setExpanded(true); }}
      className="flex w-8 h-8 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg border border-purple-300 cursor-grab active:cursor-grabbing">
      <ChevronsUpDown className="w-4 h-4 pointer-events-none" />
    </button> : <div className={`flex flex-col items-center rounded-xl border p-1 shadow-xl ${surface} ${dragging ? 'ring-2 ring-purple-400' : ''}`}>
      <GripHorizontal aria-label={id ? 'Geser tombol scroll' : 'Drag scroll controls'} className="h-3 w-4 cursor-grab" />
      <div className="flex items-center justify-between w-full gap-1">
        <button data-scroll-action type="button" aria-label={id ? 'Atur ukuran panah' : 'Arrow size'} aria-expanded={picker}
          onClick={() => setPicker(value => !value)} className="p-0.5 rounded text-purple-500 hover:bg-purple-500/10"><Scaling className="w-3 h-3" /></button>
        <button data-scroll-action type="button" aria-label={id ? 'Ciutkan tombol scroll' : 'Collapse scroll controls'}
          onClick={() => { stopHold(); setExpanded(false); setPicker(false); }} className="p-0.5 rounded hover:bg-purple-500/10"><X className="w-3 h-3" /></button>
      </div>
      {(['up', 'down'] as const).map(direction => {
        const jumping = active === (direction === 'up' ? 'top' : 'bottom');
        const Icon = jumping ? (direction === 'up' ? ChevronsUp : ChevronsDown) : (direction === 'up' ? ChevronUp : ChevronDown);
        return <button data-scroll-action key={direction} type="button"
          aria-label={direction === 'up' ? (id ? 'Scroll ke atas' : 'Scroll up') : (id ? 'Scroll ke bawah' : 'Scroll down')}
          title={id ? 'Klik: 340px • Klik 2x: ujung halaman • Tahan: scroll terus' : 'Click: 340px • Double click: top/bottom • Hold: continuous scroll'}
          onPointerDown={event => arrowDown(direction, event)} onPointerUp={event => arrowUp(direction, event)}
          onPointerCancel={stopHold} onLostPointerCapture={stopHold}
          onClick={event => { if (event.detail === 0) step(direction); }}
          style={{ width: size, height: size, touchAction: 'none' }}
          className={`flex items-center justify-center rounded-lg cursor-pointer hover:bg-purple-500/15 ${jumping || active === direction ? 'bg-purple-600 text-white' : ''}`}>
          <Icon style={{ width: arrowSize, height: arrowSize }} className={jumping ? 'animate-bounce' : ''} />
        </button>;
      })}
      {picker && <div data-scroll-action role="group" aria-label={id ? 'Ukuran panah' : 'Arrow size'}
        className={`fixed w-[170px] p-3 rounded-xl border shadow-xl space-y-2 ${surface}`}
        style={{ top: Math.max(8, Math.min(window.innerHeight - 130, position.y)),
          left: Math.max(8, Math.min(window.innerWidth - 178, position.x > window.innerWidth / 2 ? position.x - 178 : position.x + size + 24)),
          maxWidth: 'calc(100vw - 16px)' }}>
        <label className="text-xs font-semibold block">{id ? 'Ukuran panah' : 'Arrow size'}: {size}px
          <input aria-label={id ? 'Ukuran panah' : 'Arrow size'} type="range" min={20} max={48} step={2} value={size}
            onChange={event => setSize(Number(event.target.value))} className="w-full accent-purple-600 mt-2" style={{ touchAction: 'none' }} />
        </label>
        <div className="grid grid-cols-4 gap-1">
          {[{ size: 20, label: 'XS' }, { size: 26, label: id ? 'Kecil' : 'Small' }, { size: 34, label: id ? 'Sedang' : 'Med' }, { size: 44, label: id ? 'Besar' : 'Large' }].map(preset =>
            <button type="button" key={preset.size} aria-pressed={size === preset.size} onClick={() => setSize(preset.size)}
              className={`text-[9px] py-1 rounded ${size === preset.size ? 'bg-purple-600 text-white' : 'hover:bg-purple-500/15'}`}>{preset.label}</button>)}
        </div>
      </div>}
    </div>}
  </div>;
}
