import React from 'react';
import type { WhatsAppChatMessage } from '../../../../../types';
import { ImageUploader } from '../../../../../components/FormControls';
import { useLanguage } from '../../../../../context/LanguageContext';

interface Props {
  message: WhatsAppChatMessage;
  onChange: (patch: Partial<WhatsAppChatMessage>) => void;
  inputClass: string;
}

export function WhatsAppStatusReplyControls({ message, onChange, inputClass }: Props) {
  const { isId } = useLanguage();
  return (
    <div className="space-y-3">
      <label className="block text-xs space-y-1">
        <span>{isId ? 'Nama pemilik status' : 'Status owner name'}</span>
        <input className={inputClass} value={message.statusReplyName ?? ''} placeholder={isId ? 'Kamu' : 'You'}
          onChange={event => onChange({ statusReplyName: event.target.value })} />
      </label>
      <label className="block text-xs space-y-1">
        <span>{isId ? 'Caption status' : 'Status caption'}</span>
        <input className={inputClass} value={message.statusReplyCaption ?? ''}
          onChange={event => onChange({ statusReplyCaption: event.target.value })} />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!message.showMediaIndicator}
          onChange={event => onChange({ showMediaIndicator: event.target.checked })} />
        {isId ? 'Tampilkan ikon foto' : 'Show photo icon'}
      </label>
      <ImageUploader label={isId ? 'Thumbnail status' : 'Status thumbnail'} value={message.statusReplyImage || ''}
        onChange={statusReplyImage => onChange({ statusReplyImage })} onClear={() => onChange({ statusReplyImage: '' })}
        storageCategory="media" />
    </div>
  );
}
