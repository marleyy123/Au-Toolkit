import React, { useEffect, useState } from 'react';
import appleEmojiData from 'emoji-datasource-apple/emoji.json';

export interface EmojiSegment {
  value: string;
  isEmoji: boolean;
}

export interface EmojiAssetSource {
  id: string;
  resolve: (grapheme: string, assetKey: string) => string | null;
}

export interface EmojiRenderOptions {
  sizeEm?: number;
}

interface AppleEmojiDataEntry {
  unified?: string | null;
  non_qualified?: string | null;
  image?: string | null;
  has_img_apple?: boolean;
  skin_variations?: Record<string, AppleEmojiDataEntry> | null;
}

function normalizeUnifiedKey(value: string): string {
  return value
    .toLowerCase()
    .split('-')
    .map((part) => {
      const parsed = Number.parseInt(part, 16);
      return Number.isFinite(parsed) ? parsed.toString(16) : part;
    })
    .join('-');
}

const appleFilenameByUnified = new Map<string, string>();

function registerAppleEmojiEntry(entry: AppleEmojiDataEntry): void {
  if (entry.has_img_apple && entry.image) {
    const filename = entry.image.toLowerCase();
    if (entry.unified) appleFilenameByUnified.set(normalizeUnifiedKey(entry.unified), filename);
    if (entry.non_qualified) {
      appleFilenameByUnified.set(normalizeUnifiedKey(entry.non_qualified), filename);
    }
  }
  Object.values(entry.skin_variations || {}).forEach(registerAppleEmojiEntry);
}

(appleEmojiData as AppleEmojiDataEntry[]).forEach(registerAppleEmojiEntry);

const appleEmojiAssetSource: EmojiAssetSource = {
  id: 'emoji-datasource-apple@16.0.0-local',
  resolve: (_grapheme, assetKey) => {
    const normalizedKey = normalizeUnifiedKey(assetKey);
    const filename = appleFilenameByUnified.get(normalizedKey);
    return filename ? `/emoji/apple/64/${filename}` : null;
  },
};

let activeEmojiAssetSource: EmojiAssetSource | null = appleEmojiAssetSource;

const emojiAssetLoadCache = new Map<string, Promise<boolean>>();

function preloadEmojiAsset(assetUrl: string): Promise<boolean> {
  const cached = emojiAssetLoadCache.get(assetUrl);
  if (cached) return cached;

  const pending = new Promise<boolean>((resolve) => {
    const probe = new Image();
    probe.onload = async () => {
      try {
        if (typeof probe.decode === 'function') await probe.decode();
        resolve(probe.naturalWidth > 0 && probe.naturalHeight > 0);
      } catch {
        resolve(false);
      }
    };
    probe.onerror = () => resolve(false);
    probe.src = assetUrl;
  });
  emojiAssetLoadCache.set(assetUrl, pending);
  return pending;
}

/** Wait until every emoji asset requested by the mounted preview has settled. */
export async function waitForPendingEmojiAssets(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Effects enqueue preloads after commit. Give them one frame, then drain the
  // shared cache until no additional preview glyph registered another asset.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  for (let pass = 0; pass < 3; pass += 1) {
    const pending = Array.from(emojiAssetLoadCache.values());
    await Promise.all(pending);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    if (pending.length === emojiAssetLoadCache.size) break;
  }
}

/** Installs one explicitly licensed emoji artwork source for every preview. */
export function configureEmojiAssetSource(source: EmojiAssetSource | null): void {
  activeEmojiAssetSource = source;
}

export function getEmojiAssetSource(): EmojiAssetSource | null {
  return activeEmojiAssetSource;
}

export function createLocalEmojiAssetSource(
  id: string,
  basePath: string,
  extension: 'png' | 'svg' | 'webp' = 'png'
): EmojiAssetSource {
  const normalizedBase = basePath.replace(/\/+$/, '');
  return {
    id,
    resolve: (_grapheme, assetKey) => `${normalizedBase}/${assetKey}.${extension}`,
  };
}

export function emojiToHex(emoji: string): string {
  return Array.from(emoji)
    .map((character) => character.codePointAt(0)?.toString(16).toLowerCase())
    .filter((value): value is string => Boolean(value))
    .join('-');
}

const EMOJI_GRAPHEME_REGEX = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3)/u;
const REGIONAL_INDICATOR_REGEX = /^\p{Regional_Indicator}$/u;
const EXTENDER_REGEX = /^(?:[\uFE0E\uFE0F\u20E3]|[\u{1F3FB}-\u{1F3FF}]|\p{Mark})$/u;

function fallbackGraphemes(text: string): string[] {
  const codePoints = Array.from(text);
  const graphemes: string[] = [];

  for (let index = 0; index < codePoints.length; index += 1) {
    let grapheme = codePoints[index];

    if (REGIONAL_INDICATOR_REGEX.test(grapheme) && REGIONAL_INDICATOR_REGEX.test(codePoints[index + 1] || '')) {
      grapheme += codePoints[++index];
    }

    while (index + 1 < codePoints.length) {
      const next = codePoints[index + 1];
      if (EXTENDER_REGEX.test(next)) {
        grapheme += next;
        index += 1;
        continue;
      }
      if (next === '\u200D' && index + 2 < codePoints.length) {
        grapheme += next + codePoints[index + 2];
        index += 2;
        continue;
      }
      break;
    }

    graphemes.push(grapheme);
  }

  return graphemes;
}

export function splitEmojiGraphemes(text: string): string[] {
  if (!text) return [];
  const Segmenter = (Intl as typeof Intl & {
    Segmenter?: new (
      locale?: string,
      options?: { granularity: 'grapheme' }
    ) => { segment: (value: string) => Iterable<{ segment: string }> };
  }).Segmenter;
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), (entry) => entry.segment);
  }
  return fallbackGraphemes(text);
}

export function segmentEmojiText(text: string): EmojiSegment[] {
  const result: EmojiSegment[] = [];
  splitEmojiGraphemes(text).forEach((grapheme) => {
    const isEmoji = EMOJI_GRAPHEME_REGEX.test(grapheme);
    const previous = result[result.length - 1];
    if (!isEmoji && previous && !previous.isEmoji) {
      previous.value += grapheme;
    } else {
      result.push({ value: grapheme, isEmoji });
    }
  });
  return result;
}

const EmojiGlyph: React.FC<{
  grapheme: string;
  source: EmojiAssetSource | null;
  sizeEm: number;
}> = ({ grapheme, source, sizeEm }) => {
  const assetKey = emojiToHex(grapheme);
  const assetUrl = source?.resolve(grapheme, assetKey) || null;
  const [readyAssetUrl, setReadyAssetUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReadyAssetUrl(null);
    if (!assetUrl) return () => { cancelled = true; };

    void preloadEmojiAsset(assetUrl).then((loaded) => {
      if (!cancelled) setReadyAssetUrl(loaded ? assetUrl : null);
    });
    return () => {
      cancelled = true;
    };
  }, [assetUrl]);

  // Unicode is the immediate, stable fallback. An image is inserted only after its
  // licensed asset has loaded successfully, so previews/exports never contain a
  // transient broken <img> when an asset path is absent or stale.
  if (!assetUrl || readyAssetUrl !== assetUrl) {
    return (
      <span
        data-au-emoji="true"
        data-au-emoji-source={source ? `${source.id}:missing` : 'native:asset-source-required'}
        style={{ whiteSpace: 'nowrap' }}
      >
        {grapheme}
      </span>
    );
  }

  return (
    <img
      src={readyAssetUrl}
      alt={grapheme}
      draggable={false}
      loading="eager"
      decoding="sync"
      data-au-emoji="true"
      data-au-emoji-source={source.id}
      className="inline-block select-none pointer-events-none object-contain shrink-0"
      style={{
        display: 'inline-block',
        width: `${sizeEm}em`,
        height: `${sizeEm}em`,
        minWidth: `${sizeEm}em`,
        verticalAlign: '-0.14em',
        margin: 0,
      }}
      onError={() => setReadyAssetUrl(null)}
    />
  );
};

export function renderEmojiText(
  text?: string | null,
  options: EmojiRenderOptions = {}
): React.ReactNode {
  if (!text || typeof text !== 'string') return text || '';
  const source = getEmojiAssetSource();
  const sizeEm = options.sizeEm ?? 1;

  return segmentEmojiText(text).map((segment, index) => {
    if (!segment.isEmoji) return <React.Fragment key={index}>{segment.value}</React.Fragment>;
    return (
      <EmojiGlyph
        key={`${index}-${emojiToHex(segment.value)}`}
        grapheme={segment.value}
        source={source}
        sizeEm={sizeEm}
      />
    );
  });
}

/** Renders stored reaction values safely; obsolete remote emoji URLs fall back to Unicode. */
export function renderEmojiReaction(
  value: string | null | undefined,
  fallback: string,
  options: EmojiRenderOptions = {}
): React.ReactNode {
  const candidate = String(value || '').trim();
  const isLegacyAssetUrl = /^(?:https?:|blob:|data:|file:)/i.test(candidate);
  return renderEmojiText(!candidate || isLegacyAssetUrl ? fallback : candidate, options);
}

export const EmojiText: React.FC<{
  text?: string | null;
  className?: string;
  sizeEm?: number;
}> = ({ text, className, sizeEm }) => (
  <span className={className}>{renderEmojiText(text, { sizeEm })}</span>
);

export const AppleHeartEmoji: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = 'w-6 h-6 inline-flex items-center justify-center align-middle select-none',
  style,
}) => (
  <span className={className} style={style} aria-label="❤️">
    {renderEmojiText('❤️')}
  </span>
);

// Backward-compatible names used by existing previews.
export const renderFormattedTextWithAppleEmojis = renderEmojiText;
export const renderGlobalAppleEmojis = renderEmojiText;
export const renderIosEmojis = renderEmojiText;
