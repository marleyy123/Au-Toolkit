import React from 'react';
import { WhatsAppChatData, WhatsAppChatMessage } from '../../../types';
import { DEFAULT_AVATAR, INITIAL_WHATSAPP_CHAT_DATA } from '../../../data/defaultTemplates';
import { renderFormattedTextWithAppleEmojis } from '../../../utils/emojiUtils';
import { useLanguage } from '../../../context/LanguageContext';
import { isSameWhatsAppSender, resolveWhatsAppGroupSenders } from '../messageSenders';

interface Props {
  data: WhatsAppChatData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMessageText?: (id: string, newText: string) => void;
  onChange?: (updated: WhatsAppChatData) => void;
}

// Render checkmarks based on message status ('sent' | 'delivered' | 'read')
const renderTicks = (msg: WhatsAppChatMessage, isDark: boolean, isOverlay: boolean = false, isSenderDark: boolean = false) => {
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

// Universal iOS Emoji Renderer helper function with proportional font-relative sizing
export const formatWhatsAppTime = (timeStr?: string): string => {
  if (!timeStr || timeStr.trim() === '') return '12.00';
  return timeStr.replace(/:/g, '.');
};

export const renderIosEmojis = renderFormattedTextWithAppleEmojis;

const splitWhatsAppGraphemes = (value: string): string[] => {
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

/**
 * Universal helper for WhatsApp Chat Bubble (Text formatting with max characters per line):
 * Wraps text so that every line takes up to 30 grapheme clusters before moving to the next line.
 * - Safe for emojis (using grapheme clustering / Intl.Segmenter) so emojis and accents are never split.
 * - Leading spaces on wrapped lines are trimmed cleanly.
 */
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

const analyzeWhatsAppBubbleText = (text?: string | null) => {
  // Let layout wrap words; preserve only line breaks authored by the user.
  const formatted = String(text ?? '').replace(/\r\n?/g, '\n');
  const lineLengths = formatted.split('\n').map((line) => splitWhatsAppGraphemes(line).length);
  return {
    formatted,
    lineCount: lineLengths.length,
    maxLineLen: lineLengths.length ? Math.max(...lineLengths) : 0,
    lastLineLen: lineLengths.length ? lineLengths[lineLengths.length - 1] : 0,
  };
};

// Backwards compatibility alias
export const formatWhatsAppLeftBubbleText = formatWhatsAppBubbleText;

const WhatsAppInlineMetaSpacer: React.FC<{ msg: WhatsAppChatMessage; isOutgoing: boolean; isDark: boolean; isSenderBubbleDark: boolean }> = ({
  msg,
  isOutgoing,
  isDark,
  isSenderBubbleDark,
}) => (
  <span
    aria-hidden="true"
    className="inline-flex invisible items-center gap-1 pl-1.5 text-[10px] leading-none whitespace-nowrap align-baseline select-none"
  >
    <span className="leading-none font-normal">{formatWhatsAppTime(msg.time)}</span>
    {isOutgoing && renderTicks(msg, isDark, false, isSenderBubbleDark)}
  </span>
);


export const WhatsAppChatPreview: React.FC<Props> = ({ data: rawData, previewRef, onUpdateMessageText, onChange }) => {
  const { language } = useLanguage();
  const data = rawData || INITIAL_WHATSAPP_CHAT_DATA;
  const {
    contactName = '',
    contactAvatar = '',
    statusText = '',
    isGroupChat = false,
    groupParticipants = '',
    showHeader = true,
    showInputBar = true,
    showUnreadDivider = false,
    unreadDividerText = '',
    unreadDividerStyle = 'banner',
    aspectRatio = '4:5',
    theme = 'light',
    sameSenderGap = 3,
    differentSenderGap = 12,
    dateDividerGap = 12,
    unreadDividerGap = 8,
    unreadDividerPadding = 3.5,
    bubbleRoundness = 12,
    useCustomColors = false,
    barBgColor,
    headerBgColor,
    headerTextColor,
    inputBgColor,
    cameraBgColor,
    cameraIconColor,
    chatBgColor,
    senderBubbleColor,
    receiverBubbleColor,
    mainTextColor,
    secondaryTextColor,
    iconColor,
    messages = [],
  } = data || INITIAL_WHATSAPP_CHAT_DATA;

  const isDark = theme === 'dark';

  const isHexDark = (colorHex?: string): boolean => {
    if (!colorHex || !colorHex.startsWith('#')) return false;
    const hex = colorHex.replace('#', '');
    if (hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };

  const isEffectiveDark = useCustomColors
    ? isHexDark(chatBgColor || headerBgColor || barBgColor)
    : isDark;

  const isAndroid = false; // WhatsApp is permanently locked to iOS mode per specification
  const bubbleWidthPercent = Math.min(94, Math.max(50, data.bubbleWidthPercent ?? 94));
  const messageFontSize = Math.min(18, Math.max(11, data.messageFontSize ?? 15));

  // Authentic natural WhatsApp background colors (never pitch black #000000 or #0b141a)
  // Light mode: #efeae2 (warm authentic WhatsApp background)
  // Dark mode: #121b22 (harmonious authentic WhatsApp Android/iOS slate-teal)
  const defaultLightChatBg = '#efeae2';
  const defaultDarkChatBg = '#121b22';
  const defaultThemeChatBg = isDark ? defaultDarkChatBg : defaultLightChatBg;

  // Custom Color Overrides
  const activeBarBg = useCustomColors ? (inputBgColor || barBgColor || (isAndroid ? (isDark ? '#1f2c34' : '#ffffff') : '#075E54')) : undefined;
  const activeHeaderBg = useCustomColors ? (headerBgColor || barBgColor || '#075E54') : undefined;
  const activeHeaderTextColor = useCustomColors ? (headerTextColor || mainTextColor || '#ffffff') : undefined;
  const activeChatBg = useCustomColors
    ? (chatBgColor && typeof chatBgColor === 'string' && chatBgColor.trim() !== '' ? chatBgColor : defaultThemeChatBg)
    : defaultThemeChatBg;
  const activeSenderBg = useCustomColors ? (senderBubbleColor || '#005C4B') : undefined;
  const activeReceiverBg = useCustomColors ? (receiverBubbleColor || '#202c33') : undefined;
  const activeMainText = useCustomColors ? (mainTextColor || '#ffffff') : undefined;
  const activeSecText = useCustomColors ? (secondaryTextColor || '#8696a0') : undefined;
  const activeTimestampColor = useCustomColors ? (data?.timestampColor || secondaryTextColor || '#8696a0') : undefined;
  const activeIconColor = useCustomColors ? (iconColor || '#00a884') : undefined;
  const activeCameraBg = useCustomColors ? (cameraBgColor || undefined) : undefined;
  const activeCameraIconColor = useCustomColors ? (cameraIconColor || activeIconColor || '#007AFF') : undefined;

  // Effective Header Colors (Authentic iOS vs Android WhatsApp)
  const effectiveHeaderBg = activeHeaderBg || (
    isAndroid
      ? (isDark ? '#1f2c34' : '#008069')
      : (isDark ? '#1c1c1e' : '#F6F6F6')
  );

  const effectiveHeaderTextColor = activeHeaderTextColor || (
    isAndroid ? '#ffffff' : (isDark ? '#ffffff' : '#000000')
  );

  const effectiveHeaderIconColor = activeIconColor || (
    isAndroid ? '#ffffff' : '#007AFF'
  );

  const effectiveHeaderSecText = activeSecText || (
    isAndroid ? 'rgba(255, 255, 255, 0.82)' : (isDark ? '#8e8e93' : '#8e8e93')
  );

  const effectiveSenderBg = useCustomColors
    ? (senderBubbleColor || '#005C4B')
    : (isDark ? '#005C4B' : '#E2FFC7');

  const effectiveReceiverBg = useCustomColors
    ? (receiverBubbleColor || '#202c33')
    : (isDark ? '#262628' : '#ffffff');

  const isSenderBubbleDark = isHexDark(effectiveSenderBg);
  const isReceiverBubbleDark = isHexDark(effectiveReceiverBg);

  // Harmonious Missed Call Circle background aligned with receiver/sender bubble
  const getHarmoniousMissedCallCircleBg = (isMsgOutgoing: boolean) => {
    if (useCustomColors && data?.missedCallCircleBg) {
      return data.missedCallCircleBg;
    }
    const parentBg = isMsgOutgoing ? effectiveSenderBg : effectiveReceiverBg;
    const isParentDark = isHexDark(parentBg);

    if (isParentDark) {
      // Soft harmonious lighter tint of the bubble
      return `color-mix(in srgb, ${parentBg || '#005C4B'} 78%, white 22%)`;
    } else {
      // Soft harmonious deeper tint of the bubble (never stark pure white, blends seamlessly)
      return `color-mix(in srgb, ${parentBg || '#ffffff'} 88%, black 12%)`;
    }
  };

  // Harmonious Reply Bar accent color matching active theme
  const getHarmoniousReplyBarColor = (msg: WhatsAppChatMessage, isMsgOutgoing: boolean) => {
    if (msg.replyBarColor && msg.replyBarColor.trim() !== '') {
      return msg.replyBarColor;
    }
    // 1. Sender Bubble (outgoing)
    if (isMsgOutgoing) {
      if (isSenderBubbleDark) {
        // Soft, harmonious accent bar on dark sender bubbles rather than harsh raw white
        return activeIconColor || 'rgba(255, 255, 255, 0.65)';
      } else {
        // Light/pastel sender bubble (e.g. Classic Light, Matcha Pink, Sakura Blossom, Aqua Mint, Yellow Blue)
        // Use active theme accent color or vibrant secondary tone
        return activeIconColor || cameraBgColor || '#008069';
      }
    }

    // 2. Receiver Bubble (incoming)
    if (isReceiverBubbleDark) {
      // Dark receiver bubble (e.g. Cyber Blue, Midnight Purple, Classic Dark, Wine, Graphite Black, Ocean Teal, Emerald Green)
      // Soft harmonious accent matching active theme palette
      return activeIconColor || cameraBgColor || 'rgba(37, 211, 102, 0.85)';
    } else {
      // Light / White receiver bubble (e.g. Classic Light, Sakura Blossom, Aqua Mint, Matcha Pink, Yellow Blue)
      // Harmonious accent matching the active theme palette
      return activeIconColor || cameraBgColor || (useCustomColors && secondaryTextColor ? secondaryTextColor : '#008069');
    }
  };

  // Harmonious Reply Sender title color matching active theme
  const getHarmoniousReplySenderColor = (msg: WhatsAppChatMessage, isMsgOutgoing: boolean) => {
    if (msg.replySenderColor && msg.replySenderColor.trim() !== '') {
      return msg.replySenderColor;
    }
    // For Sender Bubble (outgoing):
    if (isMsgOutgoing) {
      if (isSenderBubbleDark) {
        // Pure crisp white or very light matching accent so it pops clearly on dark bubble
        return '#FFFFFF';
      } else {
        // On light sender bubble, match the theme accent or dark readable accent
        return activeIconColor || cameraBgColor || '#008069';
      }
    }

    // For Receiver Bubble (incoming):
    if (isReceiverBubbleDark) {
      // Light accent tone on dark receiver bubble
      return activeIconColor || cameraBgColor || '#25D366';
    } else {
      // Harmonious theme accent tone on light receiver bubble
      return activeIconColor || cameraBgColor || '#008069';
    }
  };

  // High-contrast timestamp color per bubble type
  const getMessageTimestampColor = (isMsgOutgoing: boolean) => {
    if (useCustomColors && data?.timestampColor) {
      return data.timestampColor;
    }
    if (isMsgOutgoing) {
      return isSenderBubbleDark ? 'rgba(255, 255, 255, 0.78)' : 'rgba(0, 0, 0, 0.52)';
    } else {
      if (useCustomColors && secondaryTextColor) {
        return secondaryTextColor;
      }
      return isReceiverBubbleDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)';
    }
  };

  // Harmonious Unread Divider Colors dynamically matching the active chat theme
  const getHarmoniousUnreadDividerColors = (msg?: WhatsAppChatMessage) => {
    // 1. Manual custom override (from message level or global form data)
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

    // 2. Default WhatsApp classic themes
    if (!useCustomColors || data?.activeThemePreset === 'wa-classic-light' || (!isEffectiveDark && !data?.activeThemePreset && !senderBubbleColor && !receiverBubbleColor)) {
      if (isEffectiveDark || (!useCustomColors && isDark) || data?.activeThemePreset === 'wa-classic-dark') {
        return {
          bg: '#1f2c34',
          border: '#2a3942',
          text: '#d1d7db',
        };
      }
      // Authentic WA light pastel cream banner (exact match to WhatsApp reference image)
      return {
        bg: '#faeee1',
        border: '#ecdac9',
        text: '#524336',
      };
    }

    // 3. Dynamic Match with Active Theme (Matcha Pink, Cyber Blue, Midnight Purple, Sakura, Deep Wine, Aqua Mint, Yellow Blue, etc.)
    if (isEffectiveDark) {
      // Dark theme: blend dark base with theme accent
      const baseDark = receiverBubbleColor || chatBgColor || barBgColor || '#1f2c34';
      const accent = senderBubbleColor || iconColor || cameraBgColor || '#25D366';
      return {
        bg: `color-mix(in srgb, ${baseDark || '#1f2c34'} 84%, ${accent || '#25D366'} 16%)`,
        border: `color-mix(in srgb, ${baseDark || '#1f2c34'} 80%, ${accent || '#25D366'} 20%)`,
        text: activeMainText || headerTextColor || `color-mix(in srgb, ${accent || '#25D366'} 25%, #ffffff 75%)`,
      };
    } else {
      // Light theme: blend wallpaper/base with subtle theme pastel tint (e.g. matcha, pink, mint, yellow)
      const baseLight = chatBgColor || '#ffffff';
      const themeTint = senderBubbleColor || receiverBubbleColor || inputBgColor || iconColor || '#faeee1';
      return {
        bg: `color-mix(in srgb, ${themeTint || '#faeee1'} 22%, ${baseLight || '#ffffff'} 78%)`,
        border: `color-mix(in srgb, ${themeTint || '#faeee1'} 32%, ${baseLight || '#ffffff'} 68%)`,
        text: activeMainText || mainTextColor || headerTextColor || `color-mix(in srgb, ${themeTint || '#faeee1'} 45%, #1e293b 55%)`,
      };
    }
  };

  // Harmonious System Notice Colors dynamically matching the active chat theme preset
  const getHarmoniousSystemNoticeColors = (msg?: WhatsAppChatMessage) => {
    // 1. Manual per-message custom overrides if specified
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

    // 2. Preset specific matching
    const presetId = data?.activeThemePreset;
    if (presetId === 'ocean-teal') {
      return { bg: '#003830', text: '#A7F3D0', border: '1px solid #004D40' };
    }
    if (presetId === 'sakura-blossom') {
      return { bg: '#FFE4E8', text: '#5C2D37', border: '1px solid #F8B6C6' };
    }
    if (presetId === 'wine') {
      return { bg: '#360E17', text: '#FCE7F3', border: '1px solid #5E1525' };
    }
    if (presetId === 'midnight-purple') {
      return { bg: '#250E3F', text: '#E9D5FF', border: '1px solid #4C1D95' };
    }
    if (presetId === 'cyber-blue') {
      return { bg: '#0F1D33', text: '#93C5FD', border: '1px solid #1E3A5F' };
    }
    if (presetId === 'matcha-pink') {
      return { bg: '#E2EFE0', text: '#2C3E2D', border: '1px solid #C5DCC3' };
    }
    if (presetId === 'royal-gold') {
      return { bg: '#241E0F', text: '#FEF08A', border: '1px solid #453A1C' };
    }
    if (presetId === 'graphite-black') {
      return { bg: '#242424', text: '#E5E5E5', border: '1px solid #383838' };
    }
    if (presetId === 'aqua-mint') {
      return { bg: '#CFF4F9', text: '#004D54', border: '1px solid #9EE2EB' };
    }
    if (presetId === 'emerald-green') {
      return { bg: '#0F3B24', text: '#BBF7D0', border: '1px solid #1A5937' };
    }
    if (presetId === 'toy-story') {
      return { bg: '#FEF08A', text: '#1E293B', border: '1px solid #FDE047' };
    }
    if (presetId === 'lavender-dream') {
      return { bg: '#EDE9FE', text: '#4C1D95', border: '1px solid #DDD6FE' };
    }

    // 3. Fallback for classic themes or uncustomized mode
    if (!useCustomColors || presetId === 'wa-classic-light' || (!isEffectiveDark && !presetId && !senderBubbleColor && !receiverBubbleColor)) {
      if (isEffectiveDark || (!useCustomColors && isDark) || presetId === 'wa-classic-dark') {
        return {
          bg: '#1F2C34',
          border: '1px solid #2A3942',
          text: '#E9EDEF',
        };
      }
      return {
        bg: '#FFEECD',
        border: '1px solid #E2D3B3',
        text: '#54656F',
      };
    }

    // 4. Dynamic Theme Derivation for other custom palettes
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

  const placeholderColor = useCustomColors
    ? (isEffectiveDark
        ? (activeSecText || 'rgba(255, 255, 255, 0.4)')
        : (activeSecText || 'rgba(0, 0, 0, 0.45)'))
    : (isDark ? '#8696A0' : 'rgba(0, 0, 0, 0.45)');

  const inputBarIconColor = useCustomColors
    ? (activeIconColor || '#007AFF')
    : '#007AFF';

  // Inline Editing State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState<string>('');

  const handleStartEditing = (msgId: string, currentText: string) => {
    setEditingId(msgId);
    setEditingText(currentText || '');
  };

  const handleSaveEditing = (msgId: string) => {
    if (msgId === 'auto-unread-divider') {
      if (onChange) {
        onChange({ ...data, unreadDividerText: editingText });
      }
    } else if (onUpdateMessageText && editingText !== undefined) {
      onUpdateMessageText(msgId, editingText);
    }
    setEditingId(null);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '9:16':
        return 'aspect-[9/16]';
      case '4:5':
      default:
        return 'aspect-[4/5]';
    }
  };

  // Border radius style calculator per bubble - handles tail attachment corner cleanly
  const getBubbleStyle = (isOutgoing: boolean, showTail: boolean) => {
    const R = bubbleRoundness ?? 12;

    const bg = useCustomColors
      ? (isOutgoing ? (senderBubbleColor || '#005C4B') : (receiverBubbleColor || '#202c33'))
      : (isOutgoing ? (isDark ? '#005C4B' : '#E2FFC7') : (isDark ? '#262628' : '#ffffff'));

    const textColor = useCustomColors
      ? (mainTextColor || '#ffffff')
      : (isOutgoing ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#ffffff' : '#000000'));

    if (isOutgoing) {
      return {
        borderTopLeftRadius: `${R}px`,
        borderTopRightRadius: `${R}px`,
        borderBottomLeftRadius: `${R}px`,
        borderBottomRightRadius: `${R}px`,
        backgroundColor: bg,
        color: textColor,
      };
    } else {
      return {
        borderTopLeftRadius: `${R}px`,
        borderTopRightRadius: `${R}px`,
        borderBottomLeftRadius: `${R}px`,
        borderBottomRightRadius: `${R}px`,
        backgroundColor: bg,
        color: textColor,
      };
    }
  };

  // Check if messages already contains an unread_divider
  const safeMessageList = (Array.isArray(messages) ? messages : []).filter((m) => Boolean(m && !m.deletedForMe));
  const hasManualUnreadDivider = safeMessageList.some((m) => m?.type === 'unread_divider');

  let displayMessages = [...safeMessageList];
  if (showUnreadDivider && !hasManualUnreadDivider) {
    const defaultText = unreadDividerText || (language === 'id' ? '1 PESAN BELUM DIBACA' : '1 UNREAD MESSAGE');
    const autoDivider: WhatsAppChatMessage = {
      id: 'auto-unread-divider',
      sender: 'system',
      type: 'unread_divider',
      text: defaultText,
      unreadDividerStyle: unreadDividerStyle || 'banner',
      unreadDividerBgColor: data?.unreadDividerBgColor,
      unreadDividerTextColor: data?.unreadDividerTextColor,
      unreadDividerBorderColor: data?.unreadDividerBorderColor,
      unreadDividerGap: data?.unreadDividerGap,
      unreadDividerPadding: data?.unreadDividerPadding,
      time: '',
    };
    if (displayMessages.length === 0) {
      displayMessages = [autoDivider];
    } else {
      let insertIndex = -1;
      for (let i = displayMessages.length - 1; i >= 0; i--) {
        if (displayMessages[i]?.sender === 'incoming') {
          insertIndex = i;
          break;
        }
      }
      if (insertIndex === -1) {
        insertIndex = displayMessages.length - 1;
      }
      displayMessages.splice(insertIndex, 0, autoDivider);
    }
  }

  if (isGroupChat) displayMessages = resolveWhatsAppGroupSenders(displayMessages);

  return (
    <div
      ref={previewRef}
      id="preview-target"
      style={{
        fontFamily: isAndroid
          ? 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          : '"SF UI Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
        borderRadius: 'var(--preview-corner-radius, 0px)',
        backgroundColor: activeChatBg,
        colorScheme: isDark ? 'dark' : 'light',
        forcedColorAdjust: 'none',
        width: '380px',
        height: aspectRatio === '1:1' ? '380px' : aspectRatio === '9:16' ? '676px' : '475px',
        minHeight: aspectRatio === '1:1' ? '380px' : aspectRatio === '9:16' ? '676px' : '475px',
        maxHeight: aspectRatio === '1:1' ? '380px' : aspectRatio === '9:16' ? '676px' : '475px',
        boxSizing: 'border-box',
      }}
      className={`w-[380px] min-w-[380px] max-w-[380px] ${getAspectClass()} mx-auto overflow-hidden shadow-2xl border-none outline-none ring-0 shrink-0 relative select-none flex flex-col transition-colors duration-200`}
    >
      <style>{`
        #preview-target input::placeholder {
          color: ${placeholderColor} !important;
          opacity: 0.8 !important;
        }
      `}</style>
      {/* TOP BAR (HEADER) - Authentic Android / iOS Header */}
      {showHeader && (
        <div
          style={{
            backgroundColor: effectiveHeaderBg,
            borderColor: 'transparent',
            color: effectiveHeaderTextColor,
          }}
          className="px-2 py-1.5 min-h-[50px] flex items-center justify-between shrink-0 border-b-0 z-20 transition-colors shadow-2xs"
        >
          {/* Left: Navigation (Back Arrow + Avatar + Contact Info) */}
          <div className="flex items-center min-w-0">
            {/* Back Button - Perfectly aligned with Avatar */}
            <button
              type="button"
              style={{ color: effectiveHeaderIconColor }}
              className="hover:opacity-80 transition-opacity p-1 flex items-center justify-center shrink-0 cursor-pointer"
              title="Back"
            >
              {isAndroid ? (
                <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              )}
            </button>

            {/* Profile Avatar & Contact Details - Standard WhatsApp Proportional Gap */}
            <div className="flex items-center space-x-2 ml-0.5 min-w-0">
              <div className="w-8.5 h-8.5 rounded-full overflow-hidden bg-slate-200 shrink-0">
                <img
                  src={(contactAvatar && contactAvatar.trim() !== '') ? contactAvatar : DEFAULT_AVATAR}
                  alt={contactName || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 justify-center">
                <h2
                  style={{ color: effectiveHeaderTextColor }}
                  className="text-[14.5px] font-semibold tracking-tight leading-tight truncate max-w-[155px] block"
                >
                  {renderIosEmojis(
                    (contactName && contactName.trim() !== '')
                      ? contactName
                      : (isGroupChat ? 'Group Name' : 'Name')
                  )}
                </h2>
                <span
                  style={{ color: effectiveHeaderSecText }}
                  className="text-[10.5px] font-normal leading-tight truncate max-w-[155px] -mt-0.5 opacity-90"
                >
                  {renderIosEmojis(
                    isGroupChat
                      ? ((groupParticipants || '').trim() !== '' ? groupParticipants : (language === 'id' ? 'Siti, Budi, Andi, Anda' : 'Siti, Budi, Andi, You'))
                      : ((statusText || '').trim() !== '' ? statusText : (data.isOnline !== false ? 'online' : 'offline'))
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Icons */}
          <div
            style={{ color: effectiveHeaderIconColor }}
            className="flex items-center space-x-3.5 pr-1.5"
          >
            {/* Video Call Icon */}
            <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
              {isAndroid ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              ) : (
                <svg className="w-5.5 h-5.5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="3" ry="3" />
                </svg>
              )}
            </button>
            {/* Voice Call Icon */}
            <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
              {isAndroid ? (
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.27-.27.35-.65.24-1.01A11.36 11.36 0 0 1 8.5 4.31c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.01z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              )}
            </button>
            {/* 3 Vertical Dots on Android */}
            {isAndroid && (
              <button type="button" className="hover:opacity-80 transition-opacity cursor-pointer">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MIDDLE CHAT AREA - Respects activeChatBg, never pitch black */}
      <div
        className="flex-1 relative overflow-hidden border-0 border-none outline-none ring-0 shadow-none"
        style={{
          backgroundColor: activeChatBg,
          border: '0 none transparent',
          outline: 'none',
          boxShadow: 'none',
          colorScheme: isDark ? 'dark' : 'light',
          forcedColorAdjust: 'none',
        }}
      >
        {/* Stationary Edge-to-Edge Chat Wallpaper Layer - Crisp & Sharp */}
        {data.chatWallpaper && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
            style={{
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
            }}
          >
            <img
              src={data.chatWallpaper}
              alt="Chat Wallpaper"
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{
                imageRendering: 'auto',
                filter: 'none',
                WebkitFilter: 'none',
                transform: 'none',
              }}
            />
          </div>
        )}

        {/* Scrollable Messages Container - Isolated Touch Scroll for HP/Mobile */}
        <div
          data-chat-scroll="true"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar px-[8px] pt-2.5 pb-2 z-10 border-0 border-none outline-none ring-0 shadow-none touch-pan-y"
        >
          {/* Messages List */}
          <div className="relative z-10 flex flex-col min-h-full justify-start">
            {displayMessages.map((msg, index) => {
            const isOutgoing = msg.sender === 'outgoing' || msg.sender === 'me';
            const msgType = msg.type || (msg.stickerUrl ? 'sticker' : msg.imageUrl ? 'image' : 'text');

            // Date Divider Message Rendering
            if (msgType === 'date_divider' || msgType === 'divider') {
              const currentGap = msg.dateDividerGap ?? dateDividerGap ?? 12;
              return (
                <div
                  key={msg.id || index}
                  style={{
                    marginTop: `${currentGap}px`,
                    marginBottom: `${currentGap}px`,
                  }}
                  className="flex justify-center items-center relative z-10 select-none w-full text-center shrink-0"
                >
                  <span
                    style={{
                      backgroundColor: useCustomColors
                        ? (isEffectiveDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)')
                        : (isDark ? '#182229' : '#ffffff'),
                      color: useCustomColors
                        ? (activeSecText || (isEffectiveDark ? '#ffffff' : '#54656f'))
                        : (isDark ? '#8696a0' : '#54656f'),
                      fontSize: '11px',
                      lineHeight: '1.2',
                    }}
                    className="inline-flex items-center justify-center text-[11px] font-medium tracking-wide uppercase px-3.5 py-1 rounded-md shadow-2xs text-center whitespace-nowrap select-none shrink-0"
                  >
                    {renderIosEmojis(msg.text || (language === 'id' ? 'Hari ini' : 'Today'))}
                  </span>
                </div>
              );
            }

            // Unread Message Divider Rendering
            if (msgType === 'unread_divider') {
              const isBanner = (msg.unreadDividerStyle || unreadDividerStyle || 'banner') === 'banner';
              const dividerText = msg.text || unreadDividerText || (language === 'id' ? '1 PESAN BELUM DIBACA' : '1 UNREAD MESSAGE');
              const dividerColors = getHarmoniousUnreadDividerColors(msg);

              // Slider-controlled symmetric gap: exactly balanced between top and bottom bubbles (default 14px for natural breathing room)
              const effectiveGap = typeof msg.unreadDividerGap === 'number'
                ? msg.unreadDividerGap
                : (typeof unreadDividerGap === 'number' ? unreadDividerGap : 14);

              // Slider-controlled vertical padding / height (default 4.5px)
              const effectivePadding = typeof msg.unreadDividerPadding === 'number'
                ? msg.unreadDividerPadding
                : (typeof unreadDividerPadding === 'number' ? unreadDividerPadding : 4.5);

              return (
                <div
                  key={msg.id || index}
                  style={{
                    marginTop: `${effectiveGap}px`,
                    marginBottom: `${effectiveGap}px`,
                  }}
                  className={`flex items-center justify-center relative z-10 select-none shrink-0 ${
                    isBanner ? '-mx-[8px] !w-[calc(100%+16px)]' : 'w-full px-2'
                  }`}
                >
                  {isBanner ? (
                    <div
                      style={{
                        backgroundColor: dividerColors.bg,
                        borderTop: `1px solid ${dividerColors.border}`,
                        borderBottom: `1px solid ${dividerColors.border}`,
                        color: dividerColors.text,
                        paddingTop: `${effectivePadding}px`,
                        paddingBottom: `${effectivePadding}px`,
                        boxSizing: 'border-box',
                      }}
                      className="w-full px-3 text-center shadow-2xs transition-all whitespace-nowrap overflow-hidden"
                    >
                      {editingId === msg.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleSaveEditing(msg.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditing(msg.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="bg-transparent text-center text-[13px] font-bold tracking-[0.06em] uppercase outline-none w-full py-0 leading-snug whitespace-nowrap"
                        />
                      ) : (
                        <span
                          onDoubleClick={() => handleStartEditing(msg.id, dividerText)}
                          title="Double-click to edit unread divider text"
                          className="block text-[13px] font-bold tracking-[0.06em] uppercase leading-snug cursor-pointer whitespace-nowrap truncate select-none"
                        >
                          {renderIosEmojis(dividerText)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        backgroundColor: dividerColors.bg,
                        border: `1px solid ${dividerColors.border}`,
                        color: dividerColors.text,
                        paddingTop: `${Math.max(2, effectivePadding)}px`,
                        paddingBottom: `${Math.max(2, effectivePadding)}px`,
                        boxSizing: 'border-box',
                      }}
                      className="inline-flex items-center justify-center px-4 rounded-full shadow-2xs transition-all max-w-[92%] whitespace-nowrap"
                    >
                      {editingId === msg.id ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleSaveEditing(msg.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditing(msg.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          className="bg-transparent text-center text-[12px] font-bold tracking-[0.06em] uppercase outline-none py-0 leading-none whitespace-nowrap"
                        />
                      ) : (
                        <span
                          onDoubleClick={() => handleStartEditing(msg.id, dividerText)}
                          title="Double-click to edit unread divider text"
                          className="text-[12px] font-bold tracking-[0.06em] uppercase leading-none cursor-pointer whitespace-nowrap truncate select-none"
                        >
                          {renderIosEmojis(dividerText)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // System Message Rendering (e.g. Blocked / Unblocked / System Notice)
            if (msgType === 'system') {
              const systemText = msg.text || 'You blocked this contact.';
              const effectiveGap = typeof msg.systemGap === 'number' ? msg.systemGap : 12;
              const systemColors = getHarmoniousSystemNoticeColors(msg);

              return (
                <div
                  key={msg.id || index}
                  style={{
                    marginTop: `${effectiveGap}px`,
                    marginBottom: `${effectiveGap}px`,
                  }}
                  className="flex justify-center items-center relative z-10 select-none w-full text-center px-4 shrink-0"
                >
                  <div
                    style={{
                      backgroundColor: systemColors.bg,
                      color: systemColors.text,
                      border: systemColors.border,
                    }}
                    className="inline-block max-w-[88%] text-[12px] font-semibold leading-snug px-4 py-1.5 rounded-[8px] shadow-xs text-center break-words select-none transition-all"
                  >
                    {renderIosEmojis(systemText)}
                  </div>
                </div>
              );
            }

            // Sender sequence check
            const prevMsg = index > 0 ? displayMessages[index - 1] : null;
            const isPrevDivider = prevMsg?.type === 'unread_divider' || prevMsg?.type === 'date_divider' || prevMsg?.type === 'divider' || prevMsg?.type === 'system';
            const isPrevSameSender = !!(
              prevMsg &&
              isSameWhatsAppSender(prevMsg, msg) &&
              !isPrevDivider
            );

            const nextMsg = index < displayMessages.length - 1 ? displayMessages[index + 1] : null;
            const nextMsgType = nextMsg ? (nextMsg.type || (nextMsg.stickerUrl ? 'sticker' : nextMsg.imageUrl ? 'image' : 'text')) : null;
            const isNextSameSender = !!(
              nextMsg &&
              isSameWhatsAppSender(nextMsg, msg) &&
              nextMsgType !== 'sticker' &&
              nextMsgType !== 'date_divider' &&
              nextMsgType !== 'divider' &&
              nextMsgType !== 'unread_divider' &&
              nextMsgType !== 'system'
            );

            // Tail is ONLY rendered on the LAST message in a group AND NOT for stickers!
            const isLastInGroup = !isNextSameSender;
            const showSenderName = Boolean((isGroupChat || msg.senderName) && !isOutgoing &&
              (msg.showSenderName ?? !isPrevSameSender));
            const photoWidth = Math.min(260, Math.max(120, msg.photoWidth ?? 260));
            const showTail = isLastInGroup && msgType !== 'sticker';

            // Spacing: dynamic gap calculated in pixels (calibrated: slider 0 = 2px visual margin)
            // When previous item was a divider, that divider already provided its own bottom margin,
            // so setting marginTopVal to 0 guarantees exact symmetrical vertical positioning!
            const effectiveSameSenderGap = (sameSenderGap ?? 0) + 2;
            const marginTopVal = (index === 0 || isPrevDivider) ? 0 : isPrevSameSender ? effectiveSameSenderGap : differentSenderGap;

            // Custom border radius & background styles for bubble
            const bubbleStyles = getBubbleStyle(isOutgoing, showTail);

            return (
              <div
                key={msg.id || index}
                style={{ marginTop: index === 0 ? undefined : `${marginTopVal}px` }}
                className={`flex w-full ${isOutgoing ? 'justify-end pr-2' : 'justify-start pl-2'}`}
              >
                {/* 1. STICKER TYPE */}
                {msgType === 'sticker' ? (
                  (msg.stickerUrl || msg.imageUrl || msg.text) ? (
                    <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} max-w-[70%]`}>
                      <img
                        src={(msg.stickerUrl || msg.imageUrl || msg.text || '').trim()}
                        alt="sticker"
                        className="max-w-[120px] max-h-[120px] object-contain drop-shadow-sm select-none pointer-events-none"
                      />
                      {/* Time & Read status capsule beneath sticker */}
                      <div className="bg-black/40 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 w-fit select-none">
                        <span className="leading-none">{formatWhatsAppTime(msg.time)}</span>
                        {isOutgoing && (
                          <svg viewBox="0 0 16 15" width="14" height="13" className="shrink-0 block">
                            <path
                              d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                              fill={msg.isRead !== false ? '#34B7F1' : '#ffffff'}
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ) : null
                ) : (msgType === 'missed_voice_call' || msgType === 'missed_video_call') ? (
                  /* 2. MISSED CALL TYPE - Renders as iOS WhatsApp Missed Call Block with distinct 2-column layout */
                  <div className="relative flex max-w-[85%] items-end">
                    {/* SVG EKOR INCOMING */}
                    {!isOutgoing && showTail && (
                      <svg
                        viewBox="0 0 14 15"
                        width="14"
                        height="15"
                        style={{ color: activeReceiverBg || (isDark ? '#262628' : '#ffffff') }}
                        className="absolute bottom-0 -left-[6.5px] fill-current z-20 pointer-events-none"
                      >
                        <path d="M6.5 0 C6.5 5.8 4.2 10.6 0.4 13.9 C-0.1 14.3 0.1 14.9 0.8 14.9 C4 14.9 7.6 13.6 10.8 11.6 L12.5 9 L12.5 0 Z" />
                      </svg>
                    )}

                    {/* BUBBLE UTAMA MISSED CALL */}
                    <div
                      style={getBubbleStyle(isOutgoing, showTail)}
                      className="relative z-10 w-fit shadow-2xs px-2.5 py-2 flex items-center gap-2.5 min-w-[170px] max-w-[245px]"
                    >
                      {/* Column 1 (Left): Harmonious Adaptive Circle with Red Icon and Arrow */}
                      <div
                        style={{ backgroundColor: getHarmoniousMissedCallCircleBg(isOutgoing) }}
                        className={`w-10 h-10 rounded-full shadow-xs flex items-center justify-center shrink-0 border ${
                          (isOutgoing ? isSenderBubbleDark : isReceiverBubbleDark) ? 'border-white/10' : 'border-black/5'
                        }`}
                      >
                        {msgType === 'missed_video_call' ? (
                          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                            {/* Camera Body - Enlarged Rectangle */}
                            <rect x="1.5" y="5.5" width="14" height="13" rx="2.5" fill="#FF3B30" />
                            {/* Camera Lens - Enlarged */}
                            <path
                              d="M16 9.8L21.5 6.2C22.2 5.7 23 6.2 23 7.1V16.9C23 17.8 22.2 18.3 21.5 17.8L16 14.2V9.8Z"
                              fill="#FF3B30"
                            />
                            {/* Arrow INSIDE the video camera body */}
                            <path
                              d="M11 9L6 14M6 14H9.8M6 14V10.2"
                              stroke="#FFFFFF"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-5.5 h-5.5" fill="none">
                            {/* Phone Handset - Enlarged */}
                            <path
                              d="M17.8 14.5l-2.1-.25a1.6 1.6 0 0 0-1.32.46l-1.48 1.48a12.1 12.1 0 0 1-5.3-5.3l1.48-1.48c.35-.35.52-.83.46-1.32l-.25-2.1A1.6 1.6 0 0 0 7.7 4.4H5.5A1.6 1.6 0 0 0 3.9 6.1 15.2 15.2 0 0 0 17.9 20.1a1.6 1.6 0 0 0 1.7-1.6v-2.2a1.6 1.6 0 0 0-1.8-1.8z"
                              transform="matrix(1.18 0 0 1.18 -1.7 -1.7)"
                              fill="#FF3B30"
                            />
                            {/* Arrow - Original Size & Crisp (Unchanged) */}
                            <path
                              d="M19 4L13.5 9.5M13.5 9.5H17.5M13.5 9.5V5.5"
                              stroke="#FF3B30"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Column 2 (Right): Sender Name, Title, Subtitle, and Timestamp */}
                      <div className="flex-1 flex flex-col justify-center min-w-0 pr-0.5">
                        {showSenderName && (
                          <span
                            style={{ color: msg.senderColor || '#e542a3' }}
                            className="text-[12px] font-bold leading-tight truncate mb-0.5 select-none"
                          >
                            {renderIosEmojis(msg.senderName || (language === 'id' ? 'Pengguna' : 'User'))}
                          </span>
                        )}
                        <span
                          style={{ color: activeMainText }}
                          className="text-[13px] font-semibold leading-tight truncate"
                        >
                          {renderIosEmojis(
                            msg.text && !msg.text.includes('Panggilan') && !msg.text.includes('Missed')
                              ? msg.text
                              : (language === 'id'
                                ? (msgType === 'missed_video_call' ? 'Panggilan video tak terjawab' : 'Panggilan suara tak terjawab')
                                : (msgType === 'missed_video_call' ? 'Missed video call' : 'Missed voice call'))
                          )}
                        </span>
                        <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
                          <span
                            style={{ color: activeSecText }}
                            className={`text-[11px] font-normal leading-tight truncate ${
                              !useCustomColors && (isDark ? 'text-slate-400' : 'text-[#8e8e93]')
                            }`}
                          >
                            {language === 'id' ? 'Ketuk untuk menelepon balik' : 'Tap to call back'}
                          </span>
                          <span
                            style={{ color: getMessageTimestampColor(isOutgoing) }}
                            className={`text-[9.5px] leading-none shrink-0 select-none ml-1.5 self-end ${
                              !useCustomColors && (isOutgoing
                                ? (isSenderBubbleDark ? 'text-white/75' : 'text-slate-700/80')
                                : (isReceiverBubbleDark ? 'text-slate-400' : 'text-[#8e8e93]'))
                            }`}
                          >
                            {formatWhatsAppTime(msg.time)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SVG EKOR OUTGOING */}
                    {isOutgoing && showTail && (
                      <svg
                        viewBox="0 0 14 15"
                        width="14"
                        height="15"
                        style={{ color: activeSenderBg || (isDark ? '#005C4B' : '#E2FFC7') }}
                        className="absolute bottom-0 -right-[6.5px] fill-current z-20 pointer-events-none"
                      >
                        <path d="M7.5 0 C7.5 5.8 9.8 10.6 13.6 13.9 C14.1 14.3 13.9 14.9 13.2 14.9 C10 14.9 6.4 13.6 3.2 11.6 L1.5 9 L1.5 0 Z" />
                      </svg>
                    )}
                  </div>
                ) : (
                  /* 3. TEXT OR IMAGE TYPE - Render inside chat bubble with WhatsApp max-width (39 chars per line) */
                  <div className="relative flex items-end" style={{ maxWidth: `${bubbleWidthPercent}%` }}>
                    {/* SVG EKOR INCOMING - Nempel persis di pojok kiri bawah tanpa celah */}
                    {!isOutgoing && showTail && (
                      <svg
                        viewBox="0 0 14 15"
                        width="14"
                        height="15"
                        style={{ color: activeReceiverBg || (isDark ? '#262628' : '#ffffff') }}
                        className="absolute bottom-0 -left-[6.5px] fill-current z-20 pointer-events-none"
                      >
                        <path d="M6.5 0 C6.5 5.8 4.2 10.6 0.4 13.9 C-0.1 14.3 0.1 14.9 0.8 14.9 C4 14.9 7.6 13.6 10.8 11.6 L12.5 9 L12.5 0 Z" />
                      </svg>
                    )}

                    {/* BUBBLE UTAMA */}
                    <div
                      style={{ ...bubbleStyles, ...(msgType === 'image' && msg.photoWidth !== undefined ? { width: `${photoWidth + 8}px` } : {}) }}
                      className={`relative z-10 w-fit max-w-full shadow-2xs ${
                        msgType === 'image'
                          ? 'p-1'
                          : (msg.showReplyQuote || msg.replyToText || msg.replyToSender)
                            ? 'p-1 pb-1.5'
                            : 'px-[9px] py-[5.5px]'
                      }`}
                    >
                      {/* Sender Name for Group Chat / Incoming Messages */}
                      {showSenderName && (
                        <div
                          style={{ color: msg.senderColor || '#e542a3' }}
                          className={`text-[12.5px] font-bold leading-tight mb-0.5 truncate select-none ${
                            (msg.showReplyQuote || msg.replyToText || msg.replyToSender) ? 'px-2 pt-0.5' : 'px-1'
                          }`}
                        >
                          {renderIosEmojis(msg.senderName || (language === 'id' ? 'Pengguna' : 'User'))}
                        </div>
                      )}

                      {/* Quoted / Reply Box with full-edge vertical bar and rounded contour */}
                      {(msg.showReplyQuote || msg.replyToText || msg.replyToSender) && (() => {
                        const replyBarColor = getHarmoniousReplyBarColor(msg, isOutgoing);
                        const replySenderColor = getHarmoniousReplySenderColor(msg, isOutgoing);
                        const quoteBg = isOutgoing
                          ? (isSenderBubbleDark ? 'rgba(0, 0, 0, 0.22)' : 'rgba(0, 0, 0, 0.06)')
                          : (isReceiverBubbleDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)');
                        const quoteTextColor = isOutgoing
                          ? (isSenderBubbleDark ? 'rgba(255, 255, 255, 0.88)' : (useCustomColors && mainTextColor ? mainTextColor : '#111b21'))
                          : (isReceiverBubbleDark ? 'rgba(255, 255, 255, 0.88)' : (useCustomColors && mainTextColor ? mainTextColor : '#111b21'));

                        const previewReplySender = msg.replyToSender?.trim()
                          || data.contactName?.trim()
                          || (language === 'id' ? 'Kontak' : 'Contact');
                        const previewReplyText = msg.replyToText?.trim()
                          || (language === 'id' ? 'Pesan' : 'Message');

                        return (
                          <div
                            style={{
                              backgroundColor: quoteBg,
                              borderLeft: `3px solid ${replyBarColor}`,
                              color: quoteTextColor,
                            }}
                            className="mb-1 py-1 px-2.5 rounded-md text-[12px] leading-snug w-full min-w-[120px] select-none flex flex-col justify-center overflow-hidden"
                          >
                            <div
                              style={{
                                color: replySenderColor,
                              }}
                              className="text-[11.5px] font-bold truncate -mt-0.5 mb-0.5"
                            >
                              {renderIosEmojis(previewReplySender)}
                            </div>
                            <div className="text-[11.5px] opacity-85 truncate font-normal leading-tight">
                              {renderIosEmojis(previewReplyText)}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Image Attachment inside Bubble (Single or Multi-Photo Album Grid) */}
                      {msgType === 'image' && (() => {
                        const rawPhotos = (msg.imageUrls && msg.imageUrls.length > 0)
                          ? msg.imageUrls.filter(u => Boolean(u && u.trim() !== ''))
                          : (msg.imageUrl ? [msg.imageUrl] : (msg.text && (msg.text.startsWith('http') || msg.text.startsWith('data:')) ? [msg.text] : []));

                        if (rawPhotos.length === 0) return null;

                        const count = rawPhotos.length;
                        const hasCaption = Boolean(((msg.text && !msg.text.startsWith('http') && !msg.text.startsWith('data:') && msg.text !== msg.imageUrl) || msg.caption));
                        const captionContent = msg.caption || msg.text || '';
                        const extraBadgeText = msg.extraPhotosText?.trim() || (count > 4 ? `+${count - 3}` : null);

                        return (
                          <div className="relative w-full overflow-hidden rounded-[7.5px]">
                            {/* 1 Photo */}
                            {count === 1 && (
                              <img
                                src={rawPhotos[0].trim()}
                                alt="attachment"
                                className="w-full object-cover rounded-[7.5px]"
                                style={{ maxWidth: `${photoWidth}px`, maxHeight: `${photoWidth * 288 / 260}px` }}
                              />
                            )}

                            {/* 2 Photos: 2 columns side by side */}
                            {count === 2 && (
                              <div style={{ width: `${photoWidth}px` }} className="grid grid-cols-2 gap-[2px] max-w-full aspect-[4/3] rounded-[7.5px] overflow-hidden">
                                {rawPhotos.slice(0, 2).map((imgUrl, i) => (
                                  <div key={i} className="relative w-full h-full overflow-hidden bg-black/10">
                                    <img
                                      src={imgUrl.trim()}
                                      alt={`photo-${i + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 3 Photos: 1 tall left, 2 stacked right */}
                            {count === 3 && (
                              <div style={{ width: `${photoWidth}px` }} className="grid grid-cols-2 gap-[2px] max-w-full aspect-[4/3] rounded-[7.5px] overflow-hidden">
                                <div className="relative w-full h-full overflow-hidden bg-black/10">
                                  <img
                                    src={rawPhotos[0].trim()}
                                    alt="photo-1"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="grid grid-rows-2 gap-[2px] w-full h-full overflow-hidden">
                                  {rawPhotos.slice(1, 3).map((imgUrl, i) => (
                                    <div key={i} className="relative w-full h-full overflow-hidden bg-black/10">
                                      <img
                                        src={imgUrl.trim()}
                                        alt={`photo-${i + 2}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 4 or more Photos: 2x2 Grid with optional '+N' badge on 4th photo */}
                            {count >= 4 && (
                              <div style={{ width: `${photoWidth}px` }} className="grid grid-cols-2 gap-[2px] max-w-full aspect-square rounded-[7.5px] overflow-hidden">
                                {rawPhotos.slice(0, 4).map((imgUrl, i) => {
                                  const isLastTile = i === 3;
                                  const showOverlay = isLastTile && Boolean(extraBadgeText);

                                  return (
                                    <div key={i} className="relative w-full h-full overflow-hidden bg-black/10">
                                      <img
                                        src={imgUrl.trim()}
                                        alt={`photo-${i + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      {showOverlay && (
                                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center select-none">
                                          <span className="text-white text-xl sm:text-2xl font-bold tracking-wider drop-shadow-md">
                                            {extraBadgeText}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Photo Caption logic if text or caption present */}
                            {hasCaption ? (() => {
                              const captionMetrics = analyzeWhatsAppBubbleText(captionContent);
                              return (
                              <div
                                style={{
                                  wordWrap: 'break-word',
                                  overflowWrap: 'anywhere',
                                  fontSize: `${messageFontSize}px`,
                                }}
                                className={`px-1 pt-1 pb-0.5 relative block max-w-full text-[15px] font-sans leading-[1.35] text-current ${
                                  (msg.showReplyQuote || msg.replyToText || msg.replyToSender) ? 'px-2' : ''
                                }`}
                              >
                                <div className="min-w-0 max-w-full break-words">
                                  <span
                                    style={{
                                      wordWrap: 'break-word',
                                      overflowWrap: 'anywhere',
                                    }}
                                    className="inline whitespace-pre-wrap break-words"
                                  >
                                    {renderIosEmojis(captionMetrics.formatted)}
                                  </span>
                                  <WhatsAppInlineMetaSpacer
                                    msg={msg}
                                    isOutgoing={isOutgoing}
                                    isDark={isDark}
                                    isSenderBubbleDark={isSenderBubbleDark}
                                  />
                                </div>
                                <div
                                  style={{ color: getMessageTimestampColor(isOutgoing) }}
                                  className={`absolute bottom-0.5 ${
                                    (msg.showReplyQuote || msg.replyToText || msg.replyToSender) ? 'right-2' : 'right-1'
                                  } inline-flex items-center gap-1 text-[10px] leading-none select-none pointer-events-none whitespace-nowrap ${
                                    !useCustomColors && (isOutgoing
                                      ? (isSenderBubbleDark ? 'text-white/75' : 'text-slate-700/80')
                                      : (isReceiverBubbleDark ? 'text-slate-400' : 'text-[#8e8e93]'))
                                  }`}
                                >
                                  <span className="tracking-tight leading-none font-normal">{formatWhatsAppTime(msg.time)}</span>
                                  {isOutgoing && renderTicks(msg, isDark, false, isSenderBubbleDark)}
                                </div>
                              </div>
                              );
                            })() : (
                              <div className="absolute bottom-1.5 right-1.5 bg-black/45 backdrop-blur-xs px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 text-white text-[10px] leading-none select-none z-20">
                                <span className="leading-none">{formatWhatsAppTime(msg.time)}</span>
                                {isOutgoing && renderTicks(msg, isDark, true)}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Recalled Message Content */}
                      {(msgType === 'recalled' || msg.status === 'recalled' || msg.isRecalled) && (
                        <div
                          style={{
                            wordWrap: 'break-word',
                            overflowWrap: 'anywhere',
                          }}
                          className={`relative flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 max-w-full text-[14px] font-sans leading-[1.35] py-0.5 text-current ${
                            (msg.showReplyQuote || msg.replyToText || msg.replyToSender) ? 'px-1' : ''
                          }`}
                        >
                          <div className="grow shrink basis-auto min-w-0 max-w-full flex items-center gap-1.5 opacity-70 italic select-none">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                            </svg>
                            <span className="break-words">
                              {renderIosEmojis(
                                msg.text && !msg.text.includes('Pesan ini') && !msg.text.includes('Anda telah')
                                  ? msg.text
                                  : (isOutgoing
                                    ? (language === 'id' ? 'Anda telah menghapus pesan ini' : 'You deleted this message')
                                    : (language === 'id' ? 'Pesan ini telah dihapus' : 'This message was deleted'))
                              )}
                            </span>
                          </div>
                          {/* WhatsApp Timestamp locked cleanly at bottom-right */}
                          <div
                            style={{ color: getMessageTimestampColor(isOutgoing) }}
                            className={`shrink-0 self-end ml-auto inline-flex items-center gap-1 text-[10px] leading-none select-none pointer-events-none whitespace-nowrap ${
                              isOutgoing ? 'translate-y-[0.75px] pb-0.5' : 'pb-0.5'
                            } ${
                              !useCustomColors && (isOutgoing
                                ? (isSenderBubbleDark ? 'text-white/75' : 'text-slate-700/80')
                                : (isReceiverBubbleDark ? 'text-slate-400' : 'text-[#8e8e93]'))
                            }`}
                          >
                            <span className="tracking-tight leading-none font-normal">{formatWhatsAppTime(msg.time)}</span>
                          </div>
                        </div>
                      )}

                      {/* Text Message Content */}
                      {msgType === 'text' && !msg.isRecalled && msg.status !== 'recalled' && (() => {
                        const rawDisplayText = !isOutgoing
                          ? (msg.text || (language === 'id' ? 'Pesan masuk' : 'Received message'))
                          : (msg.text || 'Read a message');
                        const textMetrics = analyzeWhatsAppBubbleText(rawDisplayText);

                        return (
                          <div
                            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', fontSize: `${messageFontSize}px` }}
                            className={`relative block max-w-full text-[15px] font-sans leading-[1.35] text-current ${
                              (msg.showReplyQuote || msg.replyToText || msg.replyToSender) ? 'px-1 pt-0.5 pb-0.5' : ''
                            }`}
                          >
                            {editingId === (msg.id || String(index)) ? (
                              <div className="w-full">
                                <textarea autoFocus rows={1} value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onBlur={() => handleSaveEditing(msg.id || String(index))}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEditing(msg.id || String(index)); } }}
                                  style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', fontSize: `${messageFontSize}px` }}
                                  className="w-full bg-transparent border-b border-dashed border-sky-400 focus:outline-none text-[15px] font-sans leading-snug p-0 resize-none text-current break-words"
                                />
                              </div>
                            ) : (
                              <div className="min-w-0 max-w-full break-words">
                                <span onClick={() => handleStartEditing(msg.id || String(index), msg.text || '')}
                                  style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
                                  className="cursor-pointer hover:opacity-90 rounded-xs transition-opacity inline whitespace-pre-wrap break-words"
                                  title="Click to inline edit text">
                                  {renderIosEmojis(textMetrics.formatted)}
                                </span>
                                <WhatsAppInlineMetaSpacer
                                  msg={msg}
                                  isOutgoing={isOutgoing}
                                  isDark={isDark}
                                  isSenderBubbleDark={isSenderBubbleDark}
                                />
                              </div>
                            )}
                            <div style={{ color: getMessageTimestampColor(isOutgoing) }}
                              className={`absolute bottom-0.5 ${(msg.showReplyQuote || msg.replyToText || msg.replyToSender) ? 'right-1' : 'right-0'} inline-flex items-center gap-1 text-[10px] leading-none select-none pointer-events-none whitespace-nowrap ${
                                !useCustomColors && (isOutgoing
                                  ? (isSenderBubbleDark ? 'text-white/75' : 'text-slate-700/80')
                                  : (isReceiverBubbleDark ? 'text-slate-400' : 'text-[#8e8e93]'))
                              }`}>
                              <span className="tracking-tight leading-none font-normal">{formatWhatsAppTime(msg.time)}</span>
                              {isOutgoing && renderTicks(msg, isDark, false, isSenderBubbleDark)}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* SVG EKOR OUTGOING - Nempel persis di pojok kanan bawah tanpa celah */}
                    {isOutgoing && showTail && (
                      <svg
                        viewBox="0 0 14 15"
                        width="14"
                        height="15"
                        style={{ color: activeSenderBg || (isDark ? '#005C4B' : '#E2FFC7') }}
                        className="absolute bottom-0 -right-[6.5px] fill-current z-20 pointer-events-none"
                      >
                        <path d="M7.5 0 C7.5 5.8 9.8 10.6 13.6 13.9 C14.1 14.3 13.9 14.9 13.2 14.9 C10 14.9 6.4 13.6 3.2 11.6 L1.5 9 L1.5 0 Z" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR (INPUT AREA) - Slim, compact iOS WhatsApp native styling */}
      {/* BOTTOM INPUT BAR - Responsive to iOS vs Android Mode */}
      {showInputBar && (
        <div className="shrink-0 z-20">
          <div
            style={{
              backgroundColor: activeBarBg || (isAndroid ? 'transparent' : undefined),
              borderColor: (useCustomColors || isAndroid) ? 'transparent' : undefined,
            }}
            className={`px-2 py-1.5 flex items-center space-x-1.5 min-h-[44px] transition-colors ${
              !useCustomColors && !isAndroid && (isDark ? 'bg-[#1c1c1e] border-t border-white/10 text-white' : 'bg-[#F6F6F6] border-t border-black/8 text-slate-800')
            }`}
          >
            {isAndroid ? (
              /* Android WhatsApp Input Bar */
              <div className="flex items-center space-x-1.5 w-full">
                {/* Rounded Pill / Capsule */}
                <div
                  style={{
                    backgroundColor: useCustomColors
                      ? (isDark ? '#1f2c34' : '#ffffff')
                      : (isDark ? '#1f2c34' : '#ffffff'),
                    color: activeMainText || (isDark ? '#ffffff' : '#111b21'),
                  }}
                  className="flex-1 rounded-[24px] px-3 py-1 flex items-center shadow-2xs border-0 min-h-[42px] transition-colors"
                >
                  {/* Smiley Emoji Icon */}
                  <button
                    type="button"
                    style={{ color: isDark ? '#8696a0' : '#54656f' }}
                    className="hover:opacity-80 p-0.5 mr-2 shrink-0 cursor-pointer flex items-center justify-center"
                    title="Emoji"
                  >
                    <svg className="w-5.5 h-5.5 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" />
                      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Input textarea */}
                  <div className="grid grid-cols-1 flex-1 relative min-w-0 items-center">
                    <span className="col-start-1 row-start-1 invisible whitespace-pre-wrap break-words break-all text-[14px] leading-snug px-0 py-0 min-h-[18px] max-h-[90px] overflow-hidden">
                      {(data.inputText || '') + ' '}
                    </span>
                    <textarea
                      rows={1}
                      value={data.inputText ?? ''}
                      onChange={(e) => {
                        if (onChange) {
                          onChange({ ...data, inputText: e.target.value });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && (data.inputText || '').trim()) {
                          e.preventDefault();
                          if (onChange) {
                            const newMsg = {
                              id: 'wa-msg-' + Date.now(),
                              sender: 'outgoing' as const,
                              type: 'text' as const,
                              text: data.inputText!.trim(),
                              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                              isRead: true,
                            };
                            onChange({
                              ...data,
                              messages: [...(data.messages || []), newMsg],
                              inputText: '',
                            });
                          }
                        }
                      }}
                      placeholder=""
                      style={{ color: activeMainText || (isDark ? '#ffffff' : '#111b21') }}
                      className="col-start-1 row-start-1 w-full bg-transparent border-none outline-none focus:outline-none text-[14px] leading-snug p-0 resize-none break-words break-all whitespace-pre-wrap overflow-y-auto max-h-[90px]"
                    />
                  </div>

                  {/* Attachment Paperclip */}
                  <button
                    type="button"
                    style={{ color: isDark ? '#8696a0' : '#54656f' }}
                    className="hover:opacity-80 p-1 ml-1.5 shrink-0 cursor-pointer flex items-center justify-center rotate-[45deg]"
                    title="Attach"
                  >
                    <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>

                  {/* Camera Icon inside capsule when empty */}
                  {!((data.inputText || '').trim()) && (
                    <button
                      type="button"
                      style={{ color: isDark ? '#8696a0' : '#54656f' }}
                      className="hover:opacity-80 p-1 ml-1 shrink-0 cursor-pointer flex items-center justify-center"
                      title="Camera"
                    >
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="3.75" />
                        <circle cx="18" cy="10" r="0.9" fill="currentColor" stroke="none" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Android Outer Floating Circular Action Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onChange && (data.inputText || '').trim()) {
                      const newMsg = {
                        id: 'wa-msg-' + Date.now(),
                        sender: 'outgoing' as const,
                        type: 'text' as const,
                        text: data.inputText!.trim(),
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                        isRead: true,
                      };
                      onChange({
                        ...data,
                        messages: [...(data.messages || []), newMsg],
                        inputText: '',
                      });
                    }
                  }}
                  style={{
                    backgroundColor: activeIconColor || '#00a884',
                    color: '#ffffff',
                  }}
                  className="w-10.5 h-10.5 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md hover:brightness-105 active:scale-95"
                  title={(data.inputText || '').trim() ? (language === 'id' ? 'Kirim Pesan' : 'Send') : 'Voice message'}
                >
                  {(data.inputText || '').trim() ? (
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              /* iOS WhatsApp Input Bar */
              <>
                <button
                  type="button"
                  style={{ color: inputBarIconColor }}
                  className="hover:opacity-80 p-0.5 transition-opacity shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <svg className="w-6.5 h-6.5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                </button>

                {/* Editable Input Capsule */}
                <div
                  style={{
                    backgroundColor: useCustomColors
                      ? (typeof activeMainText === 'string' && (activeMainText.toLowerCase().startsWith('#f') || activeMainText.toLowerCase() === '#ffffff')
                          ? 'rgba(255, 255, 255, 0.18)'
                          : 'rgba(0, 0, 0, 0.07)')
                      : undefined,
                    color: activeMainText,
                    borderColor: useCustomColors
                      ? (typeof activeMainText === 'string' && (activeMainText.toLowerCase().startsWith('#f') || activeMainText.toLowerCase() === '#ffffff')
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(0, 0, 0, 0.12)')
                      : undefined,
                  }}
                  className={`relative flex-1 min-w-0 rounded-[18px] px-3 py-1 flex items-center text-[13.5px] border backdrop-blur-2xs transition-colors ${
                    !useCustomColors && (isDark ? 'bg-black border-gray-700 text-slate-100' : 'bg-white border-gray-300 text-slate-900')
                  }`}
                >
                  <div className="grid grid-cols-1 flex-1 relative min-w-0 items-center">
                    <span className={`col-start-1 row-start-1 invisible whitespace-pre-wrap break-words break-all text-[13.5px] leading-snug px-0 py-0 min-h-[18px] max-h-[90px] overflow-hidden ${
                      !((data.inputText || '').trim()) ? 'pr-6' : ''
                    }`}>
                      {(data.inputText || '') + ' '}
                    </span>
                    <textarea
                      rows={1}
                      value={data.inputText ?? ''}
                      onChange={(e) => {
                        if (onChange) {
                          onChange({ ...data, inputText: e.target.value });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && (data.inputText || '').trim()) {
                          e.preventDefault();
                          if (onChange) {
                            const newMsg = {
                              id: 'wa-msg-' + Date.now(),
                              sender: 'outgoing' as const,
                              type: 'text' as const,
                              text: data.inputText!.trim(),
                              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                              isRead: true,
                            };
                            onChange({
                              ...data,
                              messages: [...(data.messages || []), newMsg],
                              inputText: '',
                            });
                          }
                        }
                      }}
                      placeholder=""
                      style={{
                        color: activeMainText,
                      }}
                      className={`col-start-1 row-start-1 w-full bg-transparent border-none outline-none focus:outline-none text-[13.5px] leading-snug p-0 resize-none break-words break-all whitespace-pre-wrap overflow-y-auto max-h-[90px] ${
                        !((data.inputText || '').trim()) ? 'pr-7' : ''
                      } ${
                        !useCustomColors && (isDark ? 'text-slate-100' : 'text-slate-900')
                      }`}
                    />
                  </div>

                  {/* Sticker Icon inside input capsule on right end - ONLY visible when text is EMPTY */}
                  {!((data.inputText || '').trim()) && (
                    <button
                      type="button"
                      style={{ color: inputBarIconColor }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-80 p-0.5 transition-opacity shrink-0 cursor-pointer flex items-center justify-center"
                      title="Sticker"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-current shrink-0">
                        <path d="M9.5 3H14.5C18.0899 3 21 5.91015 21 9.5V12.2C21 17.0601 17.0601 21 12.2 21H9.5C5.91015 21 3 18.0899 3 14.5V9.5C3 5.91015 5.91015 3 9.5 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.2 20.8C12.6 19.8 12.7 18.6 12.7 17.2C12.7 14.3 14.3 12.7 17.2 12.7C18.6 12.7 19.8 12.6 20.8 12.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* 3. Conditional Right Actions: Send Button VS Camera & Mic */}
                {(data.inputText || '').trim() ? (
                  /* Blue / Custom Send Circle Button */
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange && (data.inputText || '').trim()) {
                        const newMsg = {
                          id: 'wa-msg-' + Date.now(),
                          sender: 'outgoing' as const,
                          type: 'text' as const,
                          text: data.inputText!.trim(),
                          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                          isRead: true,
                        };
                        onChange({
                          ...data,
                          messages: [...(data.messages || []), newMsg],
                          inputText: '',
                        });
                      }
                    }}
                    style={{ backgroundColor: activeIconColor || '#007AFF' }}
                    className="w-7.5 h-7.5 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer shadow-xs ml-0.5 hover:opacity-90"
                    title={language === 'id' ? 'Kirim Pesan' : 'Send Message'}
                  >
                    <svg
                      className="w-3.5 h-3.5 ml-0.5"
                      style={{
                        fill: (activeIconColor?.toLowerCase() === '#ffffff' || activeIconColor?.toLowerCase() === '#fff') ? '#0b141a' : '#ffffff',
                      }}
                      viewBox="0 0 24 24"
                    >
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                ) : (
                  /* Camera & Microphone Icons */
                  <div
                    style={{ color: inputBarIconColor }}
                    className="flex items-center space-x-1.5 shrink-0"
                  >
                    <button
                      type="button"
                      style={{
                        color: inputBarIconColor,
                      }}
                      className="p-0.5 hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
                      title="Camera"
                    >
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="3.75" />
                        <circle cx="18" cy="10" r="0.9" fill="currentColor" stroke="none" />
                      </svg>
                    </button>
                    <button type="button" className="hover:opacity-80 p-0.5 transition-opacity cursor-pointer" title="Microphone">
                      <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
