import { AudioLines } from 'lucide-react';
import type { InstagramDMData, InstagramDMMessage } from '../../../../../types';
import { INSTAGRAM_DM_PRESETS } from '../../../../../data/instagramPresets';
import { normalizeColor } from '../../../../../utils/colorUtils';
import { IOSEmojiText } from '../../../../../utils/iosEmoji';
import { useLanguage } from '../../../../../context/LanguageContext';
import { hasNoteReply } from './noteReply';

export function InstagramDMNoteReplyPreview({ message, data }: { message: InstagramDMMessage; data: InstagramDMData }) {
  const { language } = useLanguage();
  if (!hasNoteReply(message)) return null;
  const outgoing = message.sender === 'outgoing';
  const dark = data.theme !== 'light';
  const preset = data.useCustomTheme ? INSTAGRAM_DM_PRESETS.find((item) => item.id === data.activeThemePreset) : undefined;
  const color = (custom: string | undefined, presetColor: string | undefined, fallback: string) =>
    (data.useCustomTheme && (normalizeColor(custom) || presetColor)) || fallback;
  const background = color(data.customIncomingBg || data.customPillBg, preset?.incomingBg, dark ? '#262626' : '#f4f4f5');
  const foreground = color(data.customTextColor, preset?.textColor, dark ? '#ffffff' : '#0f172a');
  const secondary = color(data.customSecondaryTextColor, preset?.secondaryTextColor, dark ? '#a3a3a3' : '#64748b');
  const icon = color(data.customIconColor, preset?.iconColor, foreground);
  const owner = message.noteOwnerName?.trim() || (outgoing ? data.name || data.username : 'You') || 'U';
  // Outgoing replies quote the other person's note; incoming replies quote our note.
  const avatar = message.noteOwnerAvatar?.trim() || (outgoing ? data.avatar : '');
  const song = message.noteSongTitle?.trim();
  const artist = message.noteArtistName?.trim();
  const note = message.noteText?.trim() || (!song && !artist ? (language === 'id' ? 'Catatan' : 'Note') : '');
  const caption = outgoing
    ? (language === 'id' ? 'Anda membalas catatannya' : 'You replied to their note')
    : (language === 'id' ? 'Membalas catatan Anda' : 'Replied to your note');

  return (
    <div data-note-reply-preview className={`flex flex-col mt-1.5 mb-1 max-w-[84%] min-w-0 ${outgoing ? 'items-end' : 'items-start ml-9'}`}>
      <span style={{ color: secondary }} className="text-[11px] font-medium leading-tight mb-2 break-words"><IOSEmojiText text={caption} /></span>
      <div className={`flex items-stretch gap-2 min-w-0 max-w-full ${outgoing ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex flex-col min-w-0 ${outgoing ? 'items-end' : 'items-start'}`}>
          <div className="relative min-w-0 max-w-full">
            <div data-note-pill style={{ background, color: foreground }} className="px-3.5 py-2 rounded-[22px] min-h-[38px] min-w-[70px] max-w-[210px] text-center shadow-xs">
              {song && <div className="flex items-center justify-center gap-1.5 min-w-0"><AudioLines size={14} style={{ color: icon }} className="shrink-0" /><span className="text-xs font-bold truncate min-w-0"><IOSEmojiText text={song} /></span></div>}
              {artist && <div style={{ color: secondary }} className="text-[10.5px] truncate"><IOSEmojiText text={artist} /></div>}
              {note && <div className={`text-[13px] leading-snug whitespace-pre-wrap [overflow-wrap:anywhere] ${song || artist ? 'pt-0.5' : ''}`}><IOSEmojiText text={note} /></div>}
            </div>
            <div style={{ background }} className={`absolute -bottom-[3px] w-[11px] h-[11px] rounded-full ${outgoing ? 'right-[50px]' : 'left-[12px]'}`} />
            <div style={{ background }} className={`absolute -bottom-[11.5px] w-[7px] h-[7px] rounded-full ${outgoing ? 'right-[42px]' : 'left-[19px]'}`} />
          </div>
          <div style={{ background: dark ? '#404040' : '#e5e5e5', color: foreground }} className="mt-2 w-16 h-16 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold" aria-label={owner}>
            {avatar ? <img src={avatar} alt={owner} className="w-full h-full object-cover" /> : <IOSEmojiText text={Array.from(owner)[0].toUpperCase()} />}
          </div>
        </div>
        <div data-note-reply-line style={{ backgroundColor: normalizeColor(message.replyBarColor) || (dark ? '#404040' : '#d4d4d4') }} className="w-[2.5px] rounded-full shrink-0 my-0.5" />
      </div>
    </div>
  );
}
