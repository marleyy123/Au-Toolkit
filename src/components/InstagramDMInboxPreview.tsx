import React from 'react';
import { InstagramDMInboxData } from '../types';
import { ChevronDown, Camera, User } from 'lucide-react';
import { renderIosEmojis } from '../utils/emojiUtils';
import { InstagramVerifiedBadge } from './Icons';
import { useLanguage } from '../context/LanguageContext';

const MusicEqualizerIcon = ({ isDark }: { isDark: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill={isDark ? "white" : "#000000"} className="shrink-0 inline-block">
    {/* Left short bar */}
    <rect x="3" y="8" width="3.5" height="8" rx="1.75" />
    {/* Middle tall bar */}
    <rect x="10.25" y="3" width="3.5" height="18" rx="1.75" />
    {/* Right short bar */}
    <rect x="17.5" y="8" width="3.5" height="8" rx="1.75" />
  </svg>
);

const LocationOffIcon = ({ className = "w-2.5 h-2.5 text-red-500 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
    <line x1="3" y1="3" x2="21" y2="21" strokeWidth="2.4" />
  </svg>
);

interface InstagramDMInboxPreviewProps {
  data: InstagramDMInboxData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const InstagramDMInboxPreview: React.FC<InstagramDMInboxPreviewProps> = ({
  data,
  previewRef,
}) => {
  const { language } = useLanguage();
  const isId = language === 'id';
  const isDark = data.theme === 'dark';
  const aspectRatio = data.aspectRatio || '4:5';

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '9:16':
        return 'aspect-[9/16]';
      case '4:5':
      default:
        return 'aspect-[4/5]';
    }
  };

  const accountName = data.accountUsername?.trim() || 'username';
  const userAvatar = data.userAvatar || '';
  const searchPlaceholder = data.searchPlaceholder?.trim() || (isId ? 'Cari atau tanya Meta AI' : 'Search or ask Meta AI');
  const requestsText = data.requestsCountText?.trim() || (isId ? 'Permintaan' : 'Requests');

  return (
    <div
      ref={previewRef}
      id="preview-target"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
        borderRadius: 'var(--preview-corner-radius, 0px)',
      }}
      className={`w-[380px] min-w-[380px] max-w-[380px] shrink-0 ${getAspectClass()} mx-auto overflow-hidden shadow-2xl ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      } relative select-none flex flex-col transition-colors duration-200`}
    >
      {/* 1. TOP HEADER BAR */}
      <div className={`px-4 pt-3 pb-2 flex items-center justify-between shrink-0 z-10 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="flex items-center space-x-1.5 cursor-pointer">
          <span className="font-bold text-[20px] tracking-tight truncate max-w-[240px]">
            {renderIosEmojis(accountName)}
          </span>
          <ChevronDown className="w-4 h-4 opacity-80 shrink-0 stroke-[2.5]" />
        </div>

        {/* New Message / Write Icon */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="p-1 hover:opacity-70 transition-opacity"
            title="New Message"
          >
            <svg
              className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 no-scrollbar">
        {/* Search Bar */}
        <div
          className={`w-full flex items-center px-3.5 py-2 rounded-xl text-[14px] transition-colors ${
            isDark ? 'bg-[#262626] text-neutral-400' : 'bg-[#efefef] text-neutral-500'
          }`}
        >
          {/* Outlined Search Icon */}
          <div className="flex items-center mr-2.5 shrink-0">
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7.5" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </div>
          <span className="truncate flex-1 font-normal text-[14px]">
            {renderIosEmojis(searchPlaceholder)}
          </span>
        </div>

        {/* Horizontal Notes Bar */}
        {data.showNotes !== false && data.notes && data.notes.length > 0 && (
          <div className="pt-1 pb-1">
            <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {data.notes.map((note, idx) => {
                const isNote1 = idx === 0;
                const hasExplicitMusic = Boolean(note.songTitle || note.artistName);
                const hasExplicitText = Boolean(note.noteText);

                const hasMusic = isNote1 ? hasExplicitMusic : (hasExplicitMusic || (!hasExplicitMusic && !hasExplicitText));
                const displaySongTitle = note.songTitle || (hasMusic ? 'Pelangi' : '');
                const displayArtistName = note.artistName || (hasMusic ? 'HIVI!' : '');
                const displayText = note.noteText || (isNote1 && !hasMusic ? 'Hello' : '');
                const hasBubble = hasMusic || Boolean(displayText);

                return (
                  <div key={note.id || idx} className="flex flex-col items-center shrink-0 w-[78px]">
                    {/* Note Avatar & Bubble Wrapper with lowered bubble touching top of avatar */}
                    <div className="relative flex flex-col items-center pt-5 w-full">
                      {/* Thought Bubble - Placed lower to nicely touch/overlap top of avatar */}
                      {hasBubble && (
                        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex flex-col items-center max-w-[96px]">
                          <div
                            className={`px-2.5 py-1 rounded-2xl text-center flex flex-col items-center justify-center min-w-[56px] max-w-[96px] min-h-[22px] ${
                              isDark
                                ? 'bg-[#262626] text-white border border-neutral-700/80 shadow-md'
                                : 'bg-white text-black border border-neutral-200/90 shadow-sm'
                            }`}
                          >
                            {hasMusic ? (
                              <div className="flex flex-col items-center justify-center text-center max-w-full overflow-hidden gap-0.5 py-0.5">
                                {/* Baris Pertama: Music Song Title (Judul Lagu) - Bold */}
                                {displaySongTitle && (
                                  <div className="flex items-center justify-center space-x-1 max-w-full overflow-hidden">
                                    <MusicEqualizerIcon isDark={isDark} />
                                    <span className={`text-[9.5px] font-bold truncate max-w-[78px] leading-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                      {renderIosEmojis(displaySongTitle)}
                                    </span>
                                  </div>
                                )}

                                {/* Baris Kedua: Music Artist Name (Nama Artist) - Regular / Thin */}
                                {displayArtistName && (
                                  <span className={`text-[8.5px] font-normal truncate max-w-[82px] text-center leading-tight ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {renderIosEmojis(displayArtistName)}
                                  </span>
                                )}

                                {/* Baris Ketiga: Thought Bubble Text (Teks Catatan) - Regular / Thin */}
                                {displayText && (
                                  <span className={`text-[9px] font-normal leading-tight break-words max-w-[84px] text-center ${displaySongTitle || displayArtistName ? 'pt-0.5' : ''} ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                    {renderIosEmojis(displayText)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-normal leading-tight truncate max-w-[78px]">
                                {renderIosEmojis(displayText || (isNote1 ? 'Hello' : ''))}
                              </span>
                            )}
                          </div>

                          {/* Refined Rounded Bubble Tails with Dynamic Theme Color */}
                          <div
                            className={`w-2 h-2 rounded-full absolute -bottom-1 left-3.5 ${
                              isDark ? 'bg-[#262626] border border-neutral-700/80' : 'bg-white border border-neutral-200/90'
                            }`}
                          />
                          <div
                            className={`w-1.5 h-1.5 rounded-full absolute -bottom-2.5 left-4.5 shadow-xs ${
                              isDark ? 'bg-[#262626] border border-neutral-700/80' : 'bg-white border border-neutral-200/90'
                            }`}
                          />
                        </div>
                      )}

                      {/* Note Avatar Circle - Clean, no black outline */}
                      <div className="relative">
                        <div className="w-[64px] h-[64px] rounded-full flex items-center justify-center overflow-hidden">
                          {note.avatar ? (
                            <img
                              src={note.avatar}
                              alt={note.username || 'user'}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-full flex items-center justify-center ${isDark ? 'bg-[#262626]' : 'bg-neutral-200'}`}>
                              <User className={`w-7 h-7 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                            </div>
                          )}
                        </div>

                        {/* Online status green dot - Soft semi-transparent border & shadow */}
                        {note.isOnline && (
                          <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full absolute bottom-0.5 right-0.5 border border-white/40 shadow-[0_1px_3px_rgba(0,0,0,0.2)]" />
                        )}
                      </div>
                    </div>

                    {/* Username or Subtitle */}
                    <span className="text-[11.5px] font-normal text-center truncate w-full mt-1.5 opacity-90 leading-tight">
                      {renderIosEmojis(note.username || (note.isYourNote ? (isId ? 'Catatan Anda' : 'Your note') : 'username'))}
                    </span>

                    {/* Location off status label */}
                    {note.locationStatus && (
                      <div className="flex items-center justify-center space-x-1 mt-0.5 max-w-full">
                        <LocationOffIcon className="w-2.5 h-2.5 text-red-500 shrink-0" />
                        <span className="text-[9px] text-red-500 truncate leading-none font-medium">
                          {renderIosEmojis(note.locationStatus)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. INBOX SECTION HEADER */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-[16px] tracking-tight">
            {isId ? 'Pesan' : 'Messages'}
          </span>
          <button
            type="button"
            className="text-[#0095f6] hover:text-[#1877f2] font-semibold text-[14px] transition-colors"
          >
            {renderIosEmojis(requestsText)}
          </button>
        </div>

        {/* 4. CONVERSATION CHAT LIST */}
        <div className="space-y-1 pt-0.5">
          {data.conversations && data.conversations.map((conv, cIdx) => {
            return (
              <div
                key={conv.id || cIdx}
                className={`flex items-center justify-between py-2 px-1.5 -mx-1.5 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-neutral-900/60 active:bg-neutral-900' : 'hover:bg-neutral-100/70 active:bg-neutral-100'
                }`}
              >
                {/* Left: Avatar with optional Story ring - Clean, no black border */}
                <div className="relative shrink-0 mr-3.5">
                  <div
                    className={`w-[52px] h-[52px] rounded-full p-[2px] flex items-center justify-center ${
                      conv.hasStoryRing
                        ? 'bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] to-[#962fbf]'
                        : 'bg-transparent'
                    }`}
                  >
                    {conv.avatar ? (
                      <img
                        src={conv.avatar}
                        alt={conv.username || 'user'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${isDark ? 'bg-[#262626]' : 'bg-neutral-200'}`}>
                        <User className={`w-6 h-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Contact Name & Message Snippet */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-[14px] leading-snug truncate">
                      {renderIosEmojis(conv.username || 'username')}
                    </span>
                    {(conv.verified === 'ig-blue' || conv.verified === 'blue') && (
                      <InstagramVerifiedBadge className="w-3.5 h-3.5 inline-block shrink-0" />
                    )}
                  </div>

                  <div className="text-[13px] leading-tight truncate mt-0.5 flex items-center flex-wrap gap-x-1">
                    {conv.isDraft ? (
                      <span className="text-red-500 font-medium">
                        {renderIosEmojis(conv.draftText || 'Draft: ')}
                      </span>
                    ) : null}

                    <span className={`${conv.hasUnread ? (isDark ? 'text-white font-semibold' : 'text-black font-semibold') : 'text-neutral-400'} truncate`}>
                      {renderIosEmojis(conv.lastMessageSnippet || (conv.isDraft ? 'Send a message' : 'Your text goes here'))}
                    </span>

                    {conv.actionText ? (
                      <span className="text-[#0095f6] font-semibold cursor-pointer">
                        {renderIosEmojis(conv.actionText)}
                      </span>
                    ) : null}

                    {conv.timeAgo && !conv.lastMessageSnippet?.includes(conv.timeAgo) ? (
                      <span className="text-neutral-400 shrink-0 text-[12px]">
                        · {renderIosEmojis(conv.timeAgo)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Right: Camera Icon or Unread Dot */}
                <div className="shrink-0 ml-2.5 flex items-center justify-center">
                  {conv.hasUnread ? (
                    <div className="w-2.5 h-2.5 bg-[#0095f6] rounded-full" />
                  ) : conv.showCameraIcon === true ? (
                    <button
                      type="button"
                      className={`p-1.5 rounded-full hover:opacity-70 transition-opacity ${
                        isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                      }`}
                    >
                      <Camera className="w-5 h-5 stroke-[1.8]" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. BOTTOM NAVIGATION BAR (CLEAN OUTLINED VECTOR ICONS MATCHING REFERENCE) */}
      <div
        className={`w-full grid grid-cols-5 items-center px-2 py-2.5 border-t shrink-0 z-20 transition-colors ${
          isDark ? 'bg-black border-neutral-900 text-white' : 'bg-white border-neutral-200 text-black'
        }`}
      >
        {/* Tab 1: Home (Clean Outlined & Perfectly Centered) */}
        <button type="button" className="flex items-center justify-center p-1 hover:opacity-70 transition-opacity w-full">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-6v-6a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v6H4a1 1 0 0 1-1-1V9.5z" />
          </svg>
        </button>

        {/* Tab 2: Video / Reels (Clean Outlined) */}
        <button type="button" className="flex items-center justify-center p-1 hover:opacity-70 transition-opacity w-full">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
            <line x1="2.5" y1="8.5" x2="21.5" y2="8.5" />
            <line x1="17" y1="2.5" x2="14" y2="8.5" />
            <line x1="10" y1="2.5" x2="7" y2="8.5" />
            <polygon points="10 12 10 17 15 14.5" fill="currentColor" stroke="none" />
          </svg>
        </button>

        {/* Tab 3: Send / Direct Messages (Clean Outlined Plane) */}
        <button type="button" className="flex items-center justify-center p-1 hover:opacity-70 transition-opacity w-full">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Tab 4: Search (Clean Outlined Magnifying Glass) */}
        <button type="button" className="flex items-center justify-center p-1 hover:opacity-70 transition-opacity w-full">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7.5" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
        </button>

        {/* Tab 5: Profile Avatar (Clean, no black border) */}
        <button type="button" className="flex items-center justify-center p-1 hover:opacity-70 transition-opacity w-full">
          <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                <User className="w-3.5 h-3.5 opacity-70" />
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
