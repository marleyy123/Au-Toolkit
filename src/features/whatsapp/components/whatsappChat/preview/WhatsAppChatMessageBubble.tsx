import React from 'react';
import { WhatsAppChatMessage, WhatsAppChatData } from '../../../../../types';
import { DEFAULT_AVATAR } from '../../../../../data/defaultTemplates';
import { hasWhatsAppReplyQuote } from '../../../replyQuote';
import { WhatsAppContactCard } from '../WhatsAppContactCard';
import { WhatsAppVoiceNote } from '../WhatsAppVoiceNote';
import { WhatsAppStatusReplyQuote } from '../WhatsAppStatusReplyQuote';
import {
  formatWhatsAppTime,
  renderTicks,
  renderIosEmojis,
  analyzeWhatsAppBubbleText,
  WhatsAppInlineMetaSpacer,
} from './whatsAppPreviewHelpers';

interface Props {
  msg: WhatsAppChatMessage;
  index: number;
  data: WhatsAppChatData;
  isOutgoing: boolean;
  msgType: string;
  showTail: boolean;
  bubbleStyles: React.CSSProperties;
  isDark: boolean;
  isSenderBubbleDark: boolean;
  isReceiverBubbleDark: boolean;
  showSenderName: boolean;
  photoWidth: number;
  bubbleWidthPercent: number;
  messageFontSize: number;
  useCustomColors: boolean;
  mainTextColor?: string;
  language: string;
  editingId: string | null;
  editingText: string;
  handleStartEditing: (id: string, text: string) => void;
  handleSaveEditing: (id: string) => void;
  setEditingText: (text: string) => void;
  setEditingId: (id: string | null) => void;
  getHarmoniousMissedCallCircleBg: (isMsgOutgoing: boolean) => string;
  getHarmoniousReplyBarColor: (msg: WhatsAppChatMessage, isMsgOutgoing: boolean) => string;
  getHarmoniousReplySenderColor: (msg: WhatsAppChatMessage, isMsgOutgoing: boolean) => string;
  getMessageTimestampColor: (isMsgOutgoing: boolean) => string;
  onChange?: (updated: WhatsAppChatData) => void;
}

export const WhatsAppChatMessageBubble: React.FC<Props> = ({
  msg,
  index,
  data,
  isOutgoing,
  msgType,
  showTail,
  bubbleStyles,
  isDark,
  isSenderBubbleDark,
  isReceiverBubbleDark,
  showSenderName,
  photoWidth,
  bubbleWidthPercent,
  messageFontSize,
  useCustomColors,
  mainTextColor,
  language,
  editingId,
  editingText,
  handleStartEditing,
  handleSaveEditing,
  setEditingText,
  getHarmoniousMissedCallCircleBg,
  getHarmoniousReplyBarColor,
  getHarmoniousReplySenderColor,
  getMessageTimestampColor,
  onChange,
}) => {
  // 1. Sticker type
  if (msgType === 'sticker') {
    if (!msg.stickerUrl && !msg.imageUrl && !msg.text) return null;
    return (
      <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <img
          src={(msg.stickerUrl || msg.imageUrl || msg.text || '').trim()}
          alt="sticker"
          className="max-w-[120px] max-h-[120px] object-contain drop-shadow-sm select-none pointer-events-none"
        />
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
    );
  }

  // 2. Missed call type
  if (msgType === 'missed_voice_call' || msgType === 'missed_video_call') {
    return (
      <div className="relative flex max-w-[85%] items-end">
        {!isOutgoing && showTail && (
          <svg
            viewBox="0 0 14 15"
            width="14"
            height="15"
            style={{ color: bubbleStyles.backgroundColor }}
            className="absolute bottom-0 -left-[6.5px] fill-current z-20 pointer-events-none"
          >
            <path d="M6.5 0 C6.5 5.8 4.2 10.6 0.4 13.9 C-0.1 14.3 0.1 14.9 0.8 14.9 C4 14.9 7.6 13.6 10.8 11.6 L12.5 9 L12.5 0 Z" />
          </svg>
        )}

        <div
          style={bubbleStyles}
          className="relative z-10 w-fit shadow-2xs px-2.5 py-2 flex items-center gap-2.5 min-w-[170px] max-w-[245px]"
        >
          <div
            style={{ backgroundColor: getHarmoniousMissedCallCircleBg(isOutgoing) }}
            className={`w-10 h-10 rounded-full shadow-xs flex items-center justify-center shrink-0 border ${
              (isOutgoing ? isSenderBubbleDark : isReceiverBubbleDark) ? 'border-white/10' : 'border-black/5'
            }`}
          >
            {msgType === 'missed_video_call' ? (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                <rect x="1.5" y="5.5" width="14" height="13" rx="2.5" fill="#FF3B30" />
                <path d="M16 9.8L21.5 6.2C22.2 5.7 23 6.2 23 7.1V16.9C23 17.8 22.2 18.3 21.5 17.8L16 14.2V9.8Z" fill="#FF3B30" />
                <path d="M12.5 16.5L4 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M4 12V8H8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                <path
                  d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.27-.27.35-.65.24-1.01A11.36 11.36 0 0 1 8.5 4.31c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.01z"
                  fill="#FF3B30"
                />
                <path d="M17 13L10.5 6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M10.5 10.5V6.5H14.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <div className="flex flex-col min-w-0 justify-center">
            {showSenderName && (
              <span style={{ color: msg.senderColor || '#e542a3' }} className="text-[12px] font-bold leading-tight mb-0.5 truncate select-none">
                {renderIosEmojis(msg.senderName || (language === 'id' ? 'Pengguna' : 'User'))}
              </span>
            )}
            <span className="text-[14px] font-semibold tracking-tight leading-tight select-none">
              {renderIosEmojis(
                msg.text || (msgType === 'missed_video_call'
                  ? (language === 'id' ? 'Panggilan video tak terjawab' : 'Missed video call')
                  : (language === 'id' ? 'Panggilan suara tak terjawab' : 'Missed voice call'))
              )}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] select-none text-slate-500">
                {formatWhatsAppTime(msg.time)}
              </span>
            </div>
          </div>
        </div>

        {isOutgoing && showTail && (
          <svg
            viewBox="0 0 14 15"
            width="14"
            height="15"
            style={{ color: bubbleStyles.backgroundColor }}
            className="absolute bottom-0 -right-[6.5px] fill-current z-20 pointer-events-none"
          >
            <path d="M7.5 0 C7.5 5.8 9.8 10.6 13.6 13.9 C14.1 14.3 13.9 14.9 13.2 14.9 C10 14.9 6.4 13.6 3.2 11.6 L1.5 9 L1.5 0 Z" />
          </svg>
        )}
      </div>
    );
  }

  // 3. Regular Bubble (Text, Media, Voice, Contact, Recalled)
  return (
    <div className="relative flex items-end" style={{ maxWidth: `${bubbleWidthPercent}%` }}>
      {!isOutgoing && showTail && (
        <svg
          viewBox="0 0 14 15"
          width="14"
          height="15"
          style={{ color: bubbleStyles.backgroundColor }}
          className="absolute bottom-0 -left-[6.5px] fill-current z-20 pointer-events-none"
        >
          <path d="M6.5 0 C6.5 5.8 4.2 10.6 0.4 13.9 C-0.1 14.3 0.1 14.9 0.8 14.9 C4 14.9 7.6 13.6 10.8 11.6 L12.5 9 L12.5 0 Z" />
        </svg>
      )}

      <div
        style={{
          ...bubbleStyles,
          ...(msgType === 'voice_note' ? { width: 268 } : {}),
          textAlign: 'left',
          ...(msgType === 'image' && msg.photoWidth !== undefined ? { width: `${photoWidth + 8}px` } : {}),
        }}
        className={`relative z-10 w-fit max-w-full shadow-2xs ${
          msgType === 'image'
            ? 'p-1'
            : hasWhatsAppReplyQuote(msg)
              ? 'p-1 pb-1.5'
              : 'px-[9px] py-[5.5px]'
        }`}
      >
        {/* Sender Name in Group Chat */}
        {showSenderName && (
          <div
            style={{ color: msg.senderColor || '#e542a3' }}
            className={`text-[12.5px] font-bold leading-tight mb-0.5 truncate select-none ${
              hasWhatsAppReplyQuote(msg) ? 'px-2 pt-0.5' : 'px-1'
            }`}
          >
            {renderIosEmojis(msg.senderName || (language === 'id' ? 'Pengguna' : 'User'))}
          </div>
        )}

        {/* Quoted / Reply Box */}
        {hasWhatsAppReplyQuote(msg) && (() => {
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

          if (msg.replyType === 'status') {
            return <WhatsAppStatusReplyQuote message={msg} background={quoteBg} textColor={quoteTextColor} />;
          }

          return (
            <div
              style={{
                backgroundColor: quoteBg,
                borderLeftColor: replyBarColor,
                borderLeftWidth: '3.5px',
                color: quoteTextColor,
              }}
              className="rounded-r-[7px] rounded-l-[2px] px-2.5 py-1 mb-1 text-[12px] border-l-solid max-w-full overflow-hidden select-none"
            >
              <div style={{ color: replySenderColor }} className="text-[11.5px] font-bold truncate -mt-0.5 mb-0.5">
                {renderIosEmojis(previewReplySender)}
              </div>
              <div className="text-[11.5px] opacity-85 truncate font-normal leading-tight">
                {renderIosEmojis(previewReplyText)}
              </div>
            </div>
          );
        })()}

        {/* Contact Card */}
        {msgType === 'contact' && !msg.isRecalled && msg.status !== 'recalled' && (
          <WhatsAppContactCard
            message={msg}
            dark={isOutgoing ? isSenderBubbleDark : isReceiverBubbleDark}
            time={formatWhatsAppTime(msg.time)}
            metadataColor={getMessageTimestampColor(isOutgoing)}
            ticks={isOutgoing ? renderTicks(msg, isDark, false, isSenderBubbleDark) : null}
          />
        )}

        {/* Voice Note */}
        {msgType === 'voice_note' && !msg.isRecalled && msg.status !== 'recalled' && !msg.deletedForMe && (
          <WhatsAppVoiceNote
            message={msg}
            outgoing={isOutgoing}
            dark={isOutgoing ? isSenderBubbleDark : isReceiverBubbleDark}
            avatar={(!isOutgoing && data.contactAvatar) || DEFAULT_AVATAR}
            time={formatWhatsAppTime(msg.time)}
            metadataColor={getMessageTimestampColor(isOutgoing)}
            ticks={renderTicks(msg, isDark, false, isSenderBubbleDark)}
            onChange={onChange ? patch => onChange({ ...data, messages: (data.messages || []).map(item => item.id === msg.id ? { ...item, ...patch } : item) }) : undefined}
          />
        )}

        {/* Image Attachment */}
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
              {count === 1 && (
                <img
                  src={rawPhotos[0].trim()}
                  alt="attachment"
                  className="w-full object-cover rounded-[7.5px]"
                  style={{ maxWidth: `${photoWidth}px`, maxHeight: `${photoWidth * 288 / 260}px` }}
                />
              )}
              {count === 2 && (
                <div style={{ width: `${photoWidth}px` }} className="grid grid-cols-2 gap-[2px] max-w-full aspect-[4/3] rounded-[7.5px] overflow-hidden">
                  {rawPhotos.slice(0, 2).map((imgUrl, i) => (
                    <div key={i} className="relative w-full h-full overflow-hidden bg-black/10">
                      <img src={imgUrl.trim()} alt={`photo-${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              {count === 3 && (
                <div style={{ width: `${photoWidth}px` }} className="grid grid-cols-2 gap-[2px] max-w-full aspect-[4/3] rounded-[7.5px] overflow-hidden">
                  <div className="relative w-full h-full overflow-hidden bg-black/10">
                    <img src={rawPhotos[0].trim()} alt="photo-1" className="w-full h-full object-cover" />
                  </div>
                  <div className="grid grid-rows-2 gap-[2px] w-full h-full overflow-hidden">
                    {rawPhotos.slice(1, 3).map((imgUrl, i) => (
                      <div key={i} className="relative w-full h-full overflow-hidden bg-black/10">
                        <img src={imgUrl.trim()} alt={`photo-${i + 2}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {count >= 4 && (
                <div style={{ width: `${photoWidth}px` }} className="grid grid-cols-2 gap-[2px] max-w-full aspect-square rounded-[7.5px] overflow-hidden">
                  {rawPhotos.slice(0, 4).map((imgUrl, i) => (
                    <div key={i} className="relative w-full h-full overflow-hidden bg-black/10">
                      <img src={imgUrl.trim()} alt={`photo-${i + 1}`} className="w-full h-full object-cover" />
                      {i === 3 && extraBadgeText && (
                        <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] flex items-center justify-center select-none">
                          <span className="text-white text-xl sm:text-2xl font-bold tracking-wider drop-shadow-md">
                            {extraBadgeText}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {hasCaption ? (() => {
                const captionMetrics = analyzeWhatsAppBubbleText(captionContent);
                return (
                  <div
                    style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', fontSize: `${messageFontSize}px` }}
                    className={`px-1 pt-1 pb-0.5 relative block max-w-full text-[15px] font-sans leading-[1.35] text-current ${hasWhatsAppReplyQuote(msg) ? 'px-2' : ''}`}
                  >
                    <div className="min-w-0 max-w-full break-words">
                      <span className="inline whitespace-pre-wrap break-words">{renderIosEmojis(captionMetrics.formatted)}</span>
                      <WhatsAppInlineMetaSpacer msg={msg} isOutgoing={isOutgoing} isDark={isDark} isSenderBubbleDark={isSenderBubbleDark} />
                    </div>
                    <div
                      style={{ color: getMessageTimestampColor(isOutgoing) }}
                      className={`absolute bottom-0.5 ${hasWhatsAppReplyQuote(msg) ? 'right-2' : 'right-1'} inline-flex items-center gap-1 text-[10px] leading-none select-none pointer-events-none whitespace-nowrap`}
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
            style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
            className={`relative flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 max-w-full text-[14px] font-sans leading-[1.35] py-0.5 text-current ${hasWhatsAppReplyQuote(msg) ? 'px-1' : ''}`}
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
            <div
              style={{ color: getMessageTimestampColor(isOutgoing) }}
              className={`shrink-0 self-end ml-auto inline-flex items-center gap-1 text-[10px] leading-none select-none pointer-events-none whitespace-nowrap pb-0.5 ${isOutgoing ? 'translate-y-[0.75px]' : ''}`}
            >
              <span className="tracking-tight leading-none font-normal">{formatWhatsAppTime(msg.time)}</span>
            </div>
          </div>
        )}

        {/* Regular Text Message Content */}
        {msgType === 'text' && !msg.isRecalled && msg.status !== 'recalled' && (() => {
          const rawDisplayText = !isOutgoing
            ? (msg.text || (language === 'id' ? 'Pesan masuk' : 'Received message'))
            : (msg.text || 'Read a message');
          const textMetrics = analyzeWhatsAppBubbleText(rawDisplayText);

          return (
            <div
              style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', fontSize: `${messageFontSize}px` }}
              className={`relative block max-w-full text-[15px] font-sans leading-[1.35] text-current ${hasWhatsAppReplyQuote(msg) ? 'px-1 pt-0.5 pb-0.5' : ''}`}
            >
              {editingId === (msg.id || String(index)) ? (
                <div className="w-full">
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
                    style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', fontSize: `${messageFontSize}px` }}
                    className="w-full bg-transparent border-b border-dashed border-sky-400 focus:outline-none text-[15px] font-sans leading-snug p-0 resize-none text-current break-words"
                  />
                </div>
              ) : (
                <div className="min-w-0 max-w-full break-words">
                  <span
                    onClick={() => handleStartEditing(msg.id || String(index), msg.text || '')}
                    style={{ wordWrap: 'break-word', overflowWrap: 'anywhere' }}
                    className="cursor-pointer hover:opacity-90 rounded-xs transition-opacity inline whitespace-pre-wrap break-words"
                    title="Click to inline edit text"
                  >
                    {renderIosEmojis(textMetrics.formatted)}
                  </span>
                  <WhatsAppInlineMetaSpacer msg={msg} isOutgoing={isOutgoing} isDark={isDark} isSenderBubbleDark={isSenderBubbleDark} />
                </div>
              )}
              <div
                style={{ color: getMessageTimestampColor(isOutgoing) }}
                className={`absolute bottom-0.5 ${hasWhatsAppReplyQuote(msg) ? 'right-1' : 'right-0'} inline-flex items-center gap-1 text-[10px] leading-none select-none pointer-events-none whitespace-nowrap`}
              >
                <span className="tracking-tight leading-none font-normal">{formatWhatsAppTime(msg.time)}</span>
                {isOutgoing && renderTicks(msg, isDark, false, isSenderBubbleDark)}
              </div>
            </div>
          );
        })()}
      </div>

      {isOutgoing && showTail && (
        <svg
          viewBox="0 0 14 15"
          width="14"
          height="15"
          style={{ color: bubbleStyles.backgroundColor }}
          className="absolute bottom-0 -right-[6.5px] fill-current z-20 pointer-events-none"
        >
          <path d="M7.5 0 C7.5 5.8 9.8 10.6 13.6 13.9 C14.1 14.3 13.9 14.9 13.2 14.9 C10 14.9 6.4 13.6 3.2 11.6 L1.5 9 L1.5 0 Z" />
        </svg>
      )}
    </div>
  );
};
