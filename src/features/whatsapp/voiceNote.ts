import type { WhatsAppChatMessage } from '../../types';

export const VOICE_WAVEFORMS = {
  natural: [15, 15, 20, 45, 90, 80, 100, 75, 45, 90, 85, 20, 20, 40, 95, 90, 80, 100, 20, 15, 20, 15],
  quiet: [12, 18, 25, 35, 22, 18, 40, 48, 30, 20, 16, 24, 38, 50, 32, 20, 15, 30, 24, 18, 12, 16],
  energetic: [20, 65, 95, 40, 100, 75, 30, 85, 100, 55, 25, 90, 65, 100, 45, 80, 95, 35, 70, 100, 45, 20],
};

export const voiceNoteDefaults = (): Partial<WhatsAppChatMessage> => ({
  voiceDuration: '0:15', voiceProgress: 0,
  voiceWaveformBars: [...VOICE_WAVEFORMS.natural],
  isVoicePlayed: false, isVoicePlaying: false,
});

export function normalizeVoiceDuration(value?: string): string {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(value?.trim() || '');
  return match ? `${Number(match[1])}:${match[2]}` : '0:15';
}

export function normalizeVoiceProgress(value?: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value!)) : 0;
}

export function normalizeVoiceWaveform(bars?: number[]): number[] {
  const valid = Array.isArray(bars) ? bars.filter(Number.isFinite).slice(0, 48) : [];
  return valid.length >= 8 ? valid.map(bar => Math.max(8, Math.min(100, bar))) : VOICE_WAVEFORMS.natural;
}
