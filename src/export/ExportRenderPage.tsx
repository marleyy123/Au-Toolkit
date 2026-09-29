import React, { useEffect, useRef } from 'react';
import type { NativeExportPayload } from './exportPayload';
import { PreviewRegistry } from './PreviewRegistry';

declare global {
  interface Window {
    __AU_EXPORT_PAYLOAD__?: NativeExportPayload;
    __AU_EXPORT_READY__?: {
      ready: boolean;
      error?: string;
      width?: number;
      height?: number;
    };
  }
}

function customFontCss(payload: NativeExportPayload): string {
  return payload.fontFaces
    .map((font) => {
      const family = font.family.replace(/["'\\]/g, '');
      return `@font-face{font-family:"${family}";src:url("${font.dataUrl}");font-display:block;}`;
    })
    .join('\n');
}

export function ExportRenderPage() {
  const payload = window.__AU_EXPORT_PAYLOAD__;
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;background:transparent;';
    if (!payload) {
      window.__AU_EXPORT_READY__ = { ready: false, error: 'Missing private export payload.' };
      return;
    }

    let cancelled = false;
    const prepare = async () => {
      try {
        await document.fonts.ready;
        const images = Array.from(document.images);
        await Promise.all(images.map(async (image) => {
          if (image.complete && image.naturalWidth > 0) return;
          if (typeof image.decode === 'function') await image.decode();
        }));
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const root = previewRef.current;
        if (!root) throw new Error('Registered preview did not mount.');
        if (root.offsetWidth !== payload.canonicalWidth || root.offsetHeight !== payload.canonicalHeight) {
          throw new Error(
            `Canonical geometry mismatch: ${root.offsetWidth}x${root.offsetHeight}, expected ${payload.canonicalWidth}x${payload.canonicalHeight}.`
          );
        }
        if (!cancelled) {
          window.__AU_EXPORT_READY__ = {
            ready: true,
            width: root.offsetWidth,
            height: root.offsetHeight,
          };
        }
      } catch (error) {
        if (!cancelled) {
          window.__AU_EXPORT_READY__ = {
            ready: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    };
    void prepare();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!payload) return <div aria-hidden="true" />;

  return (
    <>
      {payload.fontFaces.length > 0 && <style>{customFontCss(payload)}</style>}
      <div
        id="au-export-render-target"
        data-au-export-render-target="true"
        style={{
          width: `${payload.canonicalWidth}px`,
          height: `${payload.canonicalHeight}px`,
          minWidth: `${payload.canonicalWidth}px`,
          minHeight: `${payload.canonicalHeight}px`,
          maxWidth: `${payload.canonicalWidth}px`,
          maxHeight: `${payload.canonicalHeight}px`,
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          transform: 'none',
          background: payload.backgroundColor,
          ['--selected-global-font' as string]: payload.fontCss,
          fontFamily: payload.fontCss,
        }}
      >
        <PreviewRegistry
          previewKey={payload.previewKey}
          data={payload.data}
          previewRef={previewRef}
          fontCss={payload.fontCss}
        />
      </div>
    </>
  );
}
