import React from 'react';
import { WhatsAppCallData } from '../types';
import { renderFormattedTextWithAppleEmojis } from '../utils/emojiUtils';

// ============================================================================
// CUSTOM iOS-STYLE CALL CONTROL ICONS
// ============================================================================

export const IOSMoreIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="6" cy="12" r="2.1" />
    <circle cx="12" cy="12" r="2.1" />
    <circle cx="18" cy="12" r="2.1" />
  </svg>
);

export const IOSVideoIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="6" width="14" height="12" rx="3.5" ry="3.5" />
    <path d="M17.2 9.2 L20.6 6.9 C21.4 6.3 22.5 6.9 22.5 7.8 V16.2 C22.5 17.1 21.4 17.7 20.6 17.1 L17.2 14.8 Z" />
  </svg>
);

export const IOSSpeakerIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.5 9.5 H6.8 L12 5.2 C12.6 4.7 13.5 5.1 13.5 5.9 V18.1 C13.5 18.9 12.6 19.3 12 18.8 L6.8 14.5 H3.5 C2.7 14.5 2 13.8 2 13 V11 C2 10.2 2.7 9.5 3.5 9.5 Z" />
    <path
      d="M16.5 9.2 C17.8 10.5 17.8 13.5 16.5 14.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
    <path
      d="M19.8 6.5 C22.2 8.9 22.2 15.1 19.8 17.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
    />
  </svg>
);

export const IOSMicOffIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <mask id="mic-slash-gap">
      <rect x="0" y="0" width="24" height="24" fill="white" />
      <line x1="3.5" y1="3.5" x2="20.5" y2="20.5" stroke="black" strokeWidth="3.8" strokeLinecap="round" />
    </mask>
    <g mask="url(#mic-slash-gap)">
      {/* Solid Filled Microphone Capsule Body */}
      <rect x="8.5" y="2" width="7" height="11" rx="3.5" fill="currentColor" />
      {/* Outer Arc Stand */}
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Stem and Base Foot */}
      <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="8.5" y1="21" x2="15.5" y2="21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </g>
    {/* Slash */}
    <line
      x1="3.5"
      y1="3.5"
      x2="20.5"
      y2="20.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const CustomEndCallIcon: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.2 11.8c.5-.7 1.3-1.4 2.2-1.9 4.6-2.6 10.6-2.6 15.2 0 .9.5 1.7 1.2 2.2 1.9.5.7.4 1.7-.2 2.3l-1.5 1.6c-.6.6-1.5.7-2.2.2l-2.1-1.5c-.4-.3-.6-.8-.6-1.3v-.4c-1.8-.4-3.6-.4-5.4 0v.4c0 .5-.2 1-.6 1.3l-2.1 1.5c-.7.5-1.6.4-2.2-.2L3 14.1c-.6-.6-.7-1.6-.2-2.3z" />
  </svg>
);

export const IOSHangupIcon = CustomEndCallIcon;

interface Props {
  data: WhatsAppCallData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (updated: WhatsAppCallData) => void;
}

export const WhatsAppCallPreview: React.FC<Props> = ({ data, previewRef }) => {
  const {
    contactName = '🤍',
    contactAvatar = '',
    callDuration = '02:20:19',
    callStatusText = '',
    callWallpaper = '',
    aspectRatio = '9:16',
    theme = 'light',
    isSpeakerActive = true,
    isMuted = false,
    isVideoActive = false,
  } = (data || {}) as any;

  const isLight = theme === 'light' && !callWallpaper;

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '9:16':
      default:
        return 'aspect-[9/16]';
    }
  };

  return (
    <div
      ref={previewRef}
      id="preview-target"
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
      }}
      className={`relative w-[380px] min-w-[380px] max-w-[380px] mx-auto flex flex-col justify-between overflow-hidden shadow-2xl select-none font-sans shrink-0 ${
        isLight ? 'bg-[#f0f2f5] text-slate-900' : 'bg-[#0b141a] text-white'
      } ${getAspectClass()}`}
    >
      {/* 0. Custom Wallpaper Background Image */}
      {callWallpaper && (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center z-0"
          style={{ backgroundImage: `url(${callWallpaper})` }}
        >
          {/* Subtle dark overlay to keep text readable */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
      )}

      {/* 1. Top Header Section */}
      <div className="flex justify-between items-start w-full px-5 pt-6 pb-2 z-10 relative">
        {/* Left: Minimize / Shrink icon */}
        <button
          type="button"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isLight
              ? 'bg-slate-200/80 backdrop-blur-xs text-slate-800 hover:bg-slate-300 shadow-xs border border-slate-300/40'
              : 'bg-black/30 backdrop-blur-xs text-white hover:bg-black/50 shadow-md'
          }`}
          title="Minimize Panggilan"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="10" y1="14" x2="3" y2="21" />
          </svg>
        </button>

        {/* Center: Caller Name & Call Duration below */}
        <div className="flex flex-col items-center justify-center text-center px-2 max-w-[65%] mx-auto">
          <h2
            className={`text-xl sm:text-2xl font-bold tracking-wide truncate max-w-full drop-shadow-xs flex items-center justify-center gap-1 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
            style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', sans-serif" }}
          >
            {renderFormattedTextWithAppleEmojis(contactName || '🤍')}
          </h2>
          <span className={`text-sm font-medium tracking-wider mt-0.5 drop-shadow-xs ${
            isLight ? 'text-slate-600' : 'text-slate-300/90'
          }`}>
            {callDuration || '00:00'}
          </span>
          {callStatusText && (
            <span className={`text-[11px] font-normal mt-0.5 truncate max-w-full ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {renderFormattedTextWithAppleEmojis(callStatusText)}
            </span>
          )}
        </div>

        {/* Right: Add Participant icon */}
        <button
          type="button"
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
            isLight
              ? 'bg-slate-200/80 backdrop-blur-xs text-slate-800 hover:bg-slate-300 shadow-xs border border-slate-300/40'
              : 'bg-black/30 backdrop-blur-xs text-white hover:bg-black/50 shadow-md'
          }`}
          title="Add Participant"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="17" y1="11" x2="23" y2="11" />
          </svg>
        </button>
      </div>

      {/* 2. Middle Profile Picture Section */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-auto py-6">
        <div className={`relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full overflow-hidden flex items-center justify-center ${
          isLight
            ? 'shadow-[0_15px_35px_rgba(0,0,0,0.12)] border-2 border-white bg-slate-200'
            : 'shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-zinc-800/80'
        }`}>
          {contactAvatar && contactAvatar.trim() !== '' ? (
            <img
              src={contactAvatar.trim()}
              alt={contactName || 'Contact Avatar'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isLight ? 'bg-slate-200 text-slate-400' : 'bg-[#1f2c34] text-slate-400'}`}>
              <svg className="w-24 h-24 sm:w-28 sm:h-28 text-slate-400/80 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-3.8-.85-5.05-2.2.03-1.68 3.37-2.6 5.05-2.6s5.02.92 5.05 2.6C15.8 19.15 14.03 20 12 20z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Action Bar */}
      <div className="w-full px-4 sm:px-6 pb-6 pt-2 z-10 relative">
        <div className={`rounded-[32px] p-3 sm:p-3.5 max-w-sm sm:max-w-md mx-auto ${
          isLight
            ? 'bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl'
            : 'bg-[#1e1f24] backdrop-blur-md shadow-2xl'
        }`}>
          <div className="flex justify-center items-center w-full gap-2.5 sm:gap-3.5">
            {/* Button 1: More / Ellipsis */}
            <button
              type="button"
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95 ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-[#424348] hover:bg-[#4e4f55] text-white'
              }`}
              title="Opsi Panggilan"
            >
              <IOSMoreIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${isLight ? 'text-slate-800' : 'text-white'}`} />
            </button>

            {/* Button 2: Video Camera */}
            <button
              type="button"
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95 ${
                isVideoActive
                  ? isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'
                  : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-[#424348] hover:bg-[#4e4f55] text-white'
              }`}
              title="Video Call"
            >
              <IOSVideoIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${
                isVideoActive
                  ? isLight ? 'text-white' : 'text-black'
                  : isLight ? 'text-slate-800' : 'text-white'
              }`} />
            </button>

            {/* Button 3: Speaker / Audio Output */}
            <button
              type="button"
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95 ${
                isSpeakerActive !== false
                  ? isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'
                  : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-[#424348] hover:bg-[#4e4f55] text-white'
              }`}
              title="Speaker Aktif"
            >
              <IOSSpeakerIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${
                isSpeakerActive !== false
                  ? isLight ? 'text-white' : 'text-black'
                  : isLight ? 'text-slate-800' : 'text-white'
              }`} />
            </button>

            {/* Button 4: Microphone Off */}
            <button
              type="button"
              className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-transform active:scale-95 ${
                isMuted
                  ? isLight ? 'bg-slate-900 text-white' : 'bg-white text-black'
                  : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-[#424348] hover:bg-[#4e4f55] text-white'
              }`}
              title="Mute Mic"
            >
              <IOSMicOffIcon className={`w-7 h-7 sm:w-8 sm:h-8 ${
                isMuted
                  ? isLight ? 'text-white' : 'text-black'
                  : isLight ? 'text-slate-800' : 'text-white'
              }`} />
            </button>

            {/* Button 5: End Call / Hangup */}
            <button
              type="button"
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#f01438] hover:bg-[#d91030] text-white flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-transform active:scale-95"
              title="Akhiri Panggilan"
            >
              <CustomEndCallIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
