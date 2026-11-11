import React, { useState } from 'react';
import { WhatsAppChatData, WhatsAppChatMessage } from '../../../../types';
import { INITIAL_WHATSAPP_CHAT_DATA } from '../../../../data/defaultTemplates';
import { useLanguage } from '../../../../context/LanguageContext';
import { isSameWhatsAppSender, resolveWhatsAppGroupSenders } from '../../messageSenders';
import {
  formatWhatsAppBubbleText,
  formatWhatsAppLeftBubbleText,
  formatWhatsAppTime,
  renderIosEmojis,
  splitWhatsAppGraphemes,
  getBubbleStyle,
  getHarmoniousUnreadDividerColors,
  getHarmoniousSystemNoticeColors,
  isHexDark,
} from './preview/whatsAppPreviewHelpers';
import { WhatsAppChatHeader } from './preview/WhatsAppChatHeader';
import { WhatsAppChatInputBar } from './preview/WhatsAppChatInputBar';
import { WhatsAppChatMessageBubble } from './preview/WhatsAppChatMessageBubble';

export {
  formatWhatsAppBubbleText,
  formatWhatsAppLeftBubbleText,
  formatWhatsAppTime,
  renderIosEmojis,
  splitWhatsAppGraphemes,
};

interface Props {
  data: WhatsAppChatData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMessageText?: (id: string, newText: string) => void;
  onChange?: (updated: WhatsAppChatData) => void;
}

export const WhatsAppChatPreview: React.FC<Props> = ({
  data: rawData,
  previewRef,
  onUpdateMessageText,
  onChange,
}) => {
  const { language } = useLanguage();
  const data = rawData || INITIAL_WHATSAPP_CHAT_DATA;

  const {
    showHeader = true,
    showInputBar = true,
    showUnreadDivider = false,
    unreadDividerText = '',
    unreadDividerStyle = 'banner',
    aspectRatio = '4:5',
    theme = 'light',
    sameSenderGap = 0,
    differentSenderGap = 6,
    dateDividerGap = 12,
    unreadDividerGap = 8,
    unreadDividerPadding = 3.5,
    bubbleRoundness = 12,
    showBubbleTail = true,
    useCustomColors = false,
    barBgColor,
    headerBgColor,
    headerTextColor,
    inputBgColor,
    cameraBgColor,
    chatBgColor,
    senderBubbleColor,
    receiverBubbleColor,
    mainTextColor,
    secondaryTextColor,
    iconColor,
    messages = [],
    isGroupChat = false,
  } = data;

  const isDark = theme === 'dark';
  const isEffectiveDark = useCustomColors
    ? isHexDark(chatBgColor || headerBgColor || barBgColor)
    : isDark;
  const isAndroid = false;

  const bubbleWidthPercent = Math.min(94, Math.max(50, data.bubbleWidthPercent ?? 94));
  const messageFontSize = Math.min(18, Math.max(11, data.messageFontSize ?? 15));

  const defaultThemeChatBg = isDark ? '#121b22' : '#efeae2';
  const activeChatBg = useCustomColors && chatBgColor?.trim() ? chatBgColor : defaultThemeChatBg;

  const activeBarBg = useCustomColors
    ? (inputBgColor || barBgColor || (isAndroid ? (isDark ? '#1f2c34' : '#ffffff') : '#075E54'))
    : undefined;

  const effectiveHeaderBg = useCustomColors
    ? (headerBgColor || barBgColor || '#075E54')
    : (isAndroid ? (isDark ? '#1f2c34' : '#008069') : (isDark ? '#1c1c1e' : '#F6F6F6'));

  const effectiveHeaderTextColor = useCustomColors
    ? (headerTextColor || mainTextColor || '#ffffff')
    : (isAndroid ? '#ffffff' : (isDark ? '#ffffff' : '#000000'));

  const effectiveHeaderIconColor = useCustomColors
    ? (iconColor || '#00a884')
    : (isAndroid ? '#ffffff' : '#007AFF');

  const effectiveHeaderSecText = useCustomColors
    ? (secondaryTextColor || '#8696a0')
    : (isAndroid ? 'rgba(255, 255, 255, 0.82)' : '#8e8e93');

  const effectiveSenderBg = useCustomColors
    ? (senderBubbleColor || '#005C4B')
    : (isDark ? '#005C4B' : '#E2FFC7');

  const effectiveReceiverBg = useCustomColors
    ? (receiverBubbleColor || '#202c33')
    : (isDark ? '#262628' : '#ffffff');

  const isSenderBubbleDark = isHexDark(effectiveSenderBg);
  const isReceiverBubbleDark = isHexDark(effectiveReceiverBg);

  const getHarmoniousMissedCallCircleBg = (isMsgOutgoing: boolean) => {
    if (useCustomColors && data?.missedCallCircleBg) return data.missedCallCircleBg;
    const parentBg = isMsgOutgoing ? effectiveSenderBg : effectiveReceiverBg;
    return isHexDark(parentBg)
      ? `color-mix(in srgb, ${parentBg || '#005C4B'} 78%, white 22%)`
      : `color-mix(in srgb, ${parentBg || '#ffffff'} 88%, black 12%)`;
  };

  const getHarmoniousReplyBarColor = (msg: WhatsAppChatMessage, isMsgOutgoing: boolean) => {
    if (msg.replyBarColor?.trim()) return msg.replyBarColor;
    if (isMsgOutgoing) {
      return isSenderBubbleDark ? (iconColor || 'rgba(255, 255, 255, 0.65)') : (iconColor || cameraBgColor || '#008069');
    }
    return isReceiverBubbleDark
      ? (iconColor || cameraBgColor || 'rgba(37, 211, 102, 0.85)')
      : (iconColor || cameraBgColor || (useCustomColors && secondaryTextColor ? secondaryTextColor : '#008069'));
  };

  const getHarmoniousReplySenderColor = (msg: WhatsAppChatMessage, isMsgOutgoing: boolean) => {
    if (msg.replySenderColor?.trim()) return msg.replySenderColor;
    if (isMsgOutgoing) {
      return isSenderBubbleDark ? '#FFFFFF' : (iconColor || cameraBgColor || '#008069');
    }
    return isReceiverBubbleDark
      ? (iconColor || cameraBgColor || '#25D366')
      : (iconColor || cameraBgColor || '#008069');
  };

  const getMessageTimestampColor = (isMsgOutgoing: boolean) => {
    if (useCustomColors && data?.timestampColor) return data.timestampColor;
    if (isMsgOutgoing) {
      return isSenderBubbleDark ? 'rgba(255, 255, 255, 0.78)' : 'rgba(0, 0, 0, 0.52)';
    }
    if (useCustomColors && secondaryTextColor) return secondaryTextColor;
    return isReceiverBubbleDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)';
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  const handleStartEditing = (msgId: string, currentText: string) => {
    setEditingId(msgId);
    setEditingText(currentText || '');
  };

  const handleSaveEditing = (msgId: string) => {
    if (msgId === 'auto-unread-divider') {
      if (onChange) onChange({ ...data, unreadDividerText: editingText });
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
      if (insertIndex === -1) insertIndex = displayMessages.length - 1;
      displayMessages.splice(insertIndex, 0, autoDivider);
    }
  }

  if (isGroupChat) {
    displayMessages = resolveWhatsAppGroupSenders(displayMessages);
  }

  const placeholderColor = useCustomColors
    ? (isEffectiveDark ? (secondaryTextColor || 'rgba(255, 255, 255, 0.4)') : (secondaryTextColor || 'rgba(0, 0, 0, 0.45)'))
    : (isDark ? '#8696A0' : 'rgba(0, 0, 0, 0.45)');

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

      {showHeader && (
        <WhatsAppChatHeader
          data={data}
          effectiveHeaderBg={effectiveHeaderBg}
          effectiveHeaderTextColor={effectiveHeaderTextColor}
          effectiveHeaderIconColor={effectiveHeaderIconColor}
          effectiveHeaderSecText={effectiveHeaderSecText}
          isAndroid={isAndroid}
          language={language}
        />
      )}

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
        {data.chatWallpaper && (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
            <img
              src={data.chatWallpaper}
              alt="Chat Wallpaper"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
        )}

        <div
          data-chat-scroll="true"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar px-[8px] pt-2.5 pb-2 z-10 touch-pan-y"
        >
          <div className="relative z-10 flex flex-col min-h-full justify-start">
            {displayMessages.map((msg, index) => {
              const isOutgoing = msg.sender === 'outgoing' || msg.sender === 'me';
              const msgType = msg.type || (msg.stickerUrl ? 'sticker' : msg.imageUrl ? 'image' : 'text');

              if (msgType === 'date_divider' || msgType === 'divider') {
                const currentGap = msg.dateDividerGap ?? dateDividerGap ?? 12;
                return (
                  <div
                    key={msg.id || index}
                    style={{ marginTop: `${currentGap}px`, marginBottom: `${currentGap}px` }}
                    className="flex justify-center items-center relative z-10 select-none w-full text-center shrink-0"
                  >
                    <span
                      style={{
                        backgroundColor: useCustomColors
                          ? (isEffectiveDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)')
                          : (isDark ? '#182229' : '#ffffff'),
                        color: useCustomColors
                          ? (secondaryTextColor || (isEffectiveDark ? '#ffffff' : '#54656f'))
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

              if (msgType === 'unread_divider') {
                const isBanner = (msg.unreadDividerStyle || unreadDividerStyle || 'banner') === 'banner';
                const dividerText = msg.text || unreadDividerText || (language === 'id' ? '1 PESAN BELUM DIBACA' : '1 UNREAD MESSAGE');
                const dividerColors = getHarmoniousUnreadDividerColors(
                  msg,
                  data,
                  isEffectiveDark,
                  isDark,
                  useCustomColors,
                  mainTextColor,
                  headerTextColor
                );
                const effectiveGap = typeof msg.unreadDividerGap === 'number'
                  ? msg.unreadDividerGap
                  : (typeof unreadDividerGap === 'number' ? unreadDividerGap : 14);
                const effectivePadding = typeof msg.unreadDividerPadding === 'number'
                  ? msg.unreadDividerPadding
                  : (typeof unreadDividerPadding === 'number' ? unreadDividerPadding : 4.5);

                return (
                  <div
                    key={msg.id || index}
                    style={{ marginTop: `${effectiveGap}px`, marginBottom: `${effectiveGap}px` }}
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

              if (msgType === 'system') {
                const systemText = msg.text || 'You blocked this contact.';
                const effectiveGap = typeof msg.systemGap === 'number' ? msg.systemGap : 12;
                const systemColors = getHarmoniousSystemNoticeColors(
                  msg,
                  data,
                  isEffectiveDark,
                  isDark,
                  useCustomColors,
                  mainTextColor
                );

                return (
                  <div
                    key={msg.id || index}
                    style={{ marginTop: `${effectiveGap}px`, marginBottom: `${effectiveGap}px` }}
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

              const prevMsg = index > 0 ? displayMessages[index - 1] : null;
              const isPrevDivider = prevMsg?.type === 'unread_divider' || prevMsg?.type === 'date_divider' || prevMsg?.type === 'divider' || prevMsg?.type === 'system';
              const isPrevSameSender = Boolean(
                prevMsg &&
                isSameWhatsAppSender(prevMsg, msg) &&
                !isPrevDivider
              );

              const nextMsg = index < displayMessages.length - 1 ? displayMessages[index + 1] : null;
              const nextMsgType = nextMsg ? (nextMsg.type || (nextMsg.stickerUrl ? 'sticker' : nextMsg.imageUrl ? 'image' : 'text')) : null;
              const isNextSameSender = Boolean(
                nextMsg &&
                isSameWhatsAppSender(nextMsg, msg) &&
                nextMsgType !== 'sticker' &&
                nextMsgType !== 'date_divider' &&
                nextMsgType !== 'divider' &&
                nextMsgType !== 'unread_divider' &&
                nextMsgType !== 'system'
              );

              const isLastInGroup = !isNextSameSender;
              const showSenderName = Boolean((isGroupChat || msg.senderName) && !isOutgoing && (msg.showSenderName ?? !isPrevSameSender));
              const photoWidth = Math.min(260, Math.max(120, msg.photoWidth ?? 260));
              const showTail = (showBubbleTail !== false) && isLastInGroup && msgType !== 'sticker';

              // Jarak/Gap antar bubble chat (bisa diatur di data form atau default di sini)
              const effectiveSameSenderGap = Math.max(2, Math.min(sameSenderGap + 2, 6));
              const effectiveDifferentSenderGap = Math.max(0, Math.min(differentSenderGap, 12));
              const marginTopVal = (index === 0 || isPrevDivider)
                ? 0
                : isPrevSameSender
                  ? effectiveSameSenderGap
                  : effectiveDifferentSenderGap;

              const bubbleStyles = getBubbleStyle({
                isOutgoing,
                showTail,
                bubbleRoundness,
                useCustomColors,
                senderBubbleColor,
                receiverBubbleColor,
                mainTextColor,
                isDark,
              });

              return (
                <div
                  key={msg.id || index}
                  style={{ marginTop: index === 0 ? undefined : `${marginTopVal}px` }}
                  className={`flex w-full ${isOutgoing ? 'justify-end pr-2' : 'justify-start pl-2'}`}
                >
                  <WhatsAppChatMessageBubble
                    msg={msg}
                    index={index}
                    data={data}
                    isOutgoing={isOutgoing}
                    msgType={msgType}
                    showTail={showTail}
                    bubbleStyles={bubbleStyles}
                    isDark={isDark}
                    isSenderBubbleDark={isSenderBubbleDark}
                    isReceiverBubbleDark={isReceiverBubbleDark}
                    showSenderName={showSenderName}
                    photoWidth={photoWidth}
                    bubbleWidthPercent={bubbleWidthPercent}
                    messageFontSize={messageFontSize}
                    useCustomColors={useCustomColors}
                    mainTextColor={mainTextColor}
                    language={language}
                    editingId={editingId}
                    editingText={editingText}
                    handleStartEditing={handleStartEditing}
                    handleSaveEditing={handleSaveEditing}
                    setEditingText={setEditingText}
                    setEditingId={setEditingId}
                    getHarmoniousMissedCallCircleBg={getHarmoniousMissedCallCircleBg}
                    getHarmoniousReplyBarColor={getHarmoniousReplyBarColor}
                    getHarmoniousReplySenderColor={getHarmoniousReplySenderColor}
                    getMessageTimestampColor={getMessageTimestampColor}
                    onChange={onChange}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showInputBar && (
        <WhatsAppChatInputBar
          data={data}
          activeBarBg={activeBarBg}
          activeMainText={mainTextColor}
          activeIconColor={iconColor}
          inputBarIconColor={useCustomColors ? (iconColor || '#007AFF') : '#007AFF'}
          useCustomColors={useCustomColors}
          isAndroid={isAndroid}
          isDark={isDark}
          language={language}
          onChange={onChange}
        />
      )}
    </div>
  );
};
