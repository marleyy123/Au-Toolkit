import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Eye, Maximize2, Minimize2, PictureInPicture2, Settings2, X } from 'lucide-react';

interface Props {
  sourceRef: React.RefObject<HTMLElement | null>;
  refreshKey: string;
  refreshData?: unknown;
  uiTheme: 'light' | 'dark';
  isOpen: boolean;
  onClose: () => void;
  onSwitchToFullPreview?: () => void;
  title?: string;
}

type SizePreset = 'small' | 'medium' | 'large';
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const readNumber = (key: string, fallback: number) => {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  } catch {
    return fallback;
  }
};

let floatingCloneSequence = 0;

function remapSvgDefinitionIds(root: HTMLElement): void {
  const prefix = `au-floating-${++floatingCloneSequence}-`;
  root.querySelectorAll<SVGSVGElement>('svg').forEach((svg, svgIndex) => {
    const replacements = new Map<string, string>();
    svg.querySelectorAll<SVGElement>('[id]').forEach((element) => {
      const oldId = element.id;
      if (!oldId) return;
      const nextId = `${prefix}${svgIndex}-${oldId}`;
      replacements.set(oldId, nextId);
      element.id = nextId;
    });
    if (replacements.size === 0) return;
    const elements = [svg, ...Array.from(svg.querySelectorAll<SVGElement>('*'))];
    const referenceAttributes = [
      'fill', 'stroke', 'filter', 'clip-path', 'mask',
      'marker-start', 'marker-mid', 'marker-end', 'href', 'xlink:href',
      'aria-labelledby', 'aria-describedby', 'style',
    ];
    elements.forEach((element) => {
      referenceAttributes.forEach((attribute) => {
        const current = element.getAttribute(attribute);
        if (!current) return;
        let next = current;
        replacements.forEach((newId, oldId) => {
          next = next.split(`url(#${oldId})`).join(`url(#${newId})`);
          if (next === `#${oldId}`) next = `#${newId}`;
          next = next.split(` ${oldId} `).join(` ${newId} `);
        });
        if (next !== current) element.setAttribute(attribute, next);
      });
    });
  });
}

/** Mobile-only mirror of the real preview DOM; it never creates an export target. */
export const MobileFloatingPreview: React.FC<Props> = ({
  sourceRef,
  refreshKey,
  refreshData,
  uiTheme,
  isOpen,
  onClose,
  onSwitchToFullPreview,
  title = 'Live Preview',
}) => {
  const viewportWidth = typeof window === 'undefined' ? 390 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 844 : window.innerHeight;
  const [width, setWidth] = useState(() => clamp(readNumber('mobile_pip_width', Math.min(260, viewportWidth * 0.65)), 160, 380));
  const [height, setHeight] = useState(() => clamp(readNumber('mobile_pip_height', Math.min(340, viewportHeight * 0.42)), 160, 520));
  const [scale, setScale] = useState(() => clamp(readNumber('mobile_pip_scale', 0.45), 0.2, 1));
  const [position, setPosition] = useState(() => ({
    x: Math.max(8, readNumber('mobile_pip_pos_x', viewportWidth - Math.min(260, viewportWidth * 0.65) - 12)),
    y: Math.max(60, readNumber('mobile_pip_pos_y', 110)),
  }));
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sizePreset, setSizePreset] = useState<SizePreset>('medium');
  const hostRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const resizeRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);
  const geometryRef = useRef({ position, width, height });
  const refreshPendingRef = useRef(false);
  geometryRef.current = { position, width, height };

  const refreshMirror = useCallback(() => {
    const source = sourceRef.current;
    const host = hostRef.current;
    if (!source || !host) return;
    const clone = source.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-floating-preview-clone', 'true');
    clone.setAttribute('aria-hidden', 'true');
    clone.style.pointerEvents = 'none';
    // Keep component/root IDs because several preview styles are intentionally
    // scoped to them. Only SVG definition IDs need isolation from the canonical
    // DOM; their url(#...) references are remapped together to avoid collisions.
    remapSvgDefinitionIds(clone);
    host.replaceChildren(clone);
    const sourceElements = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))];
    const cloneElements = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
    sourceElements.forEach((element, index) => {
      const clonedElement = cloneElements[index];
      if (!clonedElement) return;
      if (element.scrollTop) clonedElement.scrollTop = element.scrollTop;
      if (element.scrollLeft) clonedElement.scrollLeft = element.scrollLeft;
      if (element instanceof HTMLInputElement && clonedElement instanceof HTMLInputElement) {
        clonedElement.value = element.value;
        clonedElement.checked = element.checked;
      } else if (element instanceof HTMLTextAreaElement && clonedElement instanceof HTMLTextAreaElement) {
        clonedElement.value = element.value;
        clonedElement.textContent = element.value;
      } else if (element instanceof HTMLCanvasElement && clonedElement instanceof HTMLCanvasElement) {
        clonedElement.width = element.width;
        clonedElement.height = element.height;
        clonedElement.getContext('2d')?.drawImage(element, 0, 0);
      }
    });
  }, [sourceRef]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const source = sourceRef.current;
    if (!source) return;
    let active = true;
    const schedule = () => {
      if (!active) return;
      if (refreshPendingRef.current) return;
      refreshPendingRef.current = true;
      queueMicrotask(() => {
        if (!active) return;
        refreshPendingRef.current = false;
        refreshMirror();
      });
    };
    // Sync committed form changes even when the canonical preview is hidden.
    refreshMirror();
    const mutations = new MutationObserver(schedule);
    mutations.observe(source, { attributes: true, characterData: true, childList: true, subtree: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(source);
    source.addEventListener('load', schedule, true);
    source.addEventListener('scroll', schedule, true);
    void document.fonts?.ready.then(schedule).catch(() => {});
    return () => {
      active = false;
      mutations.disconnect();
      resize.disconnect();
      source.removeEventListener('load', schedule, true);
      source.removeEventListener('scroll', schedule, true);
      refreshPendingRef.current = false;
    };
  }, [isOpen, isMinimized, refreshKey, refreshData, refreshMirror, sourceRef]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const move = (event: PointerEvent) => {
      if (dragRef.current) {
        const panelWidth = isMinimized ? 150 : width;
        setPosition({
          x: clamp(dragRef.current.left + event.clientX - dragRef.current.x, 8, Math.max(8, window.innerWidth - panelWidth - 8)),
          y: clamp(dragRef.current.top + event.clientY - dragRef.current.y, 60, Math.max(60, window.innerHeight - 80)),
        });
      } else if (resizeRef.current) {
        setWidth(clamp(resizeRef.current.width + event.clientX - resizeRef.current.x, 160, Math.max(160, window.innerWidth - 16)));
        setHeight(clamp(resizeRef.current.height + event.clientY - resizeRef.current.y, 160, Math.max(160, window.innerHeight * 0.75)));
      }
    };
    const finish = () => {
      if (!dragRef.current && !resizeRef.current) return;
      dragRef.current = null;
      resizeRef.current = null;
      const geometry = geometryRef.current;
      try {
        localStorage.setItem('mobile_pip_pos_x', String(Math.round(geometry.position.x)));
        localStorage.setItem('mobile_pip_pos_y', String(Math.round(geometry.position.y)));
        localStorage.setItem('mobile_pip_width', String(Math.round(geometry.width)));
        localStorage.setItem('mobile_pip_height', String(Math.round(geometry.height)));
      } catch {}
    };
    const contain = () => setPosition((current) => ({
      x: clamp(current.x, 8, Math.max(8, window.innerWidth - (isMinimized ? 150 : width) - 8)),
      y: clamp(current.y, 60, Math.max(60, window.innerHeight - 80)),
    }));
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('resize', contain);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('resize', contain);
    };
  }, [isMinimized, width]);

  const startDrag = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('button')) return;
    dragRef.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y };
  };
  const applyPreset = (preset: SizePreset) => {
    const next = preset === 'small'
      ? { width: Math.min(190, window.innerWidth - 20), height: 240, scale: 0.35 }
      : preset === 'large'
        ? { width: Math.min(340, window.innerWidth - 16), height: 420, scale: 0.65 }
        : { width: Math.min(260, window.innerWidth - 20), height: 320, scale: 0.48 };
    setSizePreset(preset);
    setWidth(next.width);
    setHeight(next.height);
    setScale(next.scale);
    try {
      localStorage.setItem('mobile_pip_width', String(next.width));
      localStorage.setItem('mobile_pip_height', String(next.height));
      localStorage.setItem('mobile_pip_scale', String(next.scale));
    } catch {}
  };
  const changeScale = (delta: number) => {
    const next = clamp(Number((scale + delta).toFixed(2)), 0.2, 1);
    setScale(next);
    try { localStorage.setItem('mobile_pip_scale', String(next)); } catch {}
  };

  if (!isOpen) return null;
  const isDark = uiTheme === 'dark';
  if (isMinimized) return (
    <div data-no-swipe="true" data-mobile-floating-preview="true" onPointerDown={startDrag}
      style={{ left: position.x, top: position.y, touchAction: 'none' }}
      className={`fixed z-[70] lg:hidden flex cursor-move items-center gap-1.5 rounded-full border px-3 py-2 shadow-2xl ${isDark ? 'bg-slate-900/95 border-purple-500/60 text-white' : 'bg-white/95 border-purple-500/60 text-slate-900'}`}>
      <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-600" /></span>
      <Eye className="h-4 w-4 text-purple-500" />
      <span className="max-w-[80px] truncate text-[11px] font-extrabold">Preview</span>
      <button type="button" onClick={() => setIsMinimized(false)} className="rounded-full p-1 hover:bg-purple-500/20" title="Restore preview"><Maximize2 className="h-3.5 w-3.5" /></button>
      <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-red-500/20 hover:text-red-500" title="Close preview"><X className="h-3.5 w-3.5" /></button>
    </div>
  );

  return (
    <div data-no-swipe="true" data-mobile-floating-preview="true" style={{ left: position.x, top: position.y, width }}
      className={`fixed z-[70] lg:hidden flex flex-col overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'bg-slate-900/95 border-purple-500/50 text-white' : 'bg-white/95 border-purple-400/70 text-slate-900'}`}>
      <div onPointerDown={startDrag} style={{ touchAction: 'none' }} className={`flex cursor-move items-center justify-between border-b px-2.5 py-2 ${isDark ? 'bg-purple-950 border-purple-700' : 'bg-purple-100 border-purple-300'}`}>
        <div className="flex min-w-0 items-center gap-1.5 pr-1"><PictureInPicture2 className="h-3.5 w-3.5 shrink-0 text-purple-500" /><span className="truncate text-[11px] font-black">{title}</span></div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex items-center rounded-md border border-purple-300 bg-purple-200 px-1 py-0.5 text-[9px] font-extrabold text-purple-950 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-100">
            <button type="button" onClick={() => changeScale(-0.05)} className="px-1 font-black">−</button><span>{Math.round(scale * 100)}%</span><button type="button" onClick={() => changeScale(0.05)} className="px-1 font-black">+</button>
          </div>
          <button type="button" onClick={() => setShowSettings((value) => !value)} className={`rounded-md border p-1.5 ${showSettings ? 'bg-purple-700 text-white border-purple-800' : 'border-purple-300 bg-purple-200 text-purple-900 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200'}`} title="Preview size settings"><Settings2 className="h-3.5 w-3.5" /></button>
          {onSwitchToFullPreview && <button type="button" onClick={onSwitchToFullPreview} className="rounded-md border border-purple-300 bg-purple-200 p-1.5 text-purple-900 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200" title="Open full preview"><Maximize2 className="h-3.5 w-3.5" /></button>}
          <button type="button" onClick={() => setIsMinimized(true)} className="rounded-md border border-purple-300 bg-purple-200 p-1.5 text-purple-900 dark:border-purple-700 dark:bg-purple-900 dark:text-purple-200" title="Minimize preview"><Minimize2 className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={onClose} className="rounded-md border border-red-300 bg-red-100 p-1.5 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300" title="Close preview"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      {showSettings && <div className={`flex flex-wrap items-center gap-1.5 border-b px-2.5 py-1.5 text-[11px] ${isDark ? 'bg-slate-900 border-purple-800/40' : 'bg-slate-100 border-slate-200'}`}>
        <span>Ukuran:</span>{(['small', 'medium', 'large'] as SizePreset[]).map((preset) => <button key={preset} type="button" onClick={() => applyPreset(preset)} className={`rounded-md border px-2.5 py-1 font-normal ${sizePreset === preset ? 'border-purple-500 bg-purple-600 text-white' : isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-800'}`}>{preset === 'small' ? 'Kecil' : preset === 'medium' ? 'Sedang' : 'Besar'}</button>)}</div>}
      <div style={{ height, touchAction: 'pan-y' }} onWheel={(event) => { event.preventDefault(); changeScale(event.deltaY < 0 ? 0.05 : -0.05); }}
        onTouchStart={(event) => { if (event.touches.length !== 2) return; const [first, second] = [event.touches[0], event.touches[1]]; pinchRef.current = { distance: Math.max(1, Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)), scale }; }}
        onTouchMove={(event) => { if (event.touches.length !== 2 || !pinchRef.current) return; event.preventDefault(); const [first, second] = [event.touches[0], event.touches[1]]; const distance = Math.max(1, Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)); setScale(clamp(pinchRef.current.scale * (distance / pinchRef.current.distance), 0.2, 1)); }}
        onTouchEnd={(event) => { if (event.touches.length >= 2) return; pinchRef.current = null; try { localStorage.setItem('mobile_pip_scale', String(scale)); } catch {} }}
        className="relative flex w-full flex-col items-center justify-start overflow-y-auto overscroll-contain bg-slate-100/95 p-2 no-scrollbar dark:bg-slate-950/90">
        <div ref={hostRef} data-floating-preview-mirror="true" className="pointer-events-none flex shrink-0 origin-top flex-col items-center transition-transform duration-75" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} />
        <div onPointerDown={(event) => { event.stopPropagation(); event.preventDefault(); resizeRef.current = { x: event.clientX, y: event.clientY, width, height }; }} style={{ touchAction: 'none' }} className="sticky bottom-0 ml-auto flex h-8 w-8 cursor-nwse-resize items-end justify-end p-1.5 text-purple-600 dark:text-purple-400" title="Tahan & seret untuk besarkan/kecilkan">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="20" y1="8" x2="8" y2="20" /><line x1="20" y1="14" x2="14" y2="20" /></svg>
        </div>
        <div className="pointer-events-none sticky bottom-1 left-2 text-[8px] font-mono text-slate-500">↘ Seret sudut untuk besarin/kecilin</div>
      </div>
    </div>
  );
};
