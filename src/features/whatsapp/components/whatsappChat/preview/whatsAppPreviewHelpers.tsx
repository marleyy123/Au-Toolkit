import React from 'react';
import { WhatsAppChatMessage, WhatsAppChatData } from '../../../../../types';
import { renderFormattedTextWithAppleEmojis } from '../../../../../utils/emojiUtils';

export const renderTicks = (
  msg: WhatsAppChatMessage,
  isDark: boolean,
  isOverlay: boolean = false,
  isSenderDark: boolean = false
) => {
  const status = msg.status || (msg.isRead === false ? 'delivered' : 'read');

  if (status === 'sent') {
    return (
      <svg viewBox="0 0 16 15" width="13" height="12" className="shrink-0 block">
        <path
          d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
          fill={isOverlay || isSenderDark ? 'rgba(255, 255, 255, 0.78)' : (isDark ? '#a0a0a0' : '#8696a0')}
        />
      </svg>
    );
  }

  const tickColor = status === 'read'
    ? (isSenderDark ? '#53bdeb' : (isDark ? '#53bdeb' : '#34B7F1'))
    : (isOverlay || isSenderDark ? 'rgba(255, 255, 255, 0.78)' : (isDark ? '#a0a0a0' : '#8696a0'));

  return (
    <svg viewBox="0 0 16 15" width="13" height="12" className="shrink-0 block">
      <path
        d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
        fill={tickColor}
      />
    </svg>
  );
};

export const formatWhatsAppTime = (timeStr?: string): string => {
  if (!timeStr || timeStr.trim() === '') return '12.00';
  return timeStr.replace(/:/g, '.');
};

export const renderIosEmojis = renderFormattedTextWithAppleEmojis;

export const splitWhatsAppGraphemes = (value: string): string[] => {
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(value), (entry: any) => entry.segment);
    } catch {
      return Array.from(value);
    }
  }
  return Array.from(value);
};

export const formatWhatsAppBubbleText = (text?: string | null, maxCharsPerLine = 30): string => {
  if (!text || typeof text !== 'string') return text || '';
  const paragraphs = text.split('\n');
  const formattedParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    const chars = splitWhatsAppGraphemes(paragraph);
    if (chars.length <= maxCharsPerLine) {
      formattedParagraphs.push(paragraph);
      continue;
    }

    let remaining = chars;
    while (remaining.length > maxCharsPerLine) {
      const lineChars = remaining.slice(0, maxCharsPerLine);
      formattedParagraphs.push(lineChars.join(''));
      remaining = remaining.slice(maxCharsPerLine);
      if (remaining[0] === ' ') {
        remaining = remaining.slice(1);
      }
    }
    if (remaining.length > 0) {
      formattedParagraphs.push(remaining.join(''));
    }
  }

  return formattedParagraphs.join('\n');
};

export const analyzeWhatsAppBubbleText = (text?: string | null) => {
  const formatted = String(text ?? '').replace(/\r\n?/g, '\n');
  const lineLengths = formatted.split('\n').map((line) => splitWhatsAppGraphemes(line).length);
  return {
    formatted,
    lineCount: lineLengths.length,
    maxLineLen: lineLengths.length ? Math.max(...lineLengths) : 0,
    lastLineLen: lineLengths.length ? lineLengths[lineLengths.length - 1] : 0,
  };
};

export const formatWhatsAppLeftBubbleText = formatWhatsAppBubbleText;

export const WhatsAppInlineMetaSpacer: React.FC<{
  msg: WhatsAppChatMessage;
  isOutgoing: boolean;
  isDark: boolean;
  isSenderBubbleDark: boolean;
}> = ({ msg, isOutgoing, isDark, isSenderBubbleDark }) => (
  <span
    aria-hidden="true"
    className="inline-flex invisible items-center gap-1 pl-1.5 text-[10px] leading-none whitespace-nowrap align-baseline select-none"
  >
    <span className="leading-none font-normal">{formatWhatsAppTime(msg.time)}</span>
    {isOutgoing && renderTicks(msg, isDark, false, isSenderBubbleDark)}
  </span>
);

export const isHexDark = (colorHex?: string): boolean => {
  if (!colorHex || !colorHex.startsWith('#')) return false;
  const hex = colorHex.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
};

export const getBubbleStyle = ({
  isOutgoing,
  showTail,
  bubbleRoundness = 12,
  useCustomColors,
  senderBubbleColor,
  receiverBubbleColor,
  mainTextColor,
  isDark,
}: {
  isOutgoing: boolean;
  showTail: boolean;
  bubbleRoundness?: number;
  useCustomColors?: boolean;
  senderBubbleColor?: string;
  receiverBubbleColor?: string;
  mainTextColor?: string;
  isDark: boolean;
}): React.CSSProperties => {
  const R = bubbleRoundness ?? 12;

  const bg = useCustomColors
    ? (isOutgoing ? (senderBubbleColor || '#005C4B') : (receiverBubbleColor || '#202c33'))
    : (isOutgoing ? (isDark ? '#005C4B' : '#E2FFC7') : (isDark ? '#262628' : '#ffffff'));

  const textColor = useCustomColors
    ? (mainTextColor || '#ffffff')
    : (isOutgoing ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#ffffff' : '#000000'));

  return {
    borderTopLeftRadius: `${R}px`,
    borderTopRightRadius: `${R}px`,
    borderBottomLeftRadius: (!isOutgoing && showTail) ? '2px' : `${R}px`,
    borderBottomRightRadius: (isOutgoing && showTail) ? '2px' : `${R}px`,
    backgroundColor: bg,
    color: textColor,
  };
};

export const getHarmoniousUnreadDividerColors = (
  msg: WhatsAppChatMessage | undefined,
  data: WhatsAppChatData,
  isEffectiveDark: boolean,
  isDark: boolean,
  useCustomColors: boolean,
  activeMainText?: string,
  headerTextColor?: string
) => {
  const customBg = msg?.unreadDividerBgColor || data?.unreadDividerBgColor;
  const customText = msg?.unreadDividerTextColor || data?.unreadDividerTextColor;
  const customBorder = msg?.unreadDividerBorderColor || data?.unreadDividerBorderColor;

  if (customBg) {
    return {
      bg: customBg,
      border: customBorder || (isEffectiveDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)'),
      text: customText || (isEffectiveDark ? '#ffffff' : '#1e293b'),
    };
  }

  const { activeThemePreset, senderBubbleColor, receiverBubbleColor, chatBgColor, barBgColor, iconColor, cameraBgColor, inputBgColor, mainTextColor } = data;

  if (!useCustomColors || activeThemePreset === 'wa-classic-light' || (!isEffectiveDark && !activeThemePreset && !senderBubbleColor && !receiverBubbleColor)) {
    if (isEffectiveDark || (!useCustomColors && isDark) || activeThemePreset === 'wa-classic-dark') {
      return { bg: '#1f2c34', border: '#2a3942', text: '#d1d7db' };
    }
    return { bg: '#faeee1', border: '#ecdac9', text: '#524336' };
  }

  if (isEffectiveDark) {
    const baseDark = receiverBubbleColor || chatBgColor || barBgColor || '#1f2c34';
    const accent = senderBubbleColor || iconColor || cameraBgColor || '#25D366';
    return {
      bg: `color-mix(in srgb, ${baseDark || '#1f2c34'} 84%, ${accent || '#25D366'} 16%)`,
      border: `color-mix(in srgb, ${baseDark || '#1f2c34'} 80%, ${accent || '#25D366'} 20%)`,
      text: activeMainText || headerTextColor || `color-mix(in srgb, ${accent || '#25D366'} 25%, #ffffff 75%)`,
    };
  } else {
    const baseLight = chatBgColor || '#ffffff';
    const themeTint = senderBubbleColor || receiverBubbleColor || inputBgColor || iconColor || '#faeee1';
    return {
      bg: `color-mix(in srgb, ${themeTint || '#faeee1'} 22%, ${baseLight || '#ffffff'} 78%)`,
      border: `color-mix(in srgb, ${themeTint || '#faeee1'} 32%, ${baseLight || '#ffffff'} 68%)`,
      text: activeMainText || mainTextColor || headerTextColor || `color-mix(in srgb, ${themeTint || '#faeee1'} 45%, #1e293b 55%)`,
    };
  }
};

export const getHarmoniousSystemNoticeColors = (
  msg: WhatsAppChatMessage | undefined,
  data: WhatsAppChatData,
  isEffectiveDark: boolean,
  isDark: boolean,
  useCustomColors: boolean,
  activeMainText?: string
) => {
  const customBg = (msg as any)?.systemNoticeBgColor || (msg as any)?.systemBgColor;
  const customText = (msg as any)?.systemNoticeTextColor || (msg as any)?.systemTextColor;
  const customBorder = (msg as any)?.systemNoticeBorderColor || (msg as any)?.systemBorderColor;

  if (customBg) {
    return {
      bg: customBg,
      border: customBorder || (isEffectiveDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(0, 0, 0, 0.12)'),
      text: customText || (isEffectiveDark ? '#ffffff' : '#1e293b'),
    };
  }

  const presetId = data?.activeThemePreset;
  const presetMap: Record<string, { bg: string; text: string; border: string }> = {
    'ocean-teal': { bg: '#003830', text: '#A7F3D0', border: '1px solid #004D40' },
    'sakura-blossom': { bg: '#FFE4E8', text: '#5C2D37', border: '1px solid #F8B6C6' },
    'wine': { bg: '#360E17', text: '#FCE7F3', border: '1px solid #5E1525' },
    'midnight-purple': { bg: '#250E3F', text: '#E9D5FF', border: '1px solid #4C1D95' },
    'cyber-blue': { bg: '#0F1D33', text: '#93C5FD', border: '1px solid #1E3A5F' },
    'matcha-pink': { bg: '#E2EFE0', text: '#2C3E2D', border: '1px solid #C5DCC3' },
    'royal-gold': { bg: '#241E0F', text: '#FEF08A', border: '1px solid #453A1C' },
    'graphite-black': { bg: '#242424', text: '#E5E5E5', border: '1px solid #383838' },
    'aqua-mint': { bg: '#CFF4F9', text: '#004D54', border: '1px solid #9EE2EB' },
    'emerald-green': { bg: '#0F3B24', text: '#BBF7D0', border: '1px solid #1A5937' },
    'toy-story': { bg: '#FEF08A', text: '#1E293B', border: '1px solid #FDE047' },
    'lavender-dream': { bg: '#EDE9FE', text: '#4C1D95', border: '1px solid #DDD6FE' },
  };

  if (presetId && presetMap[presetId]) {
    return presetMap[presetId];
  }

  const { senderBubbleColor, receiverBubbleColor, chatBgColor, barBgColor, iconColor, cameraBgColor, inputBgColor } = data;

  if (!useCustomColors || presetId === 'wa-classic-light' || (!isEffectiveDark && !presetId && !senderBubbleColor && !receiverBubbleColor)) {
    if (isEffectiveDark || (!useCustomColors && isDark) || presetId === 'wa-classic-dark') {
      return { bg: '#1F2C34', border: '1px solid #2A3942', text: '#E9EDEF' };
    }
    return { bg: '#FFEECD', border: '1px solid #E2D3B3', text: '#54656F' };
  }

  if (isEffectiveDark) {
    const baseDark = receiverBubbleColor || chatBgColor || barBgColor || '#1f2c34';
    const accent = senderBubbleColor || iconColor || cameraBgColor || '#25D366';
    return {
      bg: `color-mix(in srgb, ${baseDark || '#1f2c34'} 85%, ${accent || '#25D366'} 15%)`,
      border: `1px solid color-mix(in srgb, ${baseDark || '#1f2c34'} 70%, ${accent || '#25D366'} 30%)`,
      text: activeMainText || `color-mix(in srgb, ${accent || '#25D366'} 30%, #ffffff 70%)`,
    };
  } else {
    const baseLight = chatBgColor || '#ffffff';
    const themeTint = senderBubbleColor || receiverBubbleColor || inputBgColor || iconColor || '#FFEECD';
    return {
      bg: `color-mix(in srgb, ${themeTint || '#FFEECD'} 30%, ${baseLight || '#ffffff'} 70%)`,
      border: `1px solid color-mix(in srgb, ${themeTint || '#FFEECD'} 45%, ${baseLight || '#ffffff'} 55%)`,
      text: activeMainText || `color-mix(in srgb, ${themeTint || '#FFEECD'} 45%, #111b21 55%)`,
    };
  }
};
