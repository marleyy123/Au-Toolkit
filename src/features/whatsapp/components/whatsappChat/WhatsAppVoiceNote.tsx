import React, { useState } from 'react';
import { Mic, Pause, Play } from 'lucide-react';
import type { WhatsAppChatMessage } from '../../../../types';
import { useLanguage } from '../../../../context/LanguageContext';
import { normalizeVoiceDuration, normalizeVoiceProgress, normalizeVoiceWaveform } from '../../voiceNote';

interface Props {
  message: WhatsAppChatMessage;
  outgoing: boolean;
  dark: boolean;
  avatar: string;
  time: string;
  metadataColor: string;
  ticks: React.ReactNode;
  onChange?: (patch: Partial<WhatsAppChatMessage>) => void;
}

export function WhatsAppVoiceNote({ message, outgoing, dark, avatar, time, metadataColor, ticks, onChange }: Props) {
  const { language } = useLanguage();
  const isId = language === 'id';
  const [local, setLocal] = useState<Partial<WhatsAppChatMessage>>({});
  const current = onChange ? message : { ...message, ...local };
  const update = (patch: Partial<WhatsAppChatMessage>) => onChange ? onChange(patch) : setLocal(previous => ({ ...previous, ...patch }));
  const progress = normalizeVoiceProgress(current.voiceProgress);
  const waveform = normalizeVoiceWaveform(current.voiceWaveformBars);
  const playedColor = current.isVoicePlayed ? '#34b7f1' : '#00a884';
  const idleColor = dark ? '#8b989f' : '#83919a';
  const speed = current.voiceSpeed || '1x';
  const playing = !!current.isVoicePlaying;
  const portrait = (
    <div style={{ width: 42, height: 42, position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {playing || current.voiceSpeed ? (
        <button type="button" title={isId ? 'Kecepatan VN' : 'Voice note speed'} aria-label={isId ? 'Kecepatan VN' : 'Voice note speed'}
          onClick={() => update({ voiceSpeed: speed === '1x' ? '1.5x' : speed === '1.5x' ? '2x' : '1x' })}
          style={{ border: 0, borderRadius: 14, background: dark ? '#53636b' : '#637780', color: '#fff', fontSize: 12, fontWeight: 700, width: 40, height: 25, padding: 0, cursor: 'pointer' }}>{speed}</button>
      ) : <><img src={current.voiceAvatar || avatar} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
        <Mic size={19} fill={playedColor} stroke={dark ? '#202c33' : '#fff'} strokeWidth={1.5} style={{ position: 'absolute', bottom: -2, right: -3, color: playedColor }} /></>}
    </div>
  );
  return (
    <div data-voice-note={message.id} style={{ width: 250, maxWidth: '100%', padding: '5px 2px 1px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44 }}>
        {outgoing && portrait}
        <button type="button" title={playing ? (isId ? 'Jeda VN' : 'Pause voice note') : (isId ? 'Putar VN' : 'Play voice note')}
          aria-label={playing ? (isId ? 'Jeda VN' : 'Pause voice note') : (isId ? 'Putar VN' : 'Play voice note')}
          aria-pressed={playing} onClick={() => update({ isVoicePlaying: !playing })}
          style={{ width: 28, height: 36, flexShrink: 0, border: 0, padding: 0, background: 'transparent', color: idleColor, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
          {playing ? <Pause size={25} fill="currentColor" strokeWidth={0} /> : <Play size={25} fill="currentColor" strokeWidth={0} />}
        </button>
        <div style={{ flex: 1, minWidth: 0, height: 32, position: 'relative' }}>
          <div aria-hidden="true" style={{ height: '100%', display: 'flex', gap: 2, alignItems: 'center' }}>
            {waveform.map((height, index) => <span key={index} style={{ flex: 1, minWidth: 1, height: `${height}%`, borderRadius: 2, backgroundColor: progress > index / waveform.length * 100 ? playedColor : idleColor, opacity: 0.65 }} />)}
          </div>
          <span aria-hidden="true" style={{ position: 'absolute', top: 11, left: `calc(${progress}% - ${progress / 10}px)`, width: 10, height: 10, borderRadius: '50%', background: playedColor }} />
          <input type="range" min={0} max={100} value={progress} aria-label={isId ? 'Progress VN' : 'Voice note progress'}
            onChange={event => update({ voiceProgress: Number(event.target.value) })}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, margin: 0, cursor: 'pointer' }} />
        </div>
        {!outgoing && portrait}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, lineHeight: '14px', color: metadataColor, marginTop: 2 }}>
        <span style={{ marginLeft: outgoing ? 50 : 36 }}>{normalizeVoiceDuration(current.voiceDuration)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>{time}{outgoing && ticks}</span>
      </div>
    </div>
  );
}
