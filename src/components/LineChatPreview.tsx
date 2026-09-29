import React from 'react';
import { LineChatData, LineChatMessage } from '../types';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';
import { renderIosEmojis } from '../utils/emojiUtils';
import { useLanguage } from '../context/LanguageContext';

export const formatLineTimestamp = (rawTime?: string): string => {
  if (!rawTime) return '';
  return rawTime.trim().replace(/:/g, '.');
};

export const getLineCurrentTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}.${minutes}`;
};

interface Props {
  data: LineChatData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMessageText?: (id: string, newText: string) => void;
  onChange?: (updated: LineChatData) => void;
}

export const LineChatPreview: React.FC<Props> = ({ data, previewRef, onUpdateMessageText, onChange }) => {
  const { isId } = useLanguage();
  const {
    contactName = '',
    contactAvatar = '',
    timeBarTime = '16.34',
    batteryLevel = 88,
    showStatusBar = false,
    headerBgStyle = 'light-gray',
    headerCustomBgColor = '#F3F4F6',
    headerTextColor,
    themePreset = 'classic-sky',
    showPhoneIcon = false,
    chatWallpaperType = 'default-sky',
    chatWallpaperColor = '#82A2C6',
    chatWallpaperUrl,
    useCustomColors = false,
    senderBubbleColor = '#06C755',
    receiverBubbleColor = '#FFFFFF',
    senderTextColor = '#000000',
    receiverTextColor = '#000000',
    actionIconsColor = '#06C755',
    readTextLabel = 'read',
    showReadStatus = true,
    showHeader = true,
    showInputBar = true,
    inputText = '',
    inputPlaceholder = 'Message',
    plusButtonColor = '#06C755',
    aspectRatio = '9:16',
    sameSenderGap = 14,
    differentSenderGap = 18,
    bubbleRoundness = 18,
    showAvatarOnEveryMessage = true,
    isGroupChat = false,
    groupParticipants,
    messages = [],
  } = data || {};

  // Inline Editing State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState<string>('');

  const handleStartEditing = (msgId: string, currentText: string) => {
    setEditingId(msgId);
    setEditingText(currentText || '');
  };

  const handleSaveEditing = (msgId: string) => {
    if (onUpdateMessageText && editingText !== undefined) {
      onUpdateMessageText(msgId, editingText);
    }
    setEditingId(null);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '9:16':
      default:
        return 'aspect-[9/16]';
    }
  };

  // Background style calculator
  const getWallpaperStyle = (): React.CSSProperties => {
    if (chatWallpaperType === 'custom-image' && chatWallpaperUrl) {
      return {
        backgroundImage: `url(${chatWallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    if (chatWallpaperType === 'solid-color' && chatWallpaperColor) {
      return { backgroundColor: chatWallpaperColor };
    }
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') {
      return { backgroundColor: chatWallpaperColor || '#EDF7F2' };
    }
    if (themePreset === 'wine' || themePreset === 'soft-red') {
      return { backgroundColor: chatWallpaperColor || '#2A0F1A' };
    }
    if (themePreset === 'peach-cream') {
      return { backgroundColor: chatWallpaperColor || '#FFF3EC' };
    }
    if (chatWallpaperColor) {
      return { backgroundColor: chatWallpaperColor };
    }
    // Default LINE soft sky
    return {
      background: 'linear-gradient(180deg, #82A2C6 0%, #9EB8D6 100%)',
    };
  };

  const activeSenderBg =
    useCustomColors && senderBubbleColor
      ? senderBubbleColor
      : themePreset === 'soft-sage' || themePreset === 'yellow-green'
      ? '#20C76A'
      : themePreset === 'wine' || themePreset === 'soft-red'
      ? '#8F294B'
      : themePreset === 'peach-cream'
      ? '#F29A83'
      : senderBubbleColor || '#06C755';

  const activeReceiverBg =
    useCustomColors && receiverBubbleColor
      ? receiverBubbleColor
      : themePreset === 'soft-sage' || themePreset === 'yellow-green'
      ? '#FFFFFF'
      : themePreset === 'wine' || themePreset === 'soft-red'
      ? '#5A2639'
      : themePreset === 'peach-cream'
      ? '#FFFFFF'
      : receiverBubbleColor || '#FFFFFF';

  const activeSenderText =
    useCustomColors && senderTextColor
      ? senderTextColor
      : themePreset === 'soft-sage' || themePreset === 'yellow-green'
      ? '#FFFFFF'
      : themePreset === 'wine' || themePreset === 'soft-red'
      ? '#FFFFFF'
      : themePreset === 'peach-cream'
      ? '#FFFFFF'
      : senderTextColor || '#1F2937';

  const activeReceiverText =
    useCustomColors && receiverTextColor
      ? receiverTextColor
      : themePreset === 'soft-sage' || themePreset === 'yellow-green'
      ? '#334155'
      : themePreset === 'wine' || themePreset === 'soft-red'
      ? '#FFF4F6'
      : themePreset === 'peach-cream'
      ? '#5F4A45'
      : receiverTextColor || '#1F2937';

  const isDarkCanvas =
    themePreset === 'dark' ||
    themePreset === 'blue-gutter' ||
    themePreset === 'cyber-neon' ||
    themePreset === 'wine' ||
    themePreset === 'soft-red';

  const getEffectiveTimestampColor = (): string => {
    if (data.timestampColor) return data.timestampColor;
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') return '#78908A';
    if (themePreset === 'wine' || themePreset === 'soft-red') return '#D9AAB8';
    if (themePreset === 'peach-cream') return '#A98A80';
    if (isDarkCanvas) return 'rgba(255, 255, 255, 0.75)';
    return '#64748B';
  };

  const effectiveTimestampColor = getEffectiveTimestampColor();
  const effectiveReadStatusColor = effectiveTimestampColor;

  // Unified Bottom Bar Icons Color (all icons share this single matching color)
  const getBottomIconColor = (): string => {
    if (useCustomColors && plusButtonColor) {
      return plusButtonColor;
    }
    if (useCustomColors && actionIconsColor) {
      return actionIconsColor;
    }
    if (themePreset === 'classic-sky') {
      return '#64748B'; // slate/grey
    }
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') {
      return '#278653'; // Soft Green
    }
    if (themePreset === 'wine' || themePreset === 'soft-red') {
      return '#F2A9BC'; // Soft Pink
    }
    if (themePreset === 'peach-cream') {
      return '#A65D4E'; // Peach action/bottom icon color
    }
    if (themePreset === 'pastel-pink') {
      return '#DB2777'; // harmonized pink
    }
    if (themePreset === 'pastel-purple') {
      return '#7C3AED'; // harmonized purple
    }
    if (themePreset === 'pastel-blue') {
      return '#0284C7'; // harmonized sky blue
    }
    if (themePreset === 'blue-gutter') {
      return '#60A5FA'; // harmonized blue for midnight
    }
    if (themePreset === 'dark') {
      return '#06C755'; // vibrant LINE green for dark theme
    }
    return actionIconsColor || (isDarkCanvas ? 'rgba(255, 255, 255, 0.8)' : '#64748B');
  };

  const unifiedBottomIconColor = getBottomIconColor();

  // Header background & text color
  const getEffectiveHeaderTextColor = (): string => {
    if (useCustomColors && headerTextColor) {
      return headerTextColor;
    }
    if (themePreset === 'classic-sky') {
      return '#FFFFFF';
    }
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') {
      return '#166534'; // Deep Green
    }
    if (themePreset === 'wine' || themePreset === 'soft-red') {
      return '#FFF1F4'; // Soft Cream
    }
    if (themePreset === 'peach-cream') {
      return '#8F4F42';
    }
    if (themePreset === 'pastel-pink') {
      return '#DB2777'; // matching pink
    }
    if (themePreset === 'pastel-purple') {
      return '#6D28D9'; // matching purple
    }
    if (themePreset === 'pastel-blue') {
      return '#0369A1'; // matching sky blue
    }
    if (themePreset === 'blue-gutter') {
      return '#60A5FA'; // matching blue for midnight
    }
    if (themePreset === 'dark') {
      return '#F4F4F5';
    }
    return headerTextColor || '#1F2937';
  };

  const effectiveHeaderTextColor = getEffectiveHeaderTextColor();

  const getEffectiveHeaderActionColor = (): string => {
    if (useCustomColors && actionIconsColor) {
      return actionIconsColor;
    }
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') {
      return '#166534'; // Deep Green
    }
    if (themePreset === 'wine' || themePreset === 'soft-red') {
      return '#FFD4DF'; // Soft Pink Action Icons in header
    }
    if (themePreset === 'peach-cream') {
      return '#A65D4E';
    }
    return effectiveHeaderTextColor;
  };

  const effectiveHeaderActionColor = getEffectiveHeaderActionColor();

  const getHeaderStyle = (): React.CSSProperties => {
    if (headerBgStyle === 'wallpaper') {
      return { backgroundColor: 'transparent' };
    }
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') {
      return { backgroundColor: (useCustomColors ? headerCustomBgColor : undefined) || '#FFFFFF', borderBottom: '1px solid #C9D9D2' };
    }
    if (themePreset === 'wine' || themePreset === 'soft-red') {
      return { backgroundColor: (useCustomColors ? headerCustomBgColor : undefined) || '#4A1728', borderBottom: '1px solid #5A1E32' };
    }
    if (themePreset === 'peach-cream') {
      return { backgroundColor: (useCustomColors ? headerCustomBgColor : undefined) || '#FFF9F5', borderBottom: '1px solid #F5E5DC' };
    }
    if (headerBgStyle === 'custom' && headerCustomBgColor) {
      return { backgroundColor: headerCustomBgColor };
    }
    if (headerCustomBgColor && useCustomColors) {
      return { backgroundColor: headerCustomBgColor };
    }
    if (themePreset === 'classic-sky') {
      return { backgroundColor: '#263147' };
    }
    if (themePreset === 'pastel-pink') {
      return { backgroundColor: '#FFFFFF', borderBottom: '1px solid #FCE7F3' };
    }
    if (themePreset === 'pastel-purple') {
      return { backgroundColor: '#FFFFFF', borderBottom: '1px solid #EDE9FE' };
    }
    if (themePreset === 'pastel-blue') {
      return { backgroundColor: '#FFFFFF', borderBottom: '1px solid #E0F2FE' };
    }
    if (themePreset === 'blue-gutter') {
      return { backgroundColor: '#0F172A' }; // blends softly with deep navy canvas
    }
    if (themePreset === 'dark') {
      return { backgroundColor: '#18181B' };
    }
    return { backgroundColor: '#F3F4F6' };
  };

  const getOuterInputBarStyle = (): React.CSSProperties => {
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') {
      return { backgroundColor: data.bottomBarBgColor || '#E3EEE9', borderTop: '1px solid #C9D9D2', boxShadow: 'none' };
    }
    if (themePreset === 'wine' || themePreset === 'soft-red') {
      return { backgroundColor: data.bottomBarBgColor || '#24141C', borderTop: '1px solid #3E1B29', boxShadow: 'none' };
    }
    if (themePreset === 'peach-cream') {
      return { backgroundColor: data.bottomBarBgColor || '#F5E5DC', borderTop: '1px solid #E6CCC2', boxShadow: 'none' };
    }
    if (data.bottomBarBgColor) {
      return { backgroundColor: data.bottomBarBgColor, borderTop: isDarkCanvas ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)' };
    }
    if (themePreset === 'classic-sky') {
      return { backgroundColor: 'rgba(255, 255, 255, 0.96)', borderTop: '1px solid rgba(0, 0, 0, 0.06)' };
    }
    if (themePreset === 'blue-gutter') {
      return { backgroundColor: '#0F172A', borderTop: '1px solid #1E293B' };
    }
    if (themePreset === 'dark') {
      return { backgroundColor: '#18181B', borderTop: '1px solid #27272A' };
    }
    if (isDarkCanvas) {
      return { backgroundColor: 'rgba(15, 23, 42, 0.95)', borderTop: '1px solid rgba(255, 255, 255, 0.1)' };
    }
    if (themePreset === 'pastel-pink') {
      return { backgroundColor: '#FFFFFF', borderTop: '1px solid #FBCFE8', boxShadow: 'none' };
    }
    if (themePreset === 'pastel-purple') {
      return { backgroundColor: '#FFFFFF', borderTop: '1px solid #DDD6FE', boxShadow: 'none' };
    }
    if (themePreset === 'pastel-blue') {
      return { backgroundColor: '#FFFFFF', borderTop: '1px solid #BAE6FD', boxShadow: 'none' };
    }
    return { backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTop: '1px solid rgba(0, 0, 0, 0.08)' };
  };

  const getInputBoxStyle = (): React.CSSProperties => {
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') {
      return {
        backgroundColor: data.inputBgColor || '#FFFFFF',
        borderColor: data.inputBorderColor || '#C9D9D2',
      };
    }
    if (themePreset === 'wine' || themePreset === 'soft-red') {
      return {
        backgroundColor: data.inputBgColor || '#35212B',
        borderColor: data.inputBorderColor || '#70505D',
      };
    }
    if (themePreset === 'peach-cream') {
      return {
        backgroundColor: data.inputBgColor || '#FFFFFF',
        borderColor: data.inputBorderColor || '#E6CCC2',
      };
    }
    if (data.inputBgColor || data.inputBorderColor) {
      return {
        backgroundColor: data.inputBgColor || '#FFFFFF',
        borderColor: data.inputBorderColor || '#E2E8F0',
      };
    }
    if (themePreset === 'dark') {
      return {
        backgroundColor: '#27272A',
        borderColor: '#3F3F46',
      };
    }
    if (isDarkCanvas) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderColor: 'rgba(255, 255, 255, 0.18)',
      };
    }
    if (themePreset === 'classic-sky') {
      return {
        backgroundColor: 'rgba(243, 244, 246, 0.95)',
        borderColor: 'rgba(229, 231, 235, 0.9)',
      };
    }
    if (themePreset === 'pastel-pink') {
      return {
        backgroundColor: '#FFF1F6',
        borderColor: '#F9A8D4',
      };
    }
    if (themePreset === 'pastel-purple') {
      return {
        backgroundColor: '#F5F3FF',
        borderColor: '#C4B5FD',
      };
    }
    if (themePreset === 'pastel-blue') {
      return {
        backgroundColor: '#F0F9FF',
        borderColor: '#7DD3FC',
      };
    }
    return {
      backgroundColor: 'rgba(243, 244, 246, 0.9)',
      borderColor: 'rgba(229, 231, 235, 0.9)',
    };
  };

  const getInputTextColor = (): string => {
    if (data.inputTextColor) return data.inputTextColor;
    if (themePreset === 'soft-sage' || themePreset === 'yellow-green') return '#334155';
    if (themePreset === 'wine' || themePreset === 'soft-red') return '#FFF1F4';
    if (themePreset === 'peach-cream') return '#5F4A45';
    return isDarkCanvas ? '#FFFFFF' : '#1F2937';
  };

  return (
    <div
      ref={previewRef}
      id="preview-target"
      style={{
        fontFamily: '"SF UI Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        borderRadius: 'var(--preview-corner-radius, 0px)',
        ...getWallpaperStyle(),
      }}
      className={`w-[380px] min-w-[380px] max-w-[380px] shrink-0 ${getAspectClass()} mx-auto overflow-hidden shadow-2xl border-0 text-slate-900 relative select-none flex flex-col transition-all duration-200`}
    >
      {/* CHAT HEADER */}
      {showHeader && (
        <div
          style={getHeaderStyle()}
          className="px-3.5 py-3 flex items-center justify-between shrink-0 z-20 border-b border-black/5 shadow-2xs"
        >
          {/* Left: Back Arrow + Contact Name / Group Name */}
          <div className="flex items-center space-x-1.5 min-w-0">
            <button
              type="button"
              className="hover:opacity-80 transition-opacity p-1 -ml-0.5 mr-0.5 flex items-center justify-center cursor-pointer shrink-0"
              style={{ color: effectiveHeaderActionColor }}
            >
              <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="flex flex-col min-w-0 pl-1">
              <h2 className="text-[17px] font-bold tracking-tight leading-tight truncate" style={{ color: effectiveHeaderTextColor }}>
                {renderIosEmojis(contactName || 'Name')}
              </h2>
            </div>
          </div>

          {/* Right Action Icons: Search, Phone Call & Menu (from right to left: ☰ Menu -> 📞 Phone -> 🔍 Search) */}
          <div className="flex items-center space-x-4 pr-1.5 shrink-0" style={{ color: effectiveHeaderActionColor }}>
            {/* Search (Magnifying Glass) */}
            <button type="button" className="hover:opacity-75 transition-opacity cursor-pointer p-0.5" title="Search">
              <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Phone Call */}
            {showPhoneIcon !== false && (
              <button type="button" className="hover:opacity-75 transition-opacity cursor-pointer p-0.5" title="Call">
                <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>
            )}

            {/* Menu Icon (☰) with clean, well-spaced lines */}
            <button type="button" className="hover:opacity-75 transition-opacity cursor-pointer p-0.5" title="Menu">
              <svg className="w-5.5 h-5.5 stroke-current fill-none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="3.5" y1="5.5" x2="20.5" y2="5.5" />
                <line x1="3.5" y1="12" x2="20.5" y2="12" />
                <line x1="3.5" y1="18.5" x2="20.5" y2="18.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* MESSAGES FLOW AREA */}
      <div
        data-chat-scroll="true"
        className="flex-1 overflow-y-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 py-4 relative z-10 flex flex-col touch-pan-y"
      >
        {messages.map((msg, index) => {
          const isOutgoing = msg.sender === 'outgoing';
          const rawType = msg.type || (msg.stickerUrl ? 'sticker' : msg.imageUrl ? 'image' : 'text');
          const msgType = rawType;

          const isCallMsg =
            msgType === 'voice_call' ||
            msgType === 'video_call' ||
            msgType === 'missed_voice_call' ||
            msgType === 'missed_video_call';
          const isVideoCall = msgType === 'video_call' || msgType === 'missed_video_call';

          // Helper to check if string is an image link
          const isImageLink = (text?: string) => {
            if (!text) return false;
            const t = text.trim().toLowerCase();
            return (
              t.startsWith('http://') ||
              t.startsWith('https://') ||
              t.startsWith('data:image') ||
              t.startsWith('blob:') ||
              t.endsWith('.png') ||
              t.endsWith('.jpg') ||
              t.endsWith('.jpeg') ||
              t.endsWith('.webp') ||
              t.endsWith('.gif') ||
              t.includes('images.unsplash.com') ||
              t.includes('unsplash.com')
            );
          };

          const isImgMsg = msgType === 'image';
          const resolvedImgSrc = msg.imageUrl || (isImageLink(msg.text) ? msg.text : '');
          const hasValidCaption = Boolean(
            msg.text &&
            msg.text.trim() !== '' &&
            msg.text.trim() !== msg.imageUrl?.trim() &&
            !isImageLink(msg.text)
          );

          // Sequence checks for consecutive message grouping by sender and timestamp (same hour and minute)
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isPrevSameSender = Boolean(prevMsg && prevMsg.sender === msg.sender);

          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
          const isNextSameSender = Boolean(nextMsg && nextMsg.sender === msg.sender);

          const currentMsgTime = (msg.time || '').trim().replace(/:/g, '.');
          const prevMsgTime = prevMsg ? (prevMsg.time || '').trim().replace(/:/g, '.') : null;

          // Continuation in the exact same minute: same sender consecutive messages with identical hour and minute
          const isContinuationSameMinute = Boolean(
            isPrevSameSender &&
            currentMsgTime === prevMsgTime
          );

          // Ekor bubble chat and foto profil only show on the first message of that minute or if time differs
          const shouldShowTail = !isContinuationSameMinute;
          const shouldShowAvatar = !isContinuationSameMinute;

          const effectiveSameSenderGap = sameSenderGap !== undefined ? sameSenderGap : 14;
          const effectiveDiffSenderGap = differentSenderGap !== undefined ? differentSenderGap : 18;
          const marginTopVal =
            index === 0
              ? 0
              : isContinuationSameMinute
              ? (sameSenderGap !== undefined ? Math.max(3, Math.min(sameSenderGap, 6)) : 5)
              : isPrevSameSender
              ? effectiveSameSenderGap
              : effectiveDiffSenderGap;

          const R = bubbleRoundness || 18;
          const isPureImg = isImgMsg && !hasValidCaption && editingId !== (msg.id || String(index));

          // Uniform clean capsule border radius
          const borderRadiusStyles: React.CSSProperties = {
            borderRadius: `${R}px`,
          };

          return (
            <div
              key={msg.id || index}
              style={{ marginTop: index === 0 ? undefined : `${marginTopVal}px` }}
              className={`flex w-full ${isOutgoing ? 'justify-end' : 'justify-start'}`}
            >
              {/* INCOMING MESSAGE CONTAINER WITH AVATAR */}
              {!isOutgoing && (
                <div className="flex items-start gap-3 max-w-[85%]">
                  {/* Profile Picture Avatar or alignment spacer */}
                  {shouldShowAvatar ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 shadow-xs mt-0.5 select-none">
                      <img
                        src={(msg.senderAvatar && msg.senderAvatar.trim() !== '') ? msg.senderAvatar : ((contactAvatar && contactAvatar.trim() !== '') ? contactAvatar : DEFAULT_AVATAR)}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    /* Spacer matching avatar size so chat bubbles remain aligned */
                    <div className="w-8 shrink-0 select-none pointer-events-none" />
                  )}

                  <div className="flex flex-col items-start min-w-0">
                    {/* Sender Name if group chat or first message */}
                    {!isPrevSameSender && (isGroupChat || msg.senderName) && (
                      <span className="text-[11px] font-semibold text-slate-800/90 mb-1 pl-0.5">
                        {renderIosEmojis(msg.senderName || contactName)}
                      </span>
                    )}

                    <div className="flex items-end space-x-1.5">
                      {/* BUBBLE OR STICKER OR CALL BOX */}
                      {msg.isRecalled || msgType === 'recalled' ? (
                        <div
                          style={{
                            backgroundColor: msg.bubbleColorOverride || activeReceiverBg,
                            color: msg.textColorOverride || activeReceiverText,
                            ...borderRadiusStyles,
                          }}
                          className="relative px-3.5 py-2 shadow-2xs max-w-[260px] break-words text-[13px] leading-snug font-sans italic opacity-75 flex items-center gap-1.5 select-none"
                        >
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                          </svg>
                          <span>{renderIosEmojis(msg.text || (isId ? 'Pesan telah dibatalkan' : 'Unsent a message'))}</span>
                        </div>
                      ) : msgType === 'sticker' ? (
                        /* Strict 1:1 ratio sticker without background bubble */
                        (() => {
                          const stickerSrc = (msg.stickerUrl || msg.imageUrl || msg.text || '').trim();
                          return stickerSrc ? (
                            <div className="p-0 select-none">
                              <img
                                src={stickerSrc}
                                alt="LINE Sticker"
                                className="w-28 h-28 aspect-square object-contain drop-shadow-xs select-none pointer-events-none"
                              />
                            </div>
                          ) : null;
                        })()
                      ) : isCallMsg ? (
                        /* SQUARISH CALL BUBBLE (VOICE / VIDEO) */
                        <div
                          style={{
                            backgroundColor: msg.bubbleColorOverride || activeReceiverBg,
                            color: msg.textColorOverride || activeReceiverText,
                            ...borderRadiusStyles,
                          }}
                          className="relative w-[96px] h-[96px] p-2.5 flex flex-col items-center justify-center text-center shadow-2xs break-words shrink-0"
                        >
                          {/* Consistent Tail for incoming call message */}
                          {shouldShowTail && (
                            <svg
                              className="absolute -left-[11px] top-[1px] w-[20px] h-[18px] pointer-events-none z-10"
                              viewBox="0 0 20 18"
                              fill="none"
                            >
                              <path
                                d="M 20 4.5 C 14 4.5, 8 3.2, 0.8 1 C 1.2 5.5, 6 12, 20 15 Z"
                                fill={msg.bubbleColorOverride || activeReceiverBg}
                              />
                            </svg>
                          )}

                          {/* Big Phone / Video Icon */}
                          <div className="mb-1.5 shrink-0 flex items-center justify-center">
                            {isVideoCall ? (
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 fill-current transform -rotate-12" viewBox="0 0 24 24">
                                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                              </svg>
                            )}
                          </div>

                          {/* Call Status Text */}
                          {editingId === (msg.id || String(index)) ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={() => handleSaveEditing(msg.id || String(index))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEditing(msg.id || String(index));
                                }
                              }}
                              className="w-full text-center bg-transparent border-b border-dashed border-current text-[11px] font-semibold focus:outline-none p-0"
                            />
                          ) : (
                            <span
                              onClick={() => handleStartEditing(msg.id || String(index), msg.text || (msgType === 'missed_voice_call' || msgType === 'voice_call' ? 'Missed Call' : msgType === 'missed_video_call' ? 'Missed Video Call' : isVideoCall ? 'Video Call' : 'Missed Call'))}
                              className="text-[11.5px] font-semibold leading-tight line-clamp-2 cursor-pointer hover:opacity-85 select-none"
                              title="Click to inline edit call status"
                            >
                              {renderIosEmojis(msg.text || (msgType === 'missed_voice_call' || msgType === 'voice_call' ? 'Missed Call' : msgType === 'missed_video_call' ? 'Missed Video Call' : isVideoCall ? 'Video Call' : 'Missed Call'))}
                            </span>
                          )}
                        </div>
                      ) : isImgMsg ? (
                        /* INCOMING IMAGE MESSAGE: Photo card + Optional separate caption bubble below without tail */
                        <div className="flex flex-col items-start gap-1.5 max-w-[260px]">
                          {/* Photo Card */}
                          {resolvedImgSrc && resolvedImgSrc.trim() !== '' ? (
                            <div
                              style={borderRadiusStyles}
                              className={`overflow-hidden max-w-[260px] shadow-2xs ${!hasValidCaption && editingId !== (msg.id || String(index)) ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (!hasValidCaption && editingId !== (msg.id || String(index))) {
                                  handleStartEditing(msg.id || String(index), '');
                                }
                              }}
                              title={!hasValidCaption ? "Click to add caption" : undefined}
                            >
                              <img
                                src={resolvedImgSrc.trim()}
                                alt="attachment"
                                className="w-full max-h-64 object-cover block select-none"
                              />
                            </div>
                          ) : null}

                          {/* Separate Caption Bubble - NO tail, neat standalone box below photo */}
                          {(hasValidCaption || editingId === (msg.id || String(index))) && (
                            <div
                              style={{
                                backgroundColor: msg.bubbleColorOverride || activeReceiverBg,
                                color: msg.textColorOverride || activeReceiverText,
                                ...borderRadiusStyles,
                              }}
                              className="px-3.5 py-2 shadow-2xs w-fit max-w-[260px] break-words text-[14.5px] leading-snug font-sans relative"
                            >
                              {/* Strictly NO tail SVG */}
                              {editingId === (msg.id || String(index)) ? (
                                <textarea
                                  autoFocus
                                  rows={1}
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onBlur={() => handleSaveEditing(msg.id || String(index))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSaveEditing(msg.id || String(index));
                                    }
                                  }}
                                  placeholder="Add caption..."
                                  className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none text-[14.5px] p-0 resize-none"
                                />
                              ) : (
                                <span
                                  onClick={() => handleStartEditing(msg.id || String(index), msg.text || '')}
                                  className="cursor-pointer hover:opacity-90 transition-opacity block leading-snug"
                                  title="Click to inline edit caption"
                                >
                                  {renderIosEmojis(msg.text || '')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* STANDARD INCOMING TEXT MESSAGE WITH TAIL */
                        <div
                          style={{
                            backgroundColor: msg.bubbleColorOverride || activeReceiverBg,
                            color: msg.textColorOverride || activeReceiverText,
                            ...borderRadiusStyles,
                          }}
                          className="relative px-3.5 py-2 shadow-2xs max-w-[260px] break-words text-[14.5px] leading-snug font-sans"
                        >
                          {/* Consistent Tail for incoming text message */}
                          {shouldShowTail && (
                            <svg
                              className="absolute -left-[11px] top-[1px] w-[20px] h-[18px] pointer-events-none z-10"
                              viewBox="0 0 20 18"
                              fill="none"
                            >
                              <path
                                d="M 20 4.5 C 14 4.5, 8 3.2, 0.8 1 C 1.2 5.5, 6 12, 20 15 Z"
                                fill={msg.bubbleColorOverride || activeReceiverBg}
                              />
                            </svg>
                          )}

                          {/* Text */}
                          {editingId === (msg.id || String(index)) ? (
                            <textarea
                              autoFocus
                              rows={1}
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={() => handleSaveEditing(msg.id || String(index))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEditing(msg.id || String(index));
                                }
                              }}
                              placeholder="Type text..."
                              className="w-full bg-transparent border-b border-dashed border-slate-400 focus:outline-none text-[14.5px] p-0 resize-none"
                            />
                          ) : (
                            <span
                              onClick={() => handleStartEditing(msg.id || String(index), msg.text || '')}
                              className="cursor-pointer hover:opacity-90 transition-opacity block leading-snug"
                              title="Click to inline edit text"
                            >
                              {renderIosEmojis(msg.text || 'Hey there! 😊')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Incoming Timestamp (Right side of bubble) */}
                      <span
                        style={{ color: effectiveTimestampColor }}
                        className="text-[10px] font-normal shrink-0 mb-0.5 select-none"
                      >
                        {formatLineTimestamp(msg.time) || '16.34'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* OUTGOING MESSAGE CONTAINER (RIGHT ALIGNED) */}
              {isOutgoing && (
                <div className="flex items-end justify-end space-x-1.5 max-w-[82%]">
                  {/* Outgoing Read Status & Timestamp (LEFT side of green bubble) */}
                  <div className="flex flex-col items-end shrink-0 mb-0.5 text-right select-none">
                    {showReadStatus && msg.isRead !== false && (
                      <span
                        style={{ color: effectiveReadStatusColor }}
                        className="text-[10px] font-normal leading-tight"
                      >
                        {renderIosEmojis(msg.readText || readTextLabel || 'read')}
                      </span>
                    )}
                    <span
                      style={{ color: effectiveTimestampColor }}
                      className="text-[10px] font-normal leading-tight"
                    >
                      {formatLineTimestamp(msg.time) || '16.34'}
                    </span>
                  </div>

                  {/* BUBBLE OR STICKER OR CALL BOX */}
                  {msg.isRecalled || msgType === 'recalled' ? (
                    <div
                      style={{
                        backgroundColor: msg.bubbleColorOverride || activeSenderBg,
                        color: msg.textColorOverride || activeSenderText,
                        ...borderRadiusStyles,
                      }}
                      className="relative px-3.5 py-2 shadow-2xs max-w-[260px] break-words text-[13px] leading-snug font-sans italic opacity-75 flex items-center gap-1.5 select-none"
                    >
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      <span>{renderIosEmojis(msg.text || (isId ? 'Anda membatalkan pengiriman pesan' : 'You unsent a message'))}</span>
                    </div>
                  ) : msgType === 'sticker' ? (
                    /* Strict 1:1 ratio sticker without background bubble */
                    (() => {
                      const stickerSrc = (msg.stickerUrl || msg.imageUrl || msg.text || '').trim();
                      return stickerSrc ? (
                        <div className="p-0 select-none">
                          <img
                            src={stickerSrc}
                            alt="LINE Sticker"
                            className="w-28 h-28 aspect-square object-contain drop-shadow-xs select-none pointer-events-none"
                          />
                        </div>
                      ) : null;
                    })()
                  ) : isCallMsg ? (
                    /* SQUARISH OUTGOING CALL BUBBLE (VOICE / VIDEO) */
                    <div
                      style={{
                        backgroundColor: msg.bubbleColorOverride || activeSenderBg,
                        color: msg.textColorOverride || activeSenderText,
                        ...borderRadiusStyles,
                      }}
                      className="relative w-[96px] h-[96px] p-2.5 flex flex-col items-center justify-center text-center shadow-2xs break-words shrink-0"
                    >
                      {/* Consistent Tail for outgoing call message */}
                      {shouldShowTail && (
                        <svg
                          className="absolute -right-[11px] top-[1px] w-[20px] h-[18px] pointer-events-none z-10"
                          viewBox="0 0 20 18"
                          fill="none"
                        >
                          <path
                            d="M 0 4.5 C 6 4.5, 12 3.2, 19.2 1 C 18.8 5.5, 14 12, 0 15 Z"
                            fill={msg.bubbleColorOverride || activeSenderBg}
                          />
                        </svg>
                      )}

                      {/* Big Phone / Video Icon */}
                      <div className="mb-1.5 shrink-0 flex items-center justify-center">
                        {isVideoCall ? (
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 fill-current transform -rotate-12" viewBox="0 0 24 24">
                            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                          </svg>
                        )}
                      </div>

                      {/* Call Status Text */}
                      {editingId === (msg.id || String(index)) ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleSaveEditing(msg.id || String(index))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditing(msg.id || String(index));
                            }
                          }}
                          className="w-full text-center bg-transparent border-b border-dashed border-current text-[11px] font-semibold focus:outline-none p-0"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartEditing(msg.id || String(index), msg.text || (msgType === 'missed_voice_call' || msgType === 'voice_call' ? 'Missed Call' : msgType === 'missed_video_call' ? 'Missed Video Call' : isVideoCall ? 'Video Call' : 'Missed Call'))}
                          className="text-[11.5px] font-semibold leading-tight line-clamp-2 cursor-pointer hover:opacity-85 select-none"
                          title="Click to inline edit call status"
                        >
                          {renderIosEmojis(msg.text || (msgType === 'missed_voice_call' || msgType === 'voice_call' ? 'Missed Call' : msgType === 'missed_video_call' ? 'Missed Video Call' : isVideoCall ? 'Video Call' : 'Missed Call'))}
                        </span>
                      )}
                    </div>
                  ) : isImgMsg ? (
                    /* OUTGOING IMAGE MESSAGE: Photo card + Optional separate caption bubble below without tail */
                    <div className="flex flex-col items-end gap-1.5 max-w-[260px]">
                      {/* Photo Card */}
                      {resolvedImgSrc && resolvedImgSrc.trim() !== '' ? (
                        <div
                          style={borderRadiusStyles}
                          className={`overflow-hidden max-w-[260px] shadow-2xs ${!hasValidCaption && editingId !== (msg.id || String(index)) ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (!hasValidCaption && editingId !== (msg.id || String(index))) {
                              handleStartEditing(msg.id || String(index), '');
                            }
                          }}
                          title={!hasValidCaption ? "Click to add caption" : undefined}
                        >
                          <img
                            src={resolvedImgSrc.trim()}
                            alt="attachment"
                            className="w-full max-h-64 object-cover block select-none"
                          />
                        </div>
                      ) : null}

                      {/* Separate Caption Bubble - NO tail, neat standalone box below photo */}
                      {(hasValidCaption || editingId === (msg.id || String(index))) && (
                        <div
                          style={{
                            backgroundColor: msg.bubbleColorOverride || activeSenderBg,
                            color: msg.textColorOverride || activeSenderText,
                            ...borderRadiusStyles,
                          }}
                          className="px-3.5 py-2 shadow-2xs w-fit max-w-[260px] break-words text-[14.5px] leading-snug font-sans relative text-left"
                        >
                          {/* Strictly NO tail SVG */}
                          {editingId === (msg.id || String(index)) ? (
                            <textarea
                              autoFocus
                              rows={1}
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={() => handleSaveEditing(msg.id || String(index))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEditing(msg.id || String(index));
                                }
                              }}
                              placeholder="Add caption..."
                              className="w-full bg-transparent border-b border-dashed border-slate-900 focus:outline-none text-[14.5px] p-0 resize-none text-black"
                            />
                          ) : (
                            <span
                              onClick={() => handleStartEditing(msg.id || String(index), msg.text || '')}
                              className="cursor-pointer hover:opacity-90 transition-opacity block leading-snug"
                              title="Click to inline edit caption"
                            >
                              {renderIosEmojis(msg.text || '')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* STANDARD OUTGOING TEXT MESSAGE WITH TAIL */
                    <div
                      style={{
                        backgroundColor: msg.bubbleColorOverride || activeSenderBg,
                        color: msg.textColorOverride || activeSenderText,
                        ...borderRadiusStyles,
                      }}
                      className="relative px-3.5 py-2 shadow-2xs max-w-[260px] break-words text-[14.5px] leading-snug font-sans"
                    >
                      {/* Consistent Tail for outgoing message */}
                      {shouldShowTail && (
                        <svg
                          className="absolute -right-[11px] top-[1px] w-[20px] h-[18px] pointer-events-none z-10"
                          viewBox="0 0 20 18"
                          fill="none"
                        >
                          <path
                            d="M 0 4.5 C 6 4.5, 12 3.2, 19.2 1 C 18.8 5.5, 14 12, 0 15 Z"
                            fill={msg.bubbleColorOverride || activeSenderBg}
                          />
                        </svg>
                      )}

                      {/* Text */}
                      {editingId === (msg.id || String(index)) ? (
                        <textarea
                          autoFocus
                          rows={1}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleSaveEditing(msg.id || String(index))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEditing(msg.id || String(index));
                            }
                          }}
                          placeholder="Type text..."
                          className="w-full bg-transparent border-b border-dashed border-slate-900 focus:outline-none text-[14.5px] p-0 resize-none text-black"
                        />
                      ) : (
                        <span
                          onClick={() => handleStartEditing(msg.id || String(index), msg.text || '')}
                          className="cursor-pointer hover:opacity-90 transition-opacity block leading-snug"
                          title="Click to inline edit text"
                        >
                          {renderIosEmojis(msg.text || 'Free to catch up now?')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* BOTTOM INPUT BAR */}
      {showInputBar && (
        <div className="px-2.5 py-2 z-20 shrink-0 backdrop-blur-md border-0" style={getOuterInputBarStyle()}>
          <div className="flex items-center space-x-2">
            {/* Plus (+) Button */}
            <button
              type="button"
              className="hover:opacity-80 transition-opacity shrink-0 cursor-pointer p-0.5 flex items-center justify-center"
              style={{ color: unifiedBottomIconColor }}
              title="Add attachment"
            >
              <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="4" y1="12" x2="20" y2="12" />
              </svg>
            </button>

            {/* Camera Icon */}
            <button
              type="button"
              className="hover:opacity-75 transition-opacity shrink-0 cursor-pointer p-0.5"
              style={{ color: unifiedBottomIconColor }}
              title="Camera"
            >
              <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            {/* Gallery Icon */}
            <button
              type="button"
              className="hover:opacity-75 transition-opacity shrink-0 cursor-pointer p-0.5"
              style={{ color: unifiedBottomIconColor }}
              title="Gallery"
            >
              <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
                <path d="M3 19l5-8.5 4.5 5.5 3.5-4 5 7" />
              </svg>
            </button>

            {/* Text Input Pill Container (Harmonized with Active Theme) */}
            <div
              className={`flex-1 min-w-0 border rounded-full px-3.5 py-1.5 flex items-center space-x-2 backdrop-blur-xs transition-colors ${
                themePreset === 'pastel-pink' ||
                themePreset === 'soft-sage' ||
                themePreset === 'yellow-green' ||
                themePreset === 'pastel-purple' ||
                themePreset === 'wine' ||
                themePreset === 'soft-red' ||
                themePreset === 'peach-cream' ||
                themePreset === 'pastel-blue'
                  ? 'shadow-none'
                  : 'shadow-2xs'
              }`}
              style={getInputBoxStyle()}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  if (onChange) onChange({ ...data, inputText: e.target.value });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (inputText || '').trim()) {
                    e.preventDefault();
                    if (onChange) {
                      const newMsg: LineChatMessage = {
                        id: 'line-msg-' + Date.now(),
                        sender: 'outgoing',
                        type: 'text',
                        text: inputText.trim(),
                        time: getLineCurrentTime(),
                        isRead: true,
                        readText: readTextLabel || 'read',
                      };
                      onChange({
                        ...data,
                        messages: [...messages, newMsg],
                        inputText: '',
                      });
                    }
                  }
                }}
                placeholder={inputPlaceholder || 'Message'}
                style={{ color: getInputTextColor() }}
                className={`w-full bg-transparent border-none outline-none text-[14px] ${
                  themePreset === 'wine' || themePreset === 'soft-red'
                    ? 'placeholder:text-[#FFF1F4]/50'
                    : themePreset === 'peach-cream'
                    ? 'placeholder:text-[#5F4A45]/50'
                    : themePreset === 'soft-sage' || themePreset === 'yellow-green'
                    ? 'placeholder:text-[#334155]/50'
                    : isDarkCanvas
                    ? 'placeholder:text-white/40'
                    : 'placeholder:text-slate-400'
                } p-0 font-medium`}
              />

              {/* Emoji / Sticker Icon inside input bar */}
              <button
                type="button"
                className="hover:opacity-80 transition-colors shrink-0 cursor-pointer"
                style={{ color: unifiedBottomIconColor }}
                title="Sticker / Emoji"
              >
                <svg className="w-5 h-5 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
                </svg>
              </button>
            </div>

            {/* Microphone Icon or Send Button */}
            {(inputText || '').trim() ? (
              <button
                type="button"
                onClick={() => {
                  if (onChange && (inputText || '').trim()) {
                    const newMsg: LineChatMessage = {
                      id: 'line-msg-' + Date.now(),
                      sender: 'outgoing',
                      type: 'text',
                      text: inputText.trim(),
                      time: getLineCurrentTime(),
                      isRead: true,
                      readText: readTextLabel || 'read',
                    };
                    onChange({
                      ...data,
                      messages: [...messages, newMsg],
                      inputText: '',
                    });
                  }
                }}
                style={{ backgroundColor: unifiedBottomIconColor }}
                className="w-7 h-7 rounded-full text-white flex items-center justify-center transition-transform shrink-0 cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                title="Send"
              >
                <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="hover:opacity-75 transition-opacity shrink-0 cursor-pointer p-0.5"
                style={{ color: unifiedBottomIconColor }}
                title="Microphone"
              >
                <svg className="w-6 h-6 stroke-current fill-none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="9" y="2" width="6" height="11" rx="3" ry="3" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
