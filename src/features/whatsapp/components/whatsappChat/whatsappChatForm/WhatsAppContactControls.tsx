import { Select } from '../../../../../components/ui/Select';
import React from 'react';
import type { WhatsAppChatMessage } from '../../../../../types';
import { ImageUploader } from '../../../../../components/FormControls';
import { useLanguage } from '../../../../../context/LanguageContext';

interface Props {
  message: WhatsAppChatMessage;
  onChange: (patch: Partial<WhatsAppChatMessage>) => void;
}

export function WhatsAppContactControls({ message, onChange }: Props) {
  const { isId } = useLanguage();
  const inputClass = 'w-full border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100';
  return (
    <div className="space-y-3 py-2">
      <label className="text-xs space-y-1 block">
        <span>{isId ? 'Nama kontak yang dibagikan' : 'Shared contact name'}</span>
        <input className={inputClass} value={message.sharedContactName ?? ''}
          onChange={event => onChange({ sharedContactName: event.target.value })} />
      </label>
      <label className="text-xs space-y-1 block">
        <span>{isId ? 'Nomor kontak yang dibagikan' : 'Shared contact phone'}</span>
        <input type="tel" className={inputClass} value={message.sharedContactPhone ?? ''}
          onChange={event => onChange({ sharedContactPhone: event.target.value })} />
      </label>
      <label className="text-xs space-y-1 block">
        <span>{isId ? 'Jenis kontak' : 'Contact type'}</span>
        <Select aria-label={isId ? 'Jenis kontak' : 'Contact type'} className={inputClass} value={message.sharedContactType || 'registered'}
          onValueChange={value => onChange({ sharedContactType: value as WhatsAppChatMessage['sharedContactType'] })}>
          <option value="registered">{isId ? 'Terdaftar di WhatsApp' : 'Registered on WhatsApp'}</option>
          <option value="unregistered">{isId ? 'Belum terdaftar di WhatsApp' : 'Not registered on WhatsApp'}</option>
        </Select>
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={message.showSharedContactAvatar !== false}
          onChange={event => onChange({ showSharedContactAvatar: event.target.checked })} />
        {isId ? 'Tampilkan avatar kontak' : 'Show contact avatar'}
      </label>
      {message.showSharedContactAvatar !== false && (
        <ImageUploader label={isId ? 'Avatar kontak' : 'Contact avatar'} value={message.sharedContactAvatar || ''}
          onChange={sharedContactAvatar => onChange({ sharedContactAvatar })}
          onClear={() => onChange({ sharedContactAvatar: '' })}
          cropShape="round" forceAspect={1} storageCategory="avatars" />
      )}
    </div>
  );
}
