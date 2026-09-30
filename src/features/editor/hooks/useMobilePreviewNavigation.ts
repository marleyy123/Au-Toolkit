import { useCallback, useEffect, useState } from 'react';

export function useMobilePreviewNavigation() {
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [isMobileFloatingPreviewOpen, setIsMobileFloatingPreviewOpen] = useState(() => {
    try {
      return localStorage.getItem('mobile_pip_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const setMobileFloatingPreviewOpen = useCallback((isOpen: boolean) => {
    setIsMobileFloatingPreviewOpen(isOpen);
    try {
      localStorage.setItem('mobile_pip_enabled', String(isOpen));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let isIgnoredTarget = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.innerWidth >= 1024) return;
      if (e.touches.length !== 1) return;

      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          '#preview-viewport-container, #preview-canvas-container, [data-preview-canvas], input, textarea, select, button, [role="slider"], .overflow-x-auto, [data-no-swipe], .no-swipe, a'
        )
      ) {
        isIgnoredTarget = true;
        return;
      }

      isIgnoredTarget = false;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (window.innerWidth >= 1024 || isIgnoredTarget) return;
      if (e.changedTouches.length !== 1) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);
      const duration = Date.now() - touchStartTime;

      if (absX >= 45 && absX > absY * 1.5 && duration < 600) {
        if (diffX > 0) {
          setMobileView((prev) => (prev === 'editor' ? 'preview' : 'editor'));
        } else {
          setMobileView((prev) => (prev === 'preview' ? 'editor' : 'preview'));
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return {
    mobileView,
    setMobileView,
    isMobileFloatingPreviewOpen,
    setMobileFloatingPreviewOpen,
  };
}
