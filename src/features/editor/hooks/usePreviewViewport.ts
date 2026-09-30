import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import type { ViewportTransform } from '../../../types';

const getStoredViewport = (): ViewportTransform => {
  try {
    const px = Number(localStorage.getItem('preview_pan_x')) || 0;
    const py = Number(localStorage.getItem('preview_pan_y')) || 0;
    const savedZoom = localStorage.getItem('preview_zoom');
    const zoom = savedZoom ? Math.min(200, Math.max(30, Number(savedZoom))) : 75;
    return { x: px, y: py, scale: zoom };
  } catch {
    return { x: 0, y: 0, scale: 75 };
  }
};

const isInteractiveTarget = (target: HTMLElement | null) =>
  Boolean(
    target &&
      (target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('[role="slider"]') ||
        target.closest('.no-drag'))
  );

export function usePreviewViewport() {
  const [currentViewport, setCurrentViewport] = useState<ViewportTransform>(getStoredViewport);
  const [lockedViewport, setLockedViewport] = useState<ViewportTransform>(getStoredViewport);
  const [isPreviewLocked, setIsPreviewLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('preview_is_locked');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false);

  const renderViewport: ViewportTransform = isPreviewLocked ? lockedViewport : currentViewport;
  const previewZoom = renderViewport.scale;
  const previewPan = { x: renderViewport.x, y: renderViewport.y };

  const previewViewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPointerDownRef = useRef<boolean>(false);
  const activePointerIdRef = useRef<number | null>(null);
  const transientPanRef = useRef<{ x: number; y: number }>({ x: renderViewport.x, y: renderViewport.y });
  const rafIdRef = useRef<number | null>(null);
  const previewZoomRef = useRef<number>(renderViewport.scale);
  previewZoomRef.current = renderViewport.scale;
  const previewPanRef = useRef<{ x: number; y: number }>({ x: renderViewport.x, y: renderViewport.y });
  previewPanRef.current = { x: renderViewport.x, y: renderViewport.y };
  const isPreviewLockedRef = useRef<boolean>(isPreviewLocked);
  isPreviewLockedRef.current = isPreviewLocked;

  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    initialMid: { x: number; y: number };
    lastTouchPos: { x: number; y: number };
    isPanning: boolean;
  }>({
    initialDist: 0,
    initialZoom: 75,
    initialPan: { x: 0, y: 0 },
    initialMid: { x: 0, y: 0 },
    lastTouchPos: { x: 0, y: 0 },
    isPanning: false,
  });

  useEffect(() => {
    transientPanRef.current = { x: renderViewport.x, y: renderViewport.y };
    previewPanRef.current = { x: renderViewport.x, y: renderViewport.y };
  }, [renderViewport.x, renderViewport.y]);

  useEffect(() => {
    previewZoomRef.current = renderViewport.scale;
  }, [renderViewport.scale]);

  const setPreviewZoom = useCallback((newScaleOrFn: number | ((prev: number) => number)) => {
    if (isPreviewLockedRef.current) return;
    setCurrentViewport((prev) => {
      const nextScale = typeof newScaleOrFn === 'function' ? newScaleOrFn(prev.scale) : newScaleOrFn;
      const clamped = Math.min(200, Math.max(30, nextScale));
      previewZoomRef.current = clamped;
      try {
        localStorage.setItem('preview_zoom', String(clamped));
      } catch {}
      return { ...prev, scale: clamped };
    });
  }, []);

  const setPreviewPan = useCallback((newPanOrFn: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    if (isPreviewLockedRef.current) return;
    setCurrentViewport((prev) => {
      const nextPan = typeof newPanOrFn === 'function' ? newPanOrFn({ x: prev.x, y: prev.y }) : newPanOrFn;
      previewPanRef.current = nextPan;
      transientPanRef.current = nextPan;
      try {
        localStorage.setItem('preview_pan_x', String(Math.round(nextPan.x)));
        localStorage.setItem('preview_pan_y', String(Math.round(nextPan.y)));
      } catch {}
      return { ...prev, x: nextPan.x, y: nextPan.y };
    });
  }, []);

  const handleToggleLockPreview = () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    isPointerDownRef.current = false;
    activePointerIdRef.current = null;
    setIsDraggingCanvas(false);
    if (touchStateRef.current) {
      touchStateRef.current.isPanning = false;
      touchStateRef.current.initialDist = 0;
    }

    let liveX = Math.round(transientPanRef.current.x);
    let liveY = Math.round(transientPanRef.current.y);
    let liveScale = previewZoomRef.current;

    const container = document.getElementById('preview-canvas-container');
    if (container && container.style.transform) {
      const match = container.style.transform.match(/translate3d\(([-0-9.]+)px,\s*([-0-9.]+)px/);
      if (match) {
        liveX = Math.round(parseFloat(match[1]));
        liveY = Math.round(parseFloat(match[2]));
      }
      const scaleMatch = container.style.transform.match(/scale\(([-0-9.]+)\)/);
      if (scaleMatch) {
        liveScale = Math.round(parseFloat(scaleMatch[1]) * 100);
      }
    }

    if (!isPreviewLocked) {
      const frozen: ViewportTransform = { x: liveX, y: liveY, scale: liveScale };
      setLockedViewport(frozen);
      setCurrentViewport(frozen);
      setIsPreviewLocked(true);
      isPreviewLockedRef.current = true;
      transientPanRef.current = { x: liveX, y: liveY };
      previewPanRef.current = { x: liveX, y: liveY };
      previewZoomRef.current = liveScale;

      if (container) {
        container.style.transition = 'none';
        container.style.transform = `translate3d(${liveX}px, ${liveY}px, 0) scale(${liveScale / 100})`;
      }

      try {
        localStorage.setItem('preview_is_locked', 'true');
        localStorage.setItem('preview_pan_x', String(liveX));
        localStorage.setItem('preview_pan_y', String(liveY));
        localStorage.setItem('preview_zoom', String(liveScale));
      } catch {}
    } else {
      const preserved: ViewportTransform = { ...lockedViewport };
      setCurrentViewport(preserved);
      setIsPreviewLocked(false);
      isPreviewLockedRef.current = false;
      transientPanRef.current = { x: preserved.x, y: preserved.y };
      previewPanRef.current = { x: preserved.x, y: preserved.y };
      previewZoomRef.current = preserved.scale;

      if (container) {
        container.style.transition = 'none';
        container.style.transform = `translate3d(${preserved.x}px, ${preserved.y}px, 0) scale(${preserved.scale / 100})`;
      }

      try {
        localStorage.setItem('preview_is_locked', 'false');
      } catch {}
    }
  };

  const handleZoomIn = () => {
    if (isPreviewLockedRef.current) return;
    setPreviewZoom((prev) => {
      const next = Math.min(200, prev + 10);
      previewZoomRef.current = next;
      try {
        localStorage.setItem('preview_zoom', String(next));
      } catch {}
      return next;
    });
  };

  const handleZoomOut = () => {
    if (isPreviewLockedRef.current) return;
    setPreviewZoom((prev) => {
      const next = Math.max(30, prev - 10);
      previewZoomRef.current = next;
      try {
        localStorage.setItem('preview_zoom', String(next));
      } catch {}
      return next;
    });
  };

  const handleZoomReset = () => {
    if (isPreviewLockedRef.current) return;
    setPreviewZoom(75);
    setPreviewPan({ x: 0, y: 0 });
    previewZoomRef.current = 75;
    previewPanRef.current = { x: 0, y: 0 };
    transientPanRef.current = { x: 0, y: 0 };
    try {
      localStorage.setItem('preview_zoom', '75');
      localStorage.setItem('preview_pan_x', '0');
      localStorage.setItem('preview_pan_y', '0');
    } catch {}
    const container = document.getElementById('preview-canvas-container');
    if (container) {
      container.style.transform = 'translate3d(0px, 0px, 0) scale(0.75)';
    }
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isPreviewLockedRef.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (isInteractiveTarget(e.target as HTMLElement | null)) return;

    isPointerDownRef.current = true;
    activePointerIdRef.current = e.pointerId;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    transientPanRef.current = { ...previewPanRef.current };
    setIsDraggingCanvas(true);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isPreviewLockedRef.current || isPointerDownRef.current) return;
    if (isInteractiveTarget(e.target as HTMLElement | null)) return;
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    transientPanRef.current = { ...previewPanRef.current };
    setIsDraggingCanvas(true);
  };

  const handleDoubleClickViewport = (e: MouseEvent) => {
    if (isPreviewLockedRef.current) return;
    const target = e.target as HTMLElement;
    if (['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'A'].includes(target.tagName) || target.closest('button')) {
      return;
    }
    if (previewZoom === 75 && previewPan.x === 0 && previewPan.y === 0) {
      setPreviewZoom(120);
      previewZoomRef.current = 120;
    } else {
      setPreviewZoom(75);
      setPreviewPan({ x: 0, y: 0 });
      previewZoomRef.current = 75;
      previewPanRef.current = { x: 0, y: 0 };
      transientPanRef.current = { x: 0, y: 0 };
    }
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e: globalThis.PointerEvent) => {
      if (isPreviewLockedRef.current || !isPointerDownRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const nextX = transientPanRef.current.x + dx;
      const nextY = transientPanRef.current.y + dy;
      transientPanRef.current = { x: nextX, y: nextY };
      previewPanRef.current = { x: nextX, y: nextY };

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const container = document.getElementById('preview-canvas-container');
        if (container) {
          const zoom = previewZoomRef.current;
          container.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${zoom / 100})`;
        }
      });
    };

    const handleGlobalPointerUp = (e: globalThis.PointerEvent) => {
      if (isPointerDownRef.current && (activePointerIdRef.current === null || e.pointerId === activePointerIdRef.current)) {
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;
        setIsDraggingCanvas(false);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        const finalX = Math.round(transientPanRef.current.x);
        const finalY = Math.round(transientPanRef.current.y);
        setPreviewPan({ x: finalX, y: finalY });
        try {
          localStorage.setItem('preview_pan_x', String(finalX));
          localStorage.setItem('preview_pan_y', String(finalY));
        } catch {}
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [setPreviewPan]);

  useEffect(() => {
    const el = previewViewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (isPreviewLockedRef.current) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top;
      const currentZoom = previewZoomRef.current;
      const step = (e.ctrlKey || e.metaKey) ? 12 : 8;
      const zoomDelta = e.deltaY < 0 ? step : -step;
      const targetZoom = Math.min(200, Math.max(30, currentZoom + zoomDelta));
      if (targetZoom === currentZoom) return;

      const scaleOld = currentZoom / 100;
      const scaleNew = targetZoom / 100;
      const currentPan = transientPanRef.current;
      const newPanX = cursorX - (cursorX - currentPan.x) * (scaleNew / scaleOld);
      const newPanY = cursorY - (cursorY - currentPan.y) * (scaleNew / scaleOld);

      transientPanRef.current = { x: newPanX, y: newPanY };
      previewPanRef.current = { x: newPanX, y: newPanY };
      previewZoomRef.current = targetZoom;

      setPreviewZoom(targetZoom);
      setPreviewPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
      try {
        localStorage.setItem('preview_zoom', String(targetZoom));
        localStorage.setItem('preview_pan_x', String(Math.round(newPanX)));
        localStorage.setItem('preview_pan_y', String(Math.round(newPanY)));
      } catch {}

      const container = document.getElementById('preview-canvas-container');
      if (container) {
        container.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale(${scaleNew})`;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isPreviewLockedRef.current) {
        touchStateRef.current.isPanning = false;
        touchStateRef.current.initialDist = 0;
        return;
      }

      const target = e.target as HTMLElement | null;
      if (target && (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('[data-no-swipe]'))) {
        return;
      }

      if (e.touches.length >= 2) {
        e.preventDefault();
        isPointerDownRef.current = false;
        activePointerIdRef.current = null;

        const rect = el.getBoundingClientRect();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midClientX = (t1.clientX + t2.clientX) / 2;
        const midClientY = (t1.clientY + t2.clientY) / 2;
        const midX = midClientX - rect.left - rect.width / 2;
        const midY = midClientY - rect.top;

        touchStateRef.current = {
          initialDist: dist > 0 ? dist : 1,
          initialZoom: previewZoomRef.current,
          initialPan: { ...previewPanRef.current },
          initialMid: { x: midX, y: midY },
          lastTouchPos: { x: midClientX, y: midClientY },
          isPanning: true,
        };
        setIsDraggingCanvas(true);
      } else {
        touchStateRef.current.isPanning = false;
        touchStateRef.current.initialDist = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPreviewLockedRef.current) return;

      if (e.touches.length >= 2) {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        const midClientX = (t1.clientX + t2.clientX) / 2;
        const midClientY = (t1.clientY + t2.clientY) / 2;
        const currentMidX = midClientX - rect.left - rect.width / 2;
        const currentMidY = midClientY - rect.top;

        if (!touchStateRef.current.isPanning || touchStateRef.current.initialDist <= 0) {
          touchStateRef.current = {
            initialDist: currentDist > 0 ? currentDist : 1,
            initialZoom: previewZoomRef.current,
            initialPan: { ...previewPanRef.current },
            initialMid: { x: currentMidX, y: currentMidY },
            lastTouchPos: { x: midClientX, y: midClientY },
            isPanning: true,
          };
          setIsDraggingCanvas(true);
          return;
        }

        const scale = currentDist / touchStateRef.current.initialDist;
        const targetZoom = Math.min(200, Math.max(30, Math.round(touchStateRef.current.initialZoom * scale)));
        const scaleInitial = touchStateRef.current.initialZoom / 100;
        const scaleNew = targetZoom / 100;
        const focalPanX = currentMidX - (touchStateRef.current.initialMid.x - touchStateRef.current.initialPan.x) * (scaleNew / scaleInitial);
        const focalPanY = currentMidY - (touchStateRef.current.initialMid.y - touchStateRef.current.initialPan.y) * (scaleNew / scaleInitial);

        transientPanRef.current = { x: focalPanX, y: focalPanY };
        previewPanRef.current = { x: focalPanX, y: focalPanY };
        previewZoomRef.current = targetZoom;

        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          const container = document.getElementById('preview-canvas-container');
          if (container) {
            container.style.transform = `translate3d(${focalPanX}px, ${focalPanY}px, 0) scale(${scaleNew})`;
          }
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2 && touchStateRef.current.isPanning) {
        touchStateRef.current.isPanning = false;
        touchStateRef.current.initialDist = 0;
        setIsDraggingCanvas(false);
        const finalZoom = previewZoomRef.current;
        const finalX = Math.round(transientPanRef.current.x);
        const finalY = Math.round(transientPanRef.current.y);
        setPreviewZoom(finalZoom);
        setPreviewPan({ x: finalX, y: finalY });
        try {
          localStorage.setItem('preview_zoom', String(finalZoom));
          localStorage.setItem('preview_pan_x', String(finalX));
          localStorage.setItem('preview_pan_y', String(finalY));
        } catch {}
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [setPreviewPan, setPreviewZoom]);

  return {
    previewViewportRef,
    previewZoom,
    previewPan,
    isPreviewLocked,
    isDraggingCanvas,
    setPreviewZoom,
    setPreviewPan,
    handleToggleLockPreview,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handlePointerDown,
    handleMouseDown,
    handleDoubleClickViewport,
  };
}
