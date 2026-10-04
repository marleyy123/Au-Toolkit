import html2canvas from 'html2canvas-pro';
import JSZip from 'jszip';
import { resolveHighestResolutionSource } from './imageRegistry';
import { waitForPendingEmojiAssets } from './emojiUtils';
import { getRegisteredExportContext } from '../export/exportContext';

const EXPORT_ASSET_TIMEOUT_MS = 15000;
const DESKTOP_EXPORT_VIEWPORT_WIDTH = 1920;
const DESKTOP_EXPORT_VIEWPORT_HEIGHT = 1080;

function withExportTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), EXPORT_ASSET_TIMEOUT_MS);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function waitForFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await withExportTimeout(
    document.fonts.ready.then(() => undefined),
    'Font belum selesai dimuat. Tunggu hingga font siap lalu coba export lagi.'
  );
  if (document.fonts.status !== 'loaded') {
    throw new Error('Font belum siap untuk export.');
  }
}

async function waitForElementFonts(element: HTMLElement): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const descriptors = new Map<string, string>();
  const elements = [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))];
  elements.forEach((node) => {
    const text = (node.textContent || '').trim();
    if (!text) return;
    const style = window.getComputedStyle(node);
    const descriptor = `${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${style.fontSize || '16px'} ${style.fontFamily}`;
    if (!descriptors.has(descriptor)) descriptors.set(descriptor, text.slice(0, 64));
  });
  await withExportTimeout(
    Promise.all(Array.from(descriptors, ([descriptor, text]) => document.fonts.load(descriptor, text))).then(() => undefined),
    'Font yang digunakan Live Preview belum siap untuk export.'
  );
  const unavailable = Array.from(descriptors).find(([descriptor, text]) => !document.fonts.check(descriptor, text));
  if (unavailable) throw new Error(`Font Live Preview belum tersedia untuk export: ${unavailable[0]}`);
}

type ExportDiagnosticRecord = Record<string, unknown>;
type ExportDiagnosticBridge = Window & {
  __AU_EXPORT_DIAGNOSTIC__?: {
    enabled?: boolean;
    record?: (entry: ExportDiagnosticRecord) => void;
  };
};

function getExportDiagnosticBridge(): ExportDiagnosticBridge['__AU_EXPORT_DIAGNOSTIC__'] | undefined {
  if (typeof window === 'undefined') return undefined;
  const bridge = (window as ExportDiagnosticBridge).__AU_EXPORT_DIAGNOSTIC__;
  return bridge?.enabled ? bridge : undefined;
}

const canvasFontAscentCache = new Map<string, number>();
const canvasFontFamilyCache = new Map<string, string | null>();

function splitFontFamilies(fontFamily: string): string[] {
  return (fontFamily.match(/(?:"[^"]*"|'[^']*'|[^,])+/g) || [])
    .map((family) => family.trim())
    .filter(Boolean);
}

function buildCanvasFont(style: CSSStyleDeclaration, fontFamily: string): string {
  const variant = style.fontVariant && style.fontVariant !== 'normal' ? `${style.fontVariant} ` : '';
  return `${style.fontStyle || 'normal'} ${variant}${style.fontWeight || '400'} ${style.fontSize || '16px'} ${fontFamily}`;
}

interface CanonicalGlyphSample {
  glyph: string;
  width: number;
}

function readCanonicalGlyphSamples(element: HTMLElement, visualScaleX: number): CanonicalGlyphSample[] {
  const samples: CanonicalGlyphSample[] = [];
  const safeScale = Number.isFinite(visualScaleX) && visualScaleX > 0 ? visualScaleX : 1;
  const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType !== Node.TEXT_NODE || !child.textContent?.trim()) continue;
    const text = child.textContent;
    const segments = segmenter
      ? Array.from(segmenter.segment(text), (entry) => ({ glyph: entry.segment, index: entry.index }))
      : Array.from(text).map((glyph, index, all) => ({
          glyph,
          index: all.slice(0, index).join('').length,
        }));

    for (const segment of segments) {
      if (!segment.glyph.trim()) continue;
      const range = element.ownerDocument.createRange();
      range.setStart(child, segment.index);
      range.setEnd(child, segment.index + segment.glyph.length);
      const rect = range.getBoundingClientRect();
      const width = rect.width / safeScale;
      if (Number.isFinite(width) && width > 0.05) samples.push({ glyph: segment.glyph, width });
      if (samples.length >= 32) return samples;
    }
  }
  return samples;
}

function fontMetricError(
  context: CanvasRenderingContext2D,
  style: CSSStyleDeclaration,
  fontFamily: string,
  samples: CanonicalGlyphSample[]
): number {
  context.font = buildCanvasFont(style, fontFamily);
  if ('fontKerning' in context) context.fontKerning = 'none';
  let total = 0;
  for (const sample of samples) {
    const measured = context.measureText(sample.glyph).width;
    total += Math.abs(measured - sample.width) / Math.max(sample.width, 1);
  }
  return samples.length ? total / samples.length : Number.POSITIVE_INFINITY;
}

/**
 * CSS and Canvas can resolve the same system-font stack to different faces on
 * Samsung/Android. Match the Canvas face against glyph widths already laid out
 * by the canonical DOM, then pin only the renderer clone to that exact family.
 */
function resolveCanvasCompatibleFontFamily(
  element: HTMLElement,
  style: CSSStyleDeclaration,
  visualScaleX: number
): string | null {
  const samples = readCanonicalGlyphSamples(element, visualScaleX);
  if (samples.length < 2) return null;

  const cacheKey = [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    style.fontSize,
    style.fontFamily,
    samples.map((sample) => sample.glyph).join('').slice(0, 32),
  ].join('|');
  if (canvasFontFamilyCache.has(cacheKey)) return canvasFontFamilyCache.get(cacheKey) || null;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;

  const originalFamily = style.fontFamily;
  const originalError = fontMetricError(context, style, originalFamily, samples);
  let bestFamily = originalFamily;
  let bestError = originalError;

  for (const candidate of splitFontFamilies(originalFamily)) {
    const error = fontMetricError(context, style, candidate, samples);
    if (error < bestError) {
      bestError = error;
      bestFamily = candidate;
    }
  }

  // Avoid changing desktop/webfont output for noise-sized kerning differences.
  // A real fallback mismatch is materially larger and the selected face must
  // improve the canonical-vs-Canvas metric by at least 20%.
  const resolved = originalError > 0.035 && bestError <= originalError * 0.8
    ? bestFamily
    : null;
  canvasFontFamilyCache.set(cacheKey, resolved);
  return resolved;
}

function getCanvasPainterAscent(style: CSSStyleDeclaration, fontFamily?: string | null): number | null {
  const font = fontFamily
    ? buildCanvasFont(style, fontFamily)
    : (style.font || buildCanvasFont(style, style.fontFamily));
  const cached = canvasFontAscentCache.get(font);
  if (cached !== undefined) return cached;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.font = font;
  const metrics = context.measureText('Mg');
  const extendedMetrics = metrics as TextMetrics & {
    fontBoundingBoxAscent?: number;
  };
  const fontSize = Number.parseFloat(style.fontSize) || 0;
  const ascent = Number.isFinite(extendedMetrics.fontBoundingBoxAscent)
    ? extendedMetrics.fontBoundingBoxAscent!
    : Number.isFinite(metrics.actualBoundingBoxAscent)
      ? metrics.actualBoundingBoxAscent
      : fontSize;
  canvasFontAscentCache.set(font, ascent);
  return ascent;
}

/**
 * Measures the real CSS inline baseline chosen by the canonical browser.
 * Range rectangles expose the glyph/line fragment top but not its baseline;
 * a zero-size inline-block aligned to `baseline` exposes that missing Y value
 * without changing line width, wrapping, or persistent DOM state.
 */
function getCanonicalTextBaselineCorrection(
  element: HTMLElement,
  style: CSSStyleDeclaration,
  visualScaleY: number,
  fontFamily?: string | null
): number | null {
  if (element.children.length > 0 || style.transform !== 'none') return null;
  const textNodes = Array.from(element.childNodes).filter(
    (child): child is Text => child.nodeType === Node.TEXT_NODE && Boolean(child.textContent?.trim())
  );
  const lastTextNode = textNodes.at(-1);
  if (!lastTextNode) return null;

  const range = element.ownerDocument.createRange();
  range.selectNodeContents(lastTextNode);
  const fragments = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 || rect.height > 0);
  const lastFragment = fragments.at(-1);
  if (!lastFragment) return null;

  const marker = element.ownerDocument.createElement('span');
  marker.setAttribute('aria-hidden', 'true');
  marker.style.cssText = [
    'display:inline-block',
    'width:0',
    'height:0',
    'margin:0',
    'padding:0',
    'border:0',
    'overflow:hidden',
    'font-size:0',
    'line-height:0',
    'vertical-align:baseline',
  ].join(';');

  element.appendChild(marker);
  const canonicalBaselineY = marker.getBoundingClientRect().top;
  marker.remove();

  const lineHeight = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) || 0;
  if (
    !Number.isFinite(canonicalBaselineY)
    || Math.abs(canonicalBaselineY - lastFragment.top) > Math.max(lineHeight * 2, 8)
  ) {
    return null;
  }

  const painterAscent = getCanvasPainterAscent(style, fontFamily);
  if (painterAscent === null) return null;
  const safeScale = Number.isFinite(visualScaleY) && visualScaleY > 0 ? visualScaleY : 1;
  const canonicalAscent = (canonicalBaselineY - lastFragment.top) / safeScale;
  const correction = canonicalAscent - painterAscent;
  return Number.isFinite(correction) && Math.abs(correction) <= Math.max(lineHeight, 4)
    ? correction
    : null;
}

function readDiagnosticMetrics(root: HTMLElement): ExportDiagnosticRecord[] {
  const rootRect = root.getBoundingClientRect();
  const ownerWindow = root.ownerDocument.defaultView || window;
  const nodes = [root, ...Array.from(root.querySelectorAll<HTMLElement>('[data-au-export-diag]'))]
    .filter((node, index, all) => all.indexOf(node) === index && Boolean(node.dataset.auExportDiag));

  return nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    const style = ownerWindow.getComputedStyle(node);
    const range = root.ownerDocument.createRange();
    range.selectNodeContents(node);
    const textRect = range.getBoundingClientRect();
    return {
      id: node.dataset.auExportDiag,
      text: (node.textContent || '').trim().slice(0, 160),
      rect: {
        x: rect.x - rootRect.x,
        y: rect.y - rootRect.y,
        width: rect.width,
        height: rect.height,
      },
      textRect: {
        x: textRect.x - rootRect.x,
        y: textRect.y - rootRect.y,
        width: textRect.width,
        height: textRect.height,
      },
      box: {
        clientWidth: node.clientWidth,
        clientHeight: node.clientHeight,
        offsetWidth: node.offsetWidth,
        offsetHeight: node.offsetHeight,
        scrollWidth: node.scrollWidth,
        scrollHeight: node.scrollHeight,
      },
      computed: {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        whiteSpace: style.whiteSpace,
        wordBreak: style.wordBreak,
        overflowWrap: style.overflowWrap,
        textSizeAdjust: style.getPropertyValue('text-size-adjust'),
        webkitTextSizeAdjust: style.getPropertyValue('-webkit-text-size-adjust'),
        transform: style.transform,
        zoom: style.getPropertyValue('zoom'),
        display: style.display,
        position: style.position,
      },
    };
  });
}

async function waitForImageReady(img: HTMLImageElement): Promise<void> {
  if (!img.getAttribute('src') && !img.src) return;
  if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    await withExportTimeout(
      new Promise<void>((resolve, reject) => {
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => reject(new Error(`Gambar gagal dimuat: ${img.alt || 'media preview'}`)), { once: true });
      }),
      `Gambar belum selesai dimuat: ${img.alt || 'media preview'}`
    );
  }
  if (typeof img.decode === 'function') {
    try {
      await withExportTimeout(
        img.decode(),
        `Gambar belum selesai didekode: ${img.alt || 'media preview'}`
      );
    } catch (error) {
      // Chromium may reject decode() on a freshly cloned image even though its
      // complete natural-size pixels are already available. That is safe to
      // capture; a zero-sized/failed image still remains a hard export error.
      if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) throw error;
    }
  }
  if (!img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    throw new Error(`Gambar gagal dimuat: ${img.alt || 'media preview'}`);
  }
}

/**
 * Determine a solid background color for the node to avoid transparent checkered artifacts
 */
function getSolidBackgroundColor(element: HTMLElement): string {
  if (!element) return '#ffffff';
  
  const computed = window.getComputedStyle(element).backgroundColor;
  if (computed && computed !== 'rgba(0, 0, 0, 0)' && computed !== 'transparent') {
    return computed;
  }

  if (element.style.backgroundColor) {
    return element.style.backgroundColor;
  }

  if (element.classList.contains('bg-black') || element.classList.contains('dark')) {
    return '#000000';
  }

  if (element.classList.contains('bg-[#15202b]')) {
    return '#15202b';
  }

  return '#ffffff';
}

/**
 * Synchronize runtime-only state into the renderer clone. The renderer supports
 * CSS Color 4 directly, so no computed styles or stylesheets are rewritten.
 */
function synchronizeClonedNode(
  clonedTarget: HTMLElement,
  originalNode: HTMLElement
) {
  const originalEls = [originalNode, ...Array.from(originalNode.querySelectorAll<HTMLElement>('*'))];
  const clonedEls = [clonedTarget, ...Array.from(clonedTarget.querySelectorAll<HTMLElement>('*'))];
  const count = Math.min(originalEls.length, clonedEls.length);

  for (let i = 0; i < count; i++) {
    const origEl = originalEls[i];
    const clonedEl = clonedEls[i];
    if (origEl instanceof HTMLInputElement && clonedEl instanceof HTMLInputElement) {
      clonedEl.value = origEl.value;
      clonedEl.setAttribute('value', origEl.value);
      clonedEl.checked = origEl.checked;
    } else if (origEl instanceof HTMLTextAreaElement && clonedEl instanceof HTMLTextAreaElement) {
      clonedEl.value = origEl.value;
      clonedEl.textContent = origEl.value;
    } else if (origEl instanceof HTMLSelectElement && clonedEl instanceof HTMLSelectElement) {
      clonedEl.value = origEl.value;
      Array.from(clonedEl.options).forEach((option) => {
        option.selected = option.value === origEl.value;
      });
    } else if (origEl instanceof HTMLCanvasElement && clonedEl instanceof HTMLCanvasElement) {
      clonedEl.width = origEl.width;
      clonedEl.height = origEl.height;
      clonedEl.getContext('2d')?.drawImage(origEl, 0, 0);
    }
    clonedEl.scrollTop = origEl.scrollTop;
    clonedEl.scrollLeft = origEl.scrollLeft;
  }
}

interface DesktopCanonicalStage {
  iframe: HTMLIFrameElement;
  element: HTMLElement;
  document: Document;
  destroy: () => void;
}

type ChatScrollPosition = { top: number; left: number };

function readChatScrollPositions(element: HTMLElement): ChatScrollPosition[] {
  return Array.from(element.querySelectorAll<HTMLElement>('[data-chat-scroll="true"]'))
    .map((chat) => ({ top: chat.scrollTop, left: chat.scrollLeft }));
}

function restoreChatScrollPositions(element: HTMLElement, positions: ChatScrollPosition[]): void {
  element.querySelectorAll<HTMLElement>('[data-chat-scroll="true"]').forEach((chat, index) => {
    const position = positions[index];
    if (!position) return;
    chat.style.scrollBehavior = 'auto';
    chat.scrollTop = position.top;
    chat.scrollLeft = position.left;
  });
}

function readPixelWidthFromClasses(element: HTMLElement): number | null {
  const className = [
    typeof element.className === 'string' ? element.className : '',
    element.getAttribute('class') || '',
  ].join(' ');
  const widths = Array.from(className.matchAll(/(?:^|\s)(?:w|min-w|max-w)-\[(\d+(?:\.\d+)?)px\]/g))
    .map((match) => Number.parseFloat(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 280);

  return widths.length > 0 ? Math.round(Math.max(...widths)) : null;
}

function readPixelWidthFromInlineStyle(element: HTMLElement): number | null {
  if (!element.style?.width) return null;
  const match = element.style.width.match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) return null;
  const width = Number.parseFloat(match[1]);
  return Number.isFinite(width) && width >= 280 ? Math.round(width) : null;
}

function readPixelWidthFromComputedStyle(element: HTMLElement): number | null {
  const computed = window.getComputedStyle(element);
  for (const candidate of [computed.width, computed.minWidth, computed.maxWidth]) {
    const value = Number.parseFloat(candidate);
    if (Number.isFinite(value) && value >= 280 && candidate.endsWith('px')) {
      return Math.round(value);
    }
  }
  return null;
}

function copyInheritedPreviewVariables(source: HTMLElement, target: HTMLElement): void {
  const computed = window.getComputedStyle(source);
  for (const property of Array.from(computed)) {
    if (property.startsWith('--')) {
      target.style.setProperty(property, computed.getPropertyValue(property));
    }
  }
  target.style.setProperty('font-family', computed.fontFamily);
}

async function waitForStageStyles(stageDocument: Document): Promise<void> {
  const links = Array.from(stageDocument.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  await Promise.all(links.map((link) => {
    if (link.sheet) return Promise.resolve();
    return withExportTimeout(new Promise<void>((resolve, reject) => {
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener('error', () => reject(new Error(`Stylesheet export gagal dimuat: ${link.href}`)), { once: true });
    }), `Stylesheet export desktop tidak selesai dimuat: ${link.href}`);
  }));
}

function rebaseStylesheetUrls(cssText: string, baseUrl: string): string {
  return cssText.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi, (match, doubleQuoted, singleQuoted, unquoted) => {
    const url = (doubleQuoted ?? singleQuoted ?? unquoted ?? '').trim();
    if (!url || url.startsWith('#')) return match;
    try {
      return `url(${JSON.stringify(new URL(url, baseUrl).href)})`;
    } catch {
      return match;
    }
  });
}

function copyLoadedStylesheets(sourceDocument: Document, stageDocument: Document): void {
  const base = stageDocument.createElement('base');
  base.href = sourceDocument.baseURI;
  stageDocument.head.appendChild(base);

  // Copy the active CSSOM, including runtime-inserted rules. Reloading links can
  // fail after a deploy or network interruption and leave intrinsic image sizes.
  for (const sheet of [...Array.from(sourceDocument.styleSheets), ...(sourceDocument.adoptedStyleSheets || [])]) {
    if (sheet.disabled) continue;
    try {
      const style = stageDocument.createElement('style');
      style.media = sheet.media.mediaText;
      style.textContent = rebaseStylesheetUrls(
        Array.from(sheet.cssRules, rule => rule.cssText).join('\n'),
        sheet.href || sourceDocument.baseURI
      );
      stageDocument.head.appendChild(style);
    } catch {
      // Cross-origin stylesheet rules can be unreadable even when loaded.
      const owner = sheet.ownerNode;
      if (owner instanceof HTMLLinkElement) {
        const link = owner.cloneNode(true) as HTMLLinkElement;
        link.href = owner.href;
        stageDocument.head.appendChild(link);
      } else if (owner instanceof HTMLStyleElement) {
        stageDocument.head.appendChild(owner.cloneNode(true));
      }
    }
  }
}

async function createDesktopCanonicalStage(
  source: HTMLElement,
  canonicalWidth: number,
  chatScrollPositions: ChatScrollPosition[],
  chatViewportHeight: number
): Promise<DesktopCanonicalStage> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.dataset.auDesktopExportStage = 'true';
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${DESKTOP_EXPORT_VIEWPORT_WIDTH}px`,
    height: `${Math.max(DESKTOP_EXPORT_VIEWPORT_HEIGHT, source.scrollHeight + 256)}px`,
    border: '0',
    pointerEvents: 'none',
    zIndex: '-2147483647',
  });
  document.body.appendChild(iframe);

  const stageDocument = iframe.contentDocument;
  if (!stageDocument) {
    iframe.remove();
    throw new Error('Desktop export stage tidak tersedia pada browser ini.');
  }

  stageDocument.open();
  stageDocument.write('<!doctype html><html><head></head><body></body></html>');
  stageDocument.close();
  stageDocument.documentElement.className = document.documentElement.className;
  stageDocument.body.className = document.body.className;
  stageDocument.documentElement.lang = document.documentElement.lang;

  copyLoadedStylesheets(source.ownerDocument, stageDocument);

  Object.assign(stageDocument.documentElement.style, {
    width: `${DESKTOP_EXPORT_VIEWPORT_WIDTH}px`,
    minWidth: `${DESKTOP_EXPORT_VIEWPORT_WIDTH}px`,
    maxWidth: `${DESKTOP_EXPORT_VIEWPORT_WIDTH}px`,
    margin: '0',
    padding: '0',
    overflow: 'visible',
  });
  Object.assign(stageDocument.body.style, {
    width: `${DESKTOP_EXPORT_VIEWPORT_WIDTH}px`,
    minWidth: `${DESKTOP_EXPORT_VIEWPORT_WIDTH}px`,
    maxWidth: `${DESKTOP_EXPORT_VIEWPORT_WIDTH}px`,
    margin: '0',
    padding: '0',
    overflow: 'visible',
  });

  const clone = source.cloneNode(true) as HTMLElement;
  clone.dataset.auDesktopCanonicalClone = 'true';
  clone.removeAttribute('data-floating-preview-clone');
  Object.assign(clone.style, {
    width: `${canonicalWidth}px`,
    minWidth: `${canonicalWidth}px`,
    maxWidth: `${canonicalWidth}px`,
    height: chatViewportHeight ? `${chatViewportHeight}px` : '',
    minHeight: chatViewportHeight ? `${chatViewportHeight}px` : '',
    maxHeight: chatViewportHeight ? `${chatViewportHeight}px` : '',
    margin: '0',
    transform: 'none',
    zoom: '1',
    transformOrigin: 'top left',
  });
  copyInheritedPreviewVariables(source, clone);
  stageDocument.body.appendChild(clone);
  synchronizeClonedNode(clone, source);

  try {
    await waitForStageStyles(stageDocument);
    if (stageDocument.fonts) {
      await withExportTimeout(
        stageDocument.fonts.ready.then(() => undefined),
        'Font desktop export belum selesai dimuat.'
      );
    }
    await Promise.all(Array.from(clone.querySelectorAll('img')).map(waitForImageReady));
    await new Promise<void>((resolve) => iframe.contentWindow?.requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => iframe.contentWindow?.requestAnimationFrame(() => resolve()));

    // Scroll offsets set before styles load can be clamped back to zero.
    restoreChatScrollPositions(clone, chatScrollPositions);
  } catch (error) {
    iframe.remove();
    throw error;
  }

  return {
    iframe,
    element: clone,
    document: stageDocument,
    destroy: () => iframe.remove(),
  };
}

/**
 * Pre-converts blob URLs, HTTP/HTTPS URLs, external images, and CSS background images inside the element to inline base64 Data URLs
 * to ensure the single export renderer receives the exact same ready media as the preview.
 */
async function inlineAllImages(element: HTMLElement): Promise<() => void> {
  const images = Array.from(element.querySelectorAll('img'));
  const originalImgStates: { img: HTMLImageElement; src: string; crossOrigin: string | null }[] = [];

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src') || img.src;
      if (!src) return;

      originalImgStates.push({
        img,
        src,
        crossOrigin: img.getAttribute('crossorigin'),
      });

      if (src.startsWith('http://') || src.startsWith('https://')) {
        img.setAttribute('crossorigin', 'anonymous');
      }

      // 1. Resolve highest-resolution original asset if available in imageRegistry
      const highResSource = await resolveHighestResolutionSource(src);
      if (highResSource && highResSource.startsWith('data:image/')) {
        img.src = highResSource;
      } else if (highResSource) {
        try {
          const dataUrl = await fetchImageDataUrl(highResSource);
          if (dataUrl) {
            img.src = dataUrl;
          }
        } catch (e) {
          console.warn('Could not inline high-res image URL:', highResSource, e);
        }
      }

      await waitForImageReady(img);
    })
  );

  // Also inline background images on elements (like custom chat wallpapers)
  const allEls = [element, ...Array.from(element.querySelectorAll<HTMLElement>('*'))];
  const originalBgStates: { el: HTMLElement; bg: string }[] = [];

  await Promise.all(
    allEls.map(async (el) => {
      const bg = el.style.backgroundImage;
      if (bg && bg.includes('url(') && !bg.includes('data:image/')) {
        const match = bg.match(/url\(["']?([^"')]+)["']?\)/);
        if (match && match[1]) {
          const rawUrl = match[1];
          originalBgStates.push({ el, bg });
          const highResBgSource = await resolveHighestResolutionSource(rawUrl);
          if (highResBgSource && highResBgSource.startsWith('data:image/')) {
            el.style.backgroundImage = `url("${highResBgSource}")`;
          } else {
            try {
              const dataUrl = await fetchImageDataUrl(highResBgSource);
              if (!dataUrl) throw new Error(`Background image gagal dimuat: ${rawUrl}`);
              el.style.backgroundImage = `url("${dataUrl}")`;
            } catch (e) {
              throw new Error(`Background image gagal disiapkan untuk export: ${rawUrl}`, { cause: e });
            }
          }
        }
      }
    })
  );

  return () => {
    originalImgStates.forEach(({ img, src, crossOrigin }) => {
      img.src = src;
      if (crossOrigin !== null) {
        img.setAttribute('crossorigin', crossOrigin);
      } else {
        img.removeAttribute('crossorigin');
      }
    });
    originalBgStates.forEach(({ el, bg }) => {
      el.style.backgroundImage = bg;
    });
  };
}

/**
 * Convert an image URL to a base64 Data URL using Fetch, Canvas, or CORS proxy
 */
async function fetchImageDataUrl(rawUrl: string): Promise<string | null> {
  if (!rawUrl) return null;
  if (rawUrl.startsWith('data:image/')) return rawUrl;

  // Normalize Google Drive links to direct CDN to bypass HTML interstitial error pages
  let url = rawUrl.trim();
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]{20,})/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    url = `https://lh3.googleusercontent.com/d/${match[1]}=s1600`;
  }

  const tryFetchToDataUrl = async (targetUrl: string): Promise<string | null> => {
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) return null;

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html') || contentType.includes('application/json')) {
        return null;
      }

      const blob = await res.blob();
      if (blob.type.includes('html') || blob.type.includes('text')) {
        return null;
      }

      return await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const tryCanvasToDataUrl = (targetUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
            return;
          }
        } catch {
          // Canvas tainted or blocked
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      img.src = targetUrl;
    });
  };

  // 1. Try direct fetch -> blob -> dataUrl
  let dataUrl = await tryFetchToDataUrl(url);
  if (dataUrl) return dataUrl;

  // 2. Try Image + Canvas
  dataUrl = await tryCanvasToDataUrl(url);
  if (dataUrl) return dataUrl;

  // 3. Fallback via CORS proxy for external images
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
    dataUrl = await tryFetchToDataUrl(proxyUrl);
    if (dataUrl) return dataUrl;

    dataUrl = await tryCanvasToDataUrl(proxyUrl);
    if (dataUrl) return dataUrl;
  }

  return null;
}

/**
 * Direct pass-through for image data URL: preserves lossless native canvas output
 * without destructive CPU convolution filtering or lossy re-encoding.
 */
async function enhanceImageDataUrl(dataUrl: string, _userScale?: number): Promise<string> {
  return dataUrl;
}

async function enhanceImageBlob(blob: Blob, _userScale?: number): Promise<Blob> {
  return blob;
}

function getUnscaledDimensions(element: HTMLElement): { width: number; height: number } {
  // offsetWidth and offsetHeight ignore ancestor CSS transforms and return unscaled layout dimensions
  let width = element.offsetWidth || element.scrollWidth;
  let height = element.offsetHeight || element.scrollHeight;

  if (!width || !height) {
    const rect = element.getBoundingClientRect();
    const canvasContainer = document.getElementById('preview-canvas-container');
    let scale = 1;
    if (canvasContainer && canvasContainer.style.transform) {
      const match = canvasContainer.style.transform.match(/scale\(([^)]+)\)/);
      if (match && parseFloat(match[1])) {
        scale = parseFloat(match[1]);
      }
    }
    width = width || Math.ceil(rect.width / scale);
    height = height || Math.ceil(rect.height / scale);
  }

  return {
    width: Math.max(Math.ceil(width || 380), 200),
    height: Math.max(Math.ceil(height || 475), 200),
  };
}

/**
 * Accurately determines the canonical designed width of any preview card or mockup.
 * This guarantees 100% layout fidelity across all devices (mobile, tablet, desktop)
 * by neutralizing device viewport squishing.
 */
export function getCanonicalTargetWidth(element: HTMLElement): number {
  if (!element) return 380;

  const explicitWidth = Number.parseFloat(element.dataset.auCanonicalWidth || '');
  if (Number.isFinite(explicitWidth) && explicitWidth >= 280) {
    return Math.round(explicitWidth);
  }

  // 1. Direct style.width (e.g. customized Spotify card width, or user custom width)
  const inlineWidth = readPixelWidthFromInlineStyle(element);
  if (inlineWidth) return inlineWidth;

  // 2. Direct classes on element
  const classWidth = readPixelWidthFromClasses(element);
  if (classWidth) return classWidth;

  // 3. Explicit desktop layout constraints from the component itself. This is
  // independent from ancestor transforms and the physical device viewport.
  const computedWidth = readPixelWidthFromComputedStyle(element);
  if (computedWidth) return computedWidth;

  // 4. Check descendants or children (such as #preview-target)
  const childTarget = (element.querySelector('#preview-target') as HTMLElement) || (element.firstElementChild as HTMLElement);
  if (childTarget) {
    const childInlineWidth = readPixelWidthFromInlineStyle(childTarget);
    if (childInlineWidth) return childInlineWidth;
    const childClassWidth = readPixelWidthFromClasses(childTarget);
    if (childClassWidth) return childClassWidth;
    const childComputedWidth = readPixelWidthFromComputedStyle(childTarget);
    if (childComputedWidth) return childComputedWidth;
  }

  // 5. Default to unscaled dimensions or standard 380px
  const unscaled = getUnscaledDimensions(element);
  if (unscaled.width && unscaled.width >= 320) {
    return unscaled.width;
  }

  return 380;
}

export function getCanonicalTargetHeight(element: HTMLElement): number {
  if (!element) return 600;
  const unscaled = getUnscaledDimensions(element);
  return Math.round(element.offsetHeight || unscaled.height || 600);
}

export interface CaptureChatOptions {
  pixelRatio?: number;
  backgroundColor?: string;
  filename?: string;
  enhance?: boolean;
}

export interface ElementExportDiagnostics {
  label: string;
  tagName: string;
  id: string;
  className: string;
  rect: { width: number; height: number; left: number; top: number };
  scrollWidth: number;
  scrollHeight: number;
  offsetWidth: number;
  offsetHeight: number;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  width: string;
  maxWidth: string;
  padding: string;
  boxSizing: string;
  whiteSpace: string;
  wordBreak: string;
  overflowWrap: string;
}

/**
 * Diagnostics helper inspecting the exact 15 computed layout and typography properties
 * requested to diagnose and verify mobile vs desktop export consistency.
 */
export function getElementExportDiagnostics(el: HTMLElement, label: string): ElementExportDiagnostics {
  const rect = el.getBoundingClientRect();
  const cs = window.getComputedStyle(el);
  return {
    label,
    tagName: el.tagName.toLowerCase(),
    id: el.id || '',
    className: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
    rect: {
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
      left: Math.round(rect.left * 100) / 100,
      top: Math.round(rect.top * 100) / 100,
    },
    scrollWidth: el.scrollWidth,
    scrollHeight: el.scrollHeight,
    offsetWidth: el.offsetWidth,
    offsetHeight: el.offsetHeight,
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    width: cs.width,
    maxWidth: cs.maxWidth,
    padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
    boxSizing: cs.boxSizing,
    whiteSpace: cs.whiteSpace,
    wordBreak: cs.wordBreak,
    overflowWrap: cs.overflowWrap,
  };
}

export interface PreparedExportSession {
  element: HTMLElement;
  targetWidth: number;
  targetHeight: number;
  restore: () => void;
}

/**
 * Safe export preparation:
 * - Waits for web fonts to settle completely.
 * - Inlines images to prevent tainted canvas.
 * - Measures unscaled canonical dimensions without mutating live DOM styles,
 *   ancestor transforms, or child elements, preventing live preview jumps and layout shifts.
 */
export async function prepareElementForExport(element: HTMLElement): Promise<PreparedExportSession> {
  // 1. Wait for document fonts to settle
  await waitForFontsReady();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // 2. Inline all images so canvas rendering experiences zero network stalls or tainted canvas issues
  const restoreImages = await inlineAllImages(element);

  // 3. Compute accurate unscaled dimensions for the root container
  const unscaled = getUnscaledDimensions(element);
  const targetWidth = element.offsetWidth || unscaled.width || getCanonicalTargetWidth(element);
  const targetHeight = element.offsetHeight || unscaled.height || getCanonicalTargetHeight(element);

  return {
    element,
    targetWidth,
    targetHeight,
    restore: () => {
      try {
        restoreImages();
      } catch {}
    },
  };
}

/**
 * Dedicated capture engine:
 * Freezes the live DOM layout with prepareElementForExport and captures with one renderer,
 * and restores the live preview without any visual disruption.
 */
/**
 * Detects whether an element represents a vertical 9:16 fullscreen mockup
 * (Instagram Story, Story Reply, Story Viewers, WhatsApp Status & Viewers, TikTok FYP & Feed Live, iOS Lockscreen).
 */
export function isNineSixteenElement(element: HTMLElement): boolean {
  if (!element) return false;
  const id = (element.id || '').toLowerCase();
  const cls = (
    (typeof element.className === 'string' ? element.className : '') +
    ' ' +
    (element.getAttribute('class') || '')
  ).toLowerCase();

  if (
    id.includes('story') ||
    id.includes('lockscreen') ||
    id.includes('tiktok') ||
    id.includes('status') ||
    id.includes('live') ||
    cls.includes('aspect-[9/16]') ||
    cls.includes('story') ||
    cls.includes('lockscreen') ||
    cls.includes('tiktok') ||
    cls.includes('whatsappstatus')
  ) {
    return true;
  }

  // Check child elements
  if (
    element.querySelector(
      '#export-ig-story, #export-instagram-story-viewers, #export-instagram-story-reply, #export-ios-lockscreen, #export-tiktok-fyp, #export-tiktok-feed-live, #export-whatsapp-status, #export-whatsapp-viewers, [data-story-module="true"], [data-tab*="story"], [data-tab*="lockscreen"], [data-tab*="tiktok"], [data-tab*="status"]'
    )
  ) {
    return true;
  }

  // Check physical aspect ratio in DOM
  const w = element.offsetWidth || element.scrollWidth;
  const h = element.offsetHeight || element.scrollHeight;
  if (w > 0 && h > 0) {
    const ratio = h / w;
    if (ratio >= 1.6 && ratio <= 1.95 && w <= 440) {
      return true;
    }
  }

  return false;
}

// Backward-compatible alias for existing callers
function isStoryTarget(el: HTMLElement): boolean {
  return isNineSixteenElement(el);
}

export interface ModuleDesignResolution {
  canonicalWidth: number;
  canonicalHeight: number;
  exportWidth: number;
  exportHeight: number;
  scaleMultiplier: number;
  isNineSixteen: boolean;
}

/**
 * Calculates absolute design and export dimensions for 1x, 2x (HD), and 3x (4K).
 * Fully decoupled from devicePixelRatio, window.innerWidth, and mobile device screen bounds.
 */
export function getModuleDesignResolution(element: HTMLElement, userScale: number = 1): ModuleDesignResolution {
  const is916 = isNineSixteenElement(element);
  const scale = Math.max(Math.round(userScale || 1), 1);

  // The exact laid-out preview box is the single source of truth for every module,
  // including 9:16 stories/status screens. Resolution controls only pixel density;
  // it must never substitute a different design canvas or aspect ratio.
  const canonicalWidth = element.offsetWidth || getCanonicalTargetWidth(element);
  const canonicalHeight = element.offsetHeight || getCanonicalTargetHeight(element);

  const exportWidth = Math.round(canonicalWidth * scale);
  const exportHeight = Math.round(canonicalHeight * scale);

  return {
    canonicalWidth,
    canonicalHeight,
    exportWidth,
    exportHeight,
    scaleMultiplier: scale,
    isNineSixteen: is916,
  };
}

export interface ExportPreviewOptions {
  element?: HTMLElement | null;
  width?: number;
  height?: number;
  scale?: number;
  pixelRatio?: number;
  filename?: string;
  backgroundColor?: string;
  format?: 'png' | 'jpeg' | 'jpg';
  quality?: number; // Minimal compression, e.g. 0.98 or 1.0 for JPG
  onProgress?: (step: string) => void;
}

export interface ExportPreviewResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  width: number;
  height: number;
  scale: number;
  filename: string;
}

/**
 * Unified high-fidelity image export engine for all AU Toolkit modules.
 * Renders directly at target resolution (1x, 2x HD, 3x 4K) without upscaling preview screenshots.
 * Captures the canonical preview DOM without mounting a second layout tree,
 * substitutes original high-res image bytes inside the renderer clone, and outputs
 * razor-sharp vector text and icons.
 */
export async function exportPreviewToImage(
  options: ExportPreviewOptions = {}
): Promise<ExportPreviewResult> {
  const targetEl =
    options.element ||
    document.getElementById('preview-target') ||
    (document.getElementById('preview-canvas-container')?.firstElementChild as HTMLElement);

  if (!targetEl) {
    throw new Error('Preview target element not found for export');
  }

  // Only the registered canonical preview can be exported. A Mobile Floating
  // Preview is an unregistered mirror and is deliberately rejected here.
  if (!getRegisteredExportContext(targetEl)) {
    throw new Error('Preview bukan canonical export source yang terdaftar.');
  }

  const chatScrollPositions = readChatScrollPositions(targetEl);
  const chatViewportHeight = chatScrollPositions.length ? targetEl.offsetHeight : 0;

  const isJpg =
    options.format === 'jpeg' ||
    options.format === 'jpg' ||
    (options.filename || '').toLowerCase().endsWith('.jpg') ||
    (options.filename || '').toLowerCase().endsWith('.jpeg');
  const mimeType = isJpg ? 'image/jpeg' : 'image/png';
  const exportQuality = isJpg ? (options.quality !== undefined ? options.quality : 1.0) : 1.0;

  const rawScale = options.scale ?? options.pixelRatio ?? 1;
  const userScale = Math.min(3, Math.max(Math.round(rawScale), 1));
  const solidBg = options.backgroundColor || getSolidBackgroundColor(targetEl);
  const effectiveBg =
    isJpg && (!solidBg || solidBg === 'transparent' || solidBg.includes('rgba(0, 0, 0, 0)'))
      ? '#ffffff'
      : (solidBg || '#ffffff');

  // Canonical width comes from the component's own explicit desktop geometry,
  // never from the mobile viewport or an ancestor editor transform. Dynamic
  // height is measured after the same component DOM is staged at desktop width.
  const canonicalWidth = options.width || getCanonicalTargetWidth(targetEl);
  let canonicalHeight = options.height || 0;
  const scaleMultiplier = userScale;
  let exportWidth = 0;
  let exportHeight = 0;

  // Resolve clean descriptive filename with scale indicator
  let resolvedFilename = options.filename;
  const scaleLabel = userScale === 1 ? '1x' : userScale === 2 ? '2x-HD' : '3x-4K';
  const extension = isJpg ? '.jpg' : '.png';
  if (!resolvedFilename) {
    resolvedFilename = `AU-Toolkit-Export-${scaleLabel}${extension}`;
  } else {
    if (isJpg && !resolvedFilename.toLowerCase().endsWith('.jpg') && !resolvedFilename.toLowerCase().endsWith('.jpeg')) {
      resolvedFilename = resolvedFilename.replace(/\.png$/i, '') + '.jpg';
    } else if (!isJpg && !resolvedFilename.toLowerCase().endsWith('.png')) {
      resolvedFilename = resolvedFilename.replace(/\.jpe?g$/i, '') + '.png';
    }
  }

  // 2. Fonts must be fully ready. Never export with substituted glyph metrics.
  options.onProgress?.(`Preparing ${scaleLabel} export...`);
  await waitForFontsReady();
  await waitForElementFonts(targetEl);
  await waitForPendingEmojiAssets();

  // 3. Capture the canonical element directly. The renderer clone remains in a
  // same-document-size iframe and paints the resolved DOM boxes/text runs to the
  // canvas without SVG foreignObject image decoding.
  let canvas: HTMLCanvasElement | null = null;
  let dataUrl: string | null = null;
  let blob: Blob | null = null;
  let desktopStage: DesktopCanonicalStage | null = null;

  try {
    options.onProgress?.('Loading original image sources & media...');
    await Promise.all(Array.from(targetEl.querySelectorAll('img')).map(waitForImageReady));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    options.onProgress?.('Creating isolated desktop canonical stage...');
    desktopStage = await createDesktopCanonicalStage(targetEl, canonicalWidth, chatScrollPositions, chatViewportHeight);
    canonicalHeight = options.height || Math.round(desktopStage.element.offsetHeight);
    if (!canonicalWidth || !canonicalHeight) {
      throw new Error('Canonical desktop preview geometry tidak valid.');
    }
    Object.assign(desktopStage.element.style, {
      width: `${canonicalWidth}px`,
      minWidth: `${canonicalWidth}px`,
      maxWidth: `${canonicalWidth}px`,
      height: `${canonicalHeight}px`,
      minHeight: `${canonicalHeight}px`,
      maxHeight: `${canonicalHeight}px`,
    });
    desktopStage.iframe.style.height = `${Math.max(DESKTOP_EXPORT_VIEWPORT_HEIGHT, canonicalHeight + 256)}px`;
    restoreChatScrollPositions(desktopStage.element, chatScrollPositions);
    exportWidth = Math.round(canonicalWidth * scaleMultiplier);
    exportHeight = Math.round(canonicalHeight * scaleMultiplier);

    const diagnosticBridge = getExportDiagnosticBridge();
    diagnosticBridge?.record?.({
      stage: 'canonical-live-preview',
      environment: {
        userAgent: navigator.userAgent,
        devicePixelRatio: window.devicePixelRatio,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        visualViewport: window.visualViewport ? {
          width: window.visualViewport.width,
          height: window.visualViewport.height,
          scale: window.visualViewport.scale,
          offsetLeft: window.visualViewport.offsetLeft,
          offsetTop: window.visualViewport.offsetTop,
        } : null,
        documentTextSizeAdjust: window.getComputedStyle(document.documentElement).getPropertyValue('-webkit-text-size-adjust'),
        bodyTextSizeAdjust: window.getComputedStyle(document.body).getPropertyValue('-webkit-text-size-adjust'),
      },
      requested: {
        canonicalWidth,
        canonicalHeight,
        scaleMultiplier,
        exportWidth,
        exportHeight,
      },
      nodes: readDiagnosticMetrics(desktopStage.element),
    });

    options.onProgress?.(`Rendering at ${exportWidth} × ${exportHeight} px (${scaleLabel})...`);

    // Paint the canonical DOM boxes and text runs directly to canvas. Do not
    // serialize HTML into an SVG foreignObject: Samsung Browser performs a
    // second independent HTML/text layout when that SVG is decoded as an image.
    canvas = await html2canvas(desktopStage.element, {
      // Device DPR is intentionally excluded. 1x/2x/3x change backing pixels
      // only while the desktop CSS viewport and element geometry stay fixed.
      scale: scaleMultiplier,
      width: canonicalWidth,
      height: canonicalHeight,
      windowWidth: DESKTOP_EXPORT_VIEWPORT_WIDTH,
      windowHeight: Math.max(DESKTOP_EXPORT_VIEWPORT_HEIGHT, canonicalHeight + 256),
      scrollX: 0,
      scrollY: 0,
      backgroundColor: effectiveBg,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      logging: false,
      imageTimeout: EXPORT_ASSET_TIMEOUT_MS,
      removeContainer: true,
      onclone: async (_clonedDocument, clonedNode) => {
        Object.assign(clonedNode.style, {
          width: `${canonicalWidth}px`,
          minWidth: `${canonicalWidth}px`,
          maxWidth: `${canonicalWidth}px`,
          height: `${canonicalHeight}px`,
          minHeight: `${canonicalHeight}px`,
          maxHeight: `${canonicalHeight}px`,
          margin: '0',
          transform: 'none',
          zoom: '1',
        });
        synchronizeClonedNode(clonedNode, desktopStage!.element);
        const originalImages = Array.from(desktopStage!.element.querySelectorAll<HTMLImageElement>('img'));
        const clonedImages = Array.from(clonedNode.querySelectorAll<HTMLImageElement>('img'));
        await Promise.all(clonedImages.map(async (clonedImage, index) => {
          const originalImage = originalImages[index];
          if (!originalImage) return;
          const currentSource = originalImage.currentSrc || originalImage.src;
          if (currentSource.startsWith('data:image/svg+xml')) {
            const rect = originalImage.getBoundingClientRect();
            const rasterScale = Math.max(2, scaleMultiplier);
            const svgCanvas = document.createElement('canvas');
            svgCanvas.width = Math.max(1, Math.ceil(rect.width * rasterScale));
            svgCanvas.height = Math.max(1, Math.ceil(rect.height * rasterScale));
            const svgContext = svgCanvas.getContext('2d');
            if (svgContext) {
              svgContext.drawImage(originalImage, 0, 0, svgCanvas.width, svgCanvas.height);
              clonedImage.srcset = '';
              clonedImage.src = svgCanvas.toDataURL('image/png');
              await waitForImageReady(clonedImage);
              return;
            }
          }
          const highResSource = await resolveHighestResolutionSource(currentSource);
          if (highResSource && highResSource !== currentSource) {
            clonedImage.srcset = '';
            clonedImage.src = highResSource;
            await waitForImageReady(clonedImage);
          }
        }));
        restoreChatScrollPositions(clonedNode, chatScrollPositions);
        diagnosticBridge?.record?.({
          stage: 'direct-canvas-clone-layout',
          nodes: readDiagnosticMetrics(clonedNode),
        });
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Renderer export gagal menghasilkan canvas yang valid.');
    }

    if (canvas.width !== exportWidth || canvas.height !== exportHeight) {
      throw new Error(
        `Resolusi export tidak sesuai (${canvas.width}×${canvas.height}, seharusnya ${exportWidth}×${exportHeight}).`
      );
    }


    diagnosticBridge?.record?.({
      stage: 'canvas-raster',
      canvas: {
        width: canvas.width,
        height: canvas.height,
        cssWidth: canvas.style.width,
        cssHeight: canvas.style.height,
      },
    });

    if (canvas) {
      options.onProgress?.(isJpg ? 'Generating JPG...' : 'Generating PNG...');

      blob = await new Promise<Blob | null>((resolve) => {
        canvas!.toBlob((b) => resolve(b), mimeType, exportQuality);
      });

      dataUrl = canvas.toDataURL(mimeType, exportQuality);
    }

    if (!blob && !dataUrl) {
      throw new Error('Export pipeline failed to produce image data');
    }

    options.onProgress?.('Download ready!');

    return {
      success: true,
      dataUrl: dataUrl || undefined,
      blob: blob || undefined,
      width: canvas?.width || exportWidth,
      height: canvas?.height || exportHeight,
      scale: userScale,
      filename: resolvedFilename,
    };
  } finally {
    desktopStage?.destroy();
  }
}

/**
 * Backward-compatible exportPreviewToPNG wrapper.
 */
export async function exportPreviewToPNG(
  options: ExportPreviewOptions = {}
): Promise<ExportPreviewResult> {
  return exportPreviewToImage({ ...options, format: 'png' });
}

/**
 * High-fidelity JPG export wrapper with minimal compression for maximum sharpness.
 */
export async function exportPreviewToJPG(
  options: ExportPreviewOptions = {}
): Promise<ExportPreviewResult> {
  return exportPreviewToImage({
    ...options,
    format: 'jpeg',
    quality: options.quality !== undefined ? options.quality : 1.0,
  });
}

/**
 * Backward-compatible captureChatImage wrapper returning high-res data URL.
 */
export async function captureChatImage(
  element: HTMLElement,
  options?: CaptureChatOptions
): Promise<string> {
  const result = await exportPreviewToPNG({
    element,
    scale: options?.pixelRatio,
    backgroundColor: options?.backgroundColor,
    filename: options?.filename,
  });

  if (result.dataUrl) {
    return result.dataUrl;
  }

  if (result.blob) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(result.blob!);
    });
  }

  throw new Error('Failed to capture image data URL');
}

export async function downloadElementAsImage(
  element: HTMLElement,
  filename: string,
  pixelRatio: number = 2,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0,
  onProgress?: (step: string) => void
): Promise<boolean> {
  const targetEl = element || document.getElementById('preview-target');
  if (!targetEl) return false;

  try {
    const isJpg = format === 'jpeg';
    const defaultName = isJpg ? 'au-toolkit-preview.jpg' : 'au-toolkit-preview.png';
    const resolvedFilename = filename || defaultName;

    const result = await exportPreviewToImage({
      element: targetEl,
      filename: resolvedFilename,
      scale: pixelRatio,
      format,
      quality,
      onProgress,
    });

    if (!result.success || (!result.blob && !result.dataUrl)) {
      throw new Error(`Export produced no valid ${format.toUpperCase()} image output`);
    }

    const finalFilename = result.filename;
    let downloadUrl: string;
    let isObjectUrl = false;

    if (result.blob) {
      downloadUrl = URL.createObjectURL(result.blob);
      isObjectUrl = true;
    } else {
      downloadUrl = result.dataUrl!;
    }

    const link = document.createElement('a');
    link.download = finalFilename;
    link.href = downloadUrl;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    link.setAttribute('download', finalFilename);
    link.addEventListener('click', (e) => e.stopPropagation());

    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          if (isObjectUrl) {
            URL.revokeObjectURL(downloadUrl);
          }
        } catch {}
      }, 60000);
    } else {
      link.click();
      if (isObjectUrl) {
        setTimeout(() => {
          try {
            URL.revokeObjectURL(downloadUrl);
          } catch {}
        }, 60000);
      }
    }

    return true;
  } catch (err) {
    console.error(`Download ${format.toUpperCase()} image export failed:`, err);
    throw err;
  }
}

export async function downloadElementAsPng(
  element: HTMLElement,
  filename: string = 'au-toolkit-preview.png',
  pixelRatio: number = 2,
  onProgress?: (step: string) => void
): Promise<boolean> {
  return downloadElementAsImage(element, filename, pixelRatio, 'png', 1.0, onProgress);
}

export async function downloadElementAsJpg(
  element: HTMLElement,
  filename: string = 'au-toolkit-preview.jpg',
  pixelRatio: number = 2,
  quality: number = 1.0,
  onProgress?: (step: string) => void
): Promise<boolean> {
  return downloadElementAsImage(element, filename, pixelRatio, 'jpeg', quality, onProgress);
}

export async function copyElementToClipboard(
  element: HTMLElement,
  pixelRatio: number = 2
): Promise<boolean> {
  const targetEl = element || document.getElementById('preview-target');
  if (!targetEl) return false;

  try {
    const result = await exportPreviewToPNG({
      element: targetEl,
      scale: pixelRatio,
    });

    let blob = result.blob;
    if (!blob && result.dataUrl) {
      const parts = result.dataUrl.split(';base64,');
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      blob = new Blob([uInt8Array], { type: 'image/png' });
    }

    if (!blob) {
      throw new Error('Could not obtain image blob for clipboard');
    }

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } else {
      throw new Error('Clipboard API not supported in this browser environment');
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    throw err;
  }
}

export interface ExportZipOptions {
  element: HTMLElement;
  filename?: string;
  pixelRatio?: number;
  data?: any;
  tabName?: string;
  extraFiles?: Record<string, string | Blob>;
}

/**
 * Packaging preview image and project configurations safely into a downloadable .zip archive.
 * Uses JSZip asynchronously with safe blob trigger (URL.createObjectURL + virtual anchor).
 */
export async function downloadElementAndDataAsZip(
  options: ExportZipOptions
): Promise<boolean> {
  const {
    element,
    filename = 'au-toolkit-project.zip',
    pixelRatio = 2,
    data,
    tabName = 'General',
    extraFiles,
  } = options;

  const targetEl = element || document.getElementById('preview-target');
  if (!targetEl) {
    console.warn('Target element for ZIP export not found.');
    return false;
  }

  try {
    // 1. Capture preview image at specified scale
    const pngResult = await exportPreviewToPNG({
      element: targetEl,
      scale: pixelRatio,
    });

    let pngBlob = pngResult.blob;
    if (!pngBlob && pngResult.dataUrl) {
      const parts = pngResult.dataUrl.split(';base64,');
      if (parts.length === 2) {
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        pngBlob = new Blob([uInt8Array], { type: 'image/png' });
      }
    }

    // Capture ultra-crisp JPG (minimal compression)
    let jpgBlob: Blob | undefined;
    try {
      const jpgResult = await exportPreviewToJPG({
        element: targetEl,
        scale: pixelRatio,
        quality: 0.98,
      });
      jpgBlob = jpgResult.blob;
      if (!jpgBlob && jpgResult.dataUrl) {
        const parts = jpgResult.dataUrl.split(';base64,');
        if (parts.length === 2) {
          const raw = window.atob(parts[1]);
          const rawLength = raw.length;
          const uInt8Array = new Uint8Array(rawLength);
          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          jpgBlob = new Blob([uInt8Array], { type: 'image/jpeg' });
        }
      }
    } catch (jpgErr) {
      console.warn('[AU-EXPORT] Failed to generate JPG for ZIP:', jpgErr);
    }

    // 2. Initialize JSZip instance
    const zip = new JSZip();
    const cleanTab = tabName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    // Add PNG screenshot to zip
    if (pngBlob) {
      zip.file(`${cleanTab}-preview.png`, pngBlob);
    }

    // Add JPG screenshot to zip
    if (jpgBlob) {
      zip.file(`${cleanTab}-preview.jpg`, jpgBlob);
    }

    // Add JSON project configuration to zip
    if (data) {
      const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      zip.file(`${cleanTab}-data.json`, jsonStr);
    }

    // Add metadata manifest
    const manifest = {
      generator: 'AU Toolkit',
      module: tabName,
      exportedAt: new Date().toISOString(),
      resolutionScale: `${pixelRatio}x`,
      contents: [
        pngBlob ? `${cleanTab}-preview.png` : null,
        jpgBlob ? `${cleanTab}-preview.jpg` : null,
        data ? `${cleanTab}-data.json` : null,
      ].filter(Boolean),
    };
    zip.file('project-manifest.json', JSON.stringify(manifest, null, 2));

    // Add any extra assets
    if (extraFiles) {
      for (const [name, content] of Object.entries(extraFiles)) {
        zip.file(name, content);
      }
    }

    // 3. Asynchronously generate ZIP archive blob with compression
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // 4. Safe Blob Trigger: createObjectURL + virtual anchor download
    const zipFilename = filename.endsWith('.zip') ? filename : `${filename}.zip`;
    const downloadUrl = URL.createObjectURL(zipBlob);

    const link = document.createElement('a');
    link.download = zipFilename;
    link.href = downloadUrl;
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    link.setAttribute('download', zipFilename);
    link.addEventListener('click', (e) => e.stopPropagation());

    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(downloadUrl);
        } catch {}
      }, 2000);
    } else {
      link.click();
      setTimeout(() => {
        try {
          URL.revokeObjectURL(downloadUrl);
        } catch {}
      }, 2000);
    }

    return true;
  } catch (err) {
    console.error('Download as .zip failed:', err);
    return false;
  }
}
