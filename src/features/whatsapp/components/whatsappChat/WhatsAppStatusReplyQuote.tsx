import React from 'react';
import type { WhatsAppChatMessage } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';
import { renderFormattedTextWithAppleEmojis } from '../../../../utils/emojiUtils';

interface Props {
  message: WhatsAppChatMessage;
  background: string;
  textColor: string;
}

export function WhatsAppStatusReplyQuote({ message, background, textColor }: Props) {
  const { isId } = useLanguage();
  const name = message.statusReplyName?.trim() || (isId ? 'Kamu' : 'You');
  const caption = message.statusReplyCaption?.trim() || '';
  const thumbnail = message.statusReplyImage?.trim();
  const accent = '#a275df';
  return (
    <div data-status-reply={message.id} style={{ display: 'flex', width: '100%', minWidth: 145, minHeight: 48, marginBottom: 4, borderRadius: 6, overflow: 'hidden', background, borderLeft: `3.5px solid ${accent}`, color: textColor }}>
      <div style={{ flex: 1, minWidth: 0, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11.5, fontWeight: 700, lineHeight: '15px', color: accent }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{renderFormattedTextWithAppleEmojis(name)}</span>
          <span style={{ flexShrink: 0 }}>&middot; Status</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: 11.5, lineHeight: '15px', opacity: 0.85 }}>
          {message.showMediaIndicator && (
            <svg data-status-media-icon width={13} height={13} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }} aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm7 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
              <circle cx="12" cy="13" r="2.5" />
            </svg>
          )}
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{renderFormattedTextWithAppleEmojis(caption)}</span>
        </div>
      </div>
      {thumbnail && <img data-status-thumbnail src={thumbnail} alt={isId ? 'Thumbnail status' : 'Status thumbnail'} style={{ width: 48, height: 48, flexShrink: 0, objectFit: 'cover' }} />}
    </div>
  );
}
