import { Select } from '../../../../../components/ui/Select';
import React from 'react';
import type { WhatsAppChatMessage } from '../../../../../types';
import { ImageUploader } from '../../../../../components/FormControls';
import { useLanguage } from '../../../../../context/LanguageContext';
import { normalizeVoiceDuration, normalizeVoiceProgress, VOICE_WAVEFORMS } from '../../../voiceNote';

export function WhatsAppVoiceNoteControls({ message, onChange }: { message: WhatsAppChatMessage; onChange: (patch: Partial<WhatsAppChatMessage>) => void }) {
  const { language } = useLanguage();
  const isId = language === 'id';
  const inputClass = 'w-full border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 bg-white dark:bg-slate-800 text-sm';
  const waveform = Object.entries(VOICE_WAVEFORMS).find(([, bars]) => JSON.stringify(bars) === JSON.stringify(message.voiceWaveformBars))?.[0] || '';
  return <div className="space-y-3 py-2">
    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs space-y-1 block">{isId ? 'Durasi VN' : 'Voice note duration'}
        <input aria-label={isId ? 'Durasi VN' : 'Voice note duration'} className={inputClass} value={message.voiceDuration ?? '0:15'} placeholder="0:15" maxLength={6}
          onChange={event => onChange({ voiceDuration: event.target.value })} onBlur={event => onChange({ voiceDuration: normalizeVoiceDuration(event.target.value) })} />
      </label>
      <label className="text-xs space-y-1 block">{isId ? 'Kecepatan' : 'Speed'}
        <Select className={inputClass} value={message.voiceSpeed || ''} onValueChange={value => onChange({ voiceSpeed: (value || undefined) as WhatsAppChatMessage['voiceSpeed'] })}>
          <option value="">{isId ? 'Tampilkan avatar' : 'Show avatar'}</option><option value="1x">1x</option><option value="1.5x">1.5x</option><option value="2x">2x</option>
        </Select>
      </label>
    </div>
    <label className="text-xs space-y-1 block">{isId ? 'Gelombang suara' : 'Waveform'}
      <Select className={inputClass} value={waveform} onValueChange={value => onChange({ voiceWaveformBars: [...VOICE_WAVEFORMS[value as keyof typeof VOICE_WAVEFORMS]] })}>
        {!waveform && <option value="" disabled>{isId ? 'Kustom' : 'Custom'}</option>}
        <option value="natural">{isId ? 'Natural' : 'Natural'}</option><option value="quiet">{isId ? 'Tenang' : 'Quiet'}</option><option value="energetic">{isId ? 'Ekspresif' : 'Energetic'}</option>
      </Select>
    </label>
    <label className="text-xs block">{isId ? 'Progress VN' : 'Voice note progress'}: {normalizeVoiceProgress(message.voiceProgress)}%
      <input className="w-full accent-purple-600 mt-2" type="range" min={0} max={100} value={normalizeVoiceProgress(message.voiceProgress)} onChange={event => onChange({ voiceProgress: Number(event.target.value) })} />
    </label>
    <div className="flex flex-wrap gap-4 text-xs">
      <label className="flex items-center gap-2"><input type="checkbox" checked={!!message.isVoicePlayed} onChange={event => onChange({ isVoicePlayed: event.target.checked })} />{isId ? 'Sudah didengar' : 'Listened'}</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={!!message.isVoicePlaying} onChange={event => onChange({ isVoicePlaying: event.target.checked })} />{isId ? 'Sedang diputar' : 'Playing'}</label>
    </div>
    <ImageUploader label={isId ? 'Avatar VN' : 'Voice note avatar'} value={message.voiceAvatar || ''} onChange={voiceAvatar => onChange({ voiceAvatar })} onClear={() => onChange({ voiceAvatar: '' })} cropShape="round" forceAspect={1} storageCategory="avatars" />
  </div>;
}
