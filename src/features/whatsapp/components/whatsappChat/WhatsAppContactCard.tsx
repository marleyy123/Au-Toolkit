import React from 'react';
import { UserRound } from 'lucide-react';
import type { WhatsAppChatMessage } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';
import { renderFormattedTextWithAppleEmojis } from '../../../../utils/emojiUtils';

interface Props {
  message: WhatsAppChatMessage;
  dark: boolean;
  time: string;
  metadataColor: string;
  ticks: React.ReactNode;
}

export function WhatsAppContactCard({ message, dark, time, metadataColor, ticks }: Props) {
  const { isId } = useLanguage();
  const name = message.sharedContactName?.trim() || (isId ? 'Kontak' : 'Contact');
  const phone = message.sharedContactPhone?.trim();
  const avatar = message.sharedContactAvatar?.trim();
  const unregistered = message.sharedContactType === 'unregistered';
  const actions = unregistered
    ? [isId ? 'Undang ke WhatsApp' : 'Invite to WhatsApp']
    : [isId ? 'Kirim Pesan' : 'Message', isId ? 'Simpan Kontak' : 'Save Contact'];

  return (
    <div data-contact-card={message.id} style={{ width: 250, maxWidth: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 2px', minHeight: 52 }}>
        {message.showSharedContactAvatar !== false && (
          <div data-contact-avatar style={{ width: 42, height: 42, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', background: dark ? '#53636b' : '#e1e7eb', color: dark ? '#e9edef' : '#83919a', display: 'grid', placeItems: 'center' }}>
            {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <UserRound size={27} />}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: '19px' }}>{renderFormattedTextWithAppleEmojis(name)}</div>
          {phone && <div style={{ fontSize: 11, lineHeight: '16px', opacity: 0.75 }}>{phone}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, fontSize: 10, lineHeight: '14px', paddingBottom: 4, color: metadataColor }}>
        <span>{time}</span>{ticks}
      </div>
      <div data-contact-actions style={{ display: 'flex', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`, color: dark ? '#53bdeb' : '#007aff', textAlign: 'center', fontSize: 13, fontWeight: 500 }}>
        {actions.map((action, index) => (
          <div key={action} style={{ flex: 1, minWidth: 0, padding: '8px 2px', lineHeight: '18px', overflowWrap: 'anywhere', borderLeft: index ? `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}` : undefined }}>{action}</div>
        ))}
      </div>
    </div>
  );
}
