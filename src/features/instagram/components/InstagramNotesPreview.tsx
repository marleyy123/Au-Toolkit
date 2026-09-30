import React, { forwardRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { renderEmojiText } from '../../../utils/emojiUtils';

interface Props {
  data: any;
}

const MusicEqualizerIcon = ({ isDark }: { isDark: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={isDark ? "white" : "#0f172a"} className="flex-shrink-0 inline-block">
    {/* Outer Left short bar */}
    <rect x="3" y="8" width="3.5" height="8" rx="1.75" />
    {/* Middle tall bar */}
    <rect x="10.25" y="3" width="3.5" height="18" rx="1.75" />
    {/* Outer Right short bar */}
    <rect x="17.5" y="8" width="3.5" height="8" rx="1.75" />
  </svg>
);

const LocationOffIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mr-1 inline-block">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
    <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.4" />
  </svg>
);

export const InstagramNotesPreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { language } = useLanguage();
  const isId = language === 'id';
  const { notes = [], theme = 'light' } = data || {};
  const isDark = theme === 'dark';
  const containerBg = isDark ? 'bg-[#121212] text-white border-neutral-800/80' : 'bg-white text-slate-900 border-slate-200 shadow-xl';

  return (
    <div
      ref={ref}
      id="preview-target"
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
      }}
      className={`w-[480px] min-w-[480px] max-w-[480px] mx-auto ${containerBg} py-5 px-5 sm:px-6 shadow-2xl border font-sans select-none overflow-hidden shrink-0`}
    >
      {/* Header Direct */}
      <div className={`mb-3 flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-neutral-800/50' : 'border-slate-200'}`}>
        <h3 className={`text-sm font-semibold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>{isId ? 'Catatan' : 'Notes'}</h3>
        <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>Instagram Direct</span>
      </div>

      {/* Main Container Notes */}
      <div className="flex flex-row gap-5 sm:gap-6 overflow-x-auto py-2 px-1 scrollbar-none items-start justify-start">
        {notes.map((note: any, index: number) => {
          const isYourNote = note.isYourNote;
          const isOnline = note.isOnline;
          const avatar = note.avatarUrl || note.avatar || "";

          // Note 1 defaults to thought bubble 'Hello', Note 2+ defaults to music preview 'Pelangi' - 'HIVI!'
          const isNote1 = index === 0;
          const hasExplicitMusic = Boolean(note.songTitle || note.artistName);
          const hasExplicitText = Boolean(note.text);
          
          const hasMusic = isNote1 ? Boolean(note.songTitle) : (hasExplicitMusic || (!hasExplicitMusic && !hasExplicitText));
          const displaySongTitle = note.songTitle || (hasMusic ? 'Pelangi' : '');
          const displayArtistName = note.artistName || (hasMusic ? 'HIVI!' : '');
          const displayText = note.text || (isNote1 && !hasMusic ? 'Hello' : '');
          const showLocationOff = note.showLocationOff ?? note.isLocationOff ?? isYourNote;

          const bubbleBg = isDark
            ? 'bg-[#262626] text-white border-white/10 shadow-md'
            : 'bg-slate-100 text-slate-900 border-slate-200/90 shadow-sm';

          return (
            <div
              key={note.id || index}
              className="flex flex-col items-center min-w-[110px] max-w-[130px] font-sans shrink-0 relative pt-[92px]"
            >
              {/* 1. AVATAR PROFIL (FIXED ANCHOR - EXACT SAME Y POSITION FOR ALL NOTES) */}
              <div className="relative z-10 w-[72px] h-[72px] flex-shrink-0">
                <div className={`w-full h-full rounded-full overflow-hidden border ${isDark ? 'border-white/10 bg-[#1c1c1e]' : 'border-slate-200 bg-slate-100'} flex items-center justify-center`}>
                  {avatar && typeof avatar === 'string' && avatar.trim() !== '' ? (
                    <img
                      src={avatar.trim()}
                      alt={note.username || note.displayName || "Avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${isDark ? 'bg-neutral-700/60' : 'bg-slate-200'}`} />
                  )}
                </div>

                {/* Status Online Hijau - Authentic Instagram Cut-out Notch Effect */}
                {isOnline && (
                  <span
                    className={`absolute bottom-0 right-0 w-[15px] h-[15px] bg-[#10b981] rounded-full z-20 border-[2.5px] ${
                      isDark ? 'border-[#121212]' : 'border-white'
                    }`}
                  />
                )}

                {/* 2. NOTE BUBBLE (ABSOLUTELY POSITIONED ANCHORED DIRECTLY ABOVE AVATAR WITH OVERLAP) */}
                <div className="absolute bottom-[calc(100%-14px)] left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center w-max max-w-[135px]">
                  <div className={`relative ${bubbleBg} px-3.5 py-2 rounded-[20px] max-w-[135px] min-w-[68px] text-center flex flex-col items-center justify-center min-h-[36px] border`}>
                    {hasMusic ? (
                      <div className="flex flex-col items-center justify-center text-center w-full gap-0.5">
                        {/* Baris Pertama: Music Song Title (Judul Lagu) - Bold */}
                        {displaySongTitle && (
                          <div className="flex flex-row items-center justify-center gap-1.5 max-w-[120px] w-full">
                            <MusicEqualizerIcon isDark={isDark} />
                            <span className={`text-[11.5px] font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {renderEmojiText(displaySongTitle)}
                            </span>
                          </div>
                        )}

                        {/* Baris Kedua: Music Artist Name (Nama Artist) - Regular / Muted */}
                        {displayArtistName && (
                          <span className={`text-[10px] font-normal truncate max-w-[120px] text-center leading-tight ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                            {renderEmojiText(displayArtistName)}
                          </span>
                        )}

                        {/* Baris Ketiga: Thought Bubble Text (Teks Catatan) - Regular */}
                        {displayText && (
                          <span className={`text-[11px] font-normal leading-snug break-words max-w-[120px] text-center ${displaySongTitle || displayArtistName ? 'pt-0.5' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {renderEmojiText(displayText)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`text-[11.5px] leading-snug font-normal break-words max-w-[120px] text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {renderEmojiText(displayText || "Hello")}
                      </span>
                    )}

                    {/* Rounded Thought Bubble Tail & Dots with Dynamic Theme Color */}
                    <div className={`absolute -bottom-1.5 left-4 w-3 h-3 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-slate-100'} border ${isDark ? 'border-white/10' : 'border-slate-200/90'} pointer-events-none z-10`} />
                    <div className={`absolute -bottom-3.5 left-5.5 w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#262626]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-slate-200/90'} pointer-events-none z-10 shadow-xs`} />
                  </div>
                </div>
              </div>

              {/* 3. USERNAME & LOCATION OFF (LOCKED HORIZONTAL BASELINE ALIGNMENT) */}
              <div className="flex flex-col items-center justify-start pt-1.5 w-full">
                <div className="h-[18px] flex items-center justify-center w-full">
                  <span className={`text-[12px] text-center truncate max-w-[105px] font-normal leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {renderEmojiText(isYourNote ? (isId ? "Catatan Anda" : "Your note") : (note.username || note.displayName || "username"))}
                  </span>
                </div>

                {showLocationOff && (
                  <div className={`flex items-center justify-center mt-0.5 text-[11px] font-normal h-[16px] ${isDark ? 'text-neutral-300' : 'text-slate-500'}`}>
                    <LocationOffIcon />
                    <span>{isId ? 'Lokasi mati' : 'Location off'}</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
});
