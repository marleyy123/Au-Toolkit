import React from 'react';
import { InstagramStoryData } from '../types';
import { InstagramVerifiedBadge, InstagramHeartIcon, InstagramCommentIcon, InstagramSendIcon } from './Icons';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';
import { renderEmojiReaction, renderFormattedTextWithAppleEmojis } from '../utils/emojiUtils';
import { Star, ChevronDown } from 'lucide-react';

interface Props {
  data: InstagramStoryData;
  onChange?: (updated: InstagramStoryData) => void;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const InstagramStoryPreview: React.FC<Props> = ({ data, onChange, previewRef }) => {
  const [isShift, setIsShift] = React.useState(false);
  const [is123, setIs123] = React.useState(false);

  const {
    username,
    avatar,
    timeAgo,
    verified,
    mediaImage,
    showReplyBar,
    storyCount = 4,
    activeStoryIndex = 1,
    activeStoryProgress = 50,
    isCloseFriends = false,
    musicTitle = '',
    musicArtist = '',
    showCommentOverlay = false,
    commentOverlayText = '',
    commentOverlayAvatars = [],
    commentOverlayBubbleColor = 'dark',
    theme = 'dark',
    // Story Reply Mode
    isStoryReplyMode = false,
    replyMessageText = 'Send message...',
    showQuickReactions = true,
    showKeyboard = true,
    keyboardTheme,
    emojis = ['😂', '😮', '😍', '😢', '👏', '🔥'],
  } = (data || {}) as any;

  const currentReplyText = replyMessageText ?? 'Send message...';

  const handleUpdateReplyText = (newVal: string) => {
    if (onChange) {
      onChange({
        ...data,
        replyMessageText: newVal,
      });
    }
  };

  const handleKeyPress = (char: string) => {
    let current = currentReplyText;
    if (current === 'Send message...') {
      current = '';
    }
    const charToInsert = isShift ? char.toUpperCase() : char.toLowerCase();
    const next = current + charToInsert;
    if (isShift) setIsShift(false);
    handleUpdateReplyText(next);
  };

  const handleBackspace = () => {
    let current = currentReplyText;
    if (current === 'Send message...' || current.length === 0) {
      handleUpdateReplyText('');
      return;
    }
    handleUpdateReplyText(current.slice(0, -1));
  };

  const handleSpace = () => {
    let current = currentReplyText;
    if (current === 'Send message...') {
      current = '';
    }
    handleUpdateReplyText(current + ' ');
  };

  const totalStories = Math.max(1, Math.min(20, storyCount));
  const activePos = Math.max(1, Math.min(totalStories, activeStoryIndex));
  const progressBars = Array.from({ length: totalStories });

  const isLight = theme === 'light';

  // San Francisco / iOS system font style
  const sfFontStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "San Francisco", sans-serif',
  };

  const renderQuickReaction = (value: string | undefined, fallback: string): React.ReactNode => {
    return renderEmojiReaction(value, fallback);
  };

  // Keyboard theme styling based on dark / light mode
  const effectiveKeyboardTheme = keyboardTheme || theme || 'dark';
  const isDarkKb = effectiveKeyboardTheme === 'dark';
  const keyboardBg = isDarkKb ? 'bg-[#1c1c1e]' : 'bg-[#d2d5db]';
  const keyBg = isDarkKb
    ? 'bg-[#505052] text-white rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.4)]'
    : 'bg-white text-black rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.35)]';
  const specialKeyBg = isDarkKb
    ? 'bg-[#363638] text-white rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.4)]'
    : 'bg-[#adb5bd] text-black rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.25)]';
  const spacebarBg = isDarkKb
    ? 'bg-[#505052] text-white/60 rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.4)]'
    : 'bg-white text-black/50 rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.35)]';

  // -------------------------------------------------------------
  // MODE 1: STORY REPLY MODE (isStoryReplyMode === true)
  // -------------------------------------------------------------
  if (isStoryReplyMode) {
    return (
      <div
        ref={previewRef}
        id="preview-target"
        style={{
          ...sfFontStyle,
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className="w-[380px] min-w-[380px] max-w-[380px] aspect-[9/16] mx-auto bg-black text-white overflow-hidden shadow-2xl border-0 relative select-none flex flex-col justify-between font-sans shrink-0"
      >
        {/* STORY BACKGROUND AREA */}
        <div className="relative w-full flex-1 bg-[#111111] overflow-hidden flex flex-col justify-between p-3.5 pt-3">
          {mediaImage ? (
            <>
              <img
                src={mediaImage}
                alt="Story Background"
                className="absolute inset-0 w-full h-full object-cover z-0"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translate3d(0, 0, 0)',
                }}
              />
              <div className={`absolute inset-0 z-10 pointer-events-none ${isStoryReplyMode ? 'bg-black/40' : 'bg-transparent'}`} />
            </>
          ) : null}

          {/* STORY HEADER (PROGRESS BAR & USER INFO) */}
          <div className="relative z-20">
            {/* Dynamic Segmented Progress Bar */}
            <div className="w-full h-[2px] mb-3 flex gap-1">
              {progressBars.map((_, idx) => {
                const position = idx + 1;
                const isCompleted = position < activePos;
                const isActive = position === activePos;
                const fillPercent = isActive ? Math.max(0, Math.min(100, activeStoryProgress)) : isCompleted ? 100 : 0;
                return (
                  <div key={idx} className="h-full bg-white/30 flex-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-150"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* User Info Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-neutral-700/60 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                  {avatar && avatar.trim() !== '' ? (
                    <img src={avatar} alt={username || 'username'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-700/60" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center space-x-1.5 leading-normal">
                    <span className="text-xs font-semibold text-white tracking-wide">{renderFormattedTextWithAppleEmojis(username || 'username')}</span>
                    {verified === 'ig-blue' && <InstagramVerifiedBadge className="w-3.5 h-3.5" />}
                    <span className="text-[11px] text-white/70">{renderFormattedTextWithAppleEmojis(timeAgo || '1h')}</span>
                  </div>
                  {(musicArtist || musicTitle) && (
                    <div className="flex items-center gap-1.5 text-[10.5px] mt-0.5 text-white max-w-[210px] leading-normal py-0.5">
                      <svg className="w-2 h-2.5 fill-white shrink-0" viewBox="0 0 10 12">
                        <rect x="0" y="0.5" width="2.2" height="11" rx="1" />
                        <rect x="3.9" y="3.5" width="2.2" height="5" rx="1" />
                        <rect x="7.8" y="0.5" width="2.2" height="11" rx="1" />
                      </svg>
                      <span className="truncate text-white inline-flex items-center leading-normal py-0.5">
                        {musicTitle && <span className="font-bold text-white tracking-tight">{renderFormattedTextWithAppleEmojis(musicTitle)}</span>}
                        {musicArtist && musicTitle && <span className="mx-1 font-normal text-white/90">•</span>}
                        {musicArtist && <span className="font-normal text-white/90 tracking-tight">{renderFormattedTextWithAppleEmojis(musicArtist)}</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button (X) */}
              <button className="text-white opacity-80 hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* MIDDLE STORY AREA: 2 ROWS OF SHARED EMOJI REACTIONS */}
          {showQuickReactions !== false && (
            <div className="my-auto w-full px-6 flex flex-col gap-5 items-center z-20">
              {/* Row 1: 😂 😮 😍 */}
              <div className="flex justify-between items-center w-full max-w-[240px]">
                {['😂', '😮', '😍'].map((fallback, index) => <span key={index} className="w-11 h-11 text-[36px] leading-none flex items-center justify-center hover:scale-110 transition-transform cursor-pointer drop-shadow-md">{renderQuickReaction(emojis[index], fallback)}</span>)}
              </div>

              {/* Row 2: 😢 👏 🔥 */}
              <div className="flex justify-between items-center w-full max-w-[240px]">
                {['😢', '👏', '🔥'].map((fallback, index) => <span key={index} className="w-11 h-11 text-[36px] leading-none flex items-center justify-center hover:scale-110 transition-transform cursor-pointer drop-shadow-md">{renderQuickReaction(emojis[index + 3], fallback)}</span>)}
              </div>
            </div>
          )}

          {/* BOTTOM STORY AREA: DYNAMIC MESSAGE INPUT BAR (CAPSULE) */}
          <div className="relative z-20 w-full mb-1">
            <div className="w-full rounded-full border border-white/30 bg-black/40 px-4 py-2.5 flex items-center justify-between backdrop-blur-xs">
              <div className="flex items-center gap-0.5 text-sm text-white font-normal">
                <span>{renderFormattedTextWithAppleEmojis(replyMessageText || "Your text goes here...")}</span>
                <span className="w-[1.5px] h-4 bg-white animate-pulse ml-0.5 inline-block" />
              </div>
            </div>
          </div>
        </div>

        {/* iOS KEYBOARD MOCKUP */}
        {showKeyboard !== false && (
          <div className={`w-full ${keyboardBg} pt-2 pb-4 px-1 flex flex-col gap-2 z-30 select-none border-none outline-none ring-0 shadow-none shrink-0 -mb-[1px]`}>
            {/* Row 1 */}
            <div className="flex justify-center gap-1.5 w-full px-0.5">
              {(is123 ? ["1","2","3","4","5","6","7","8","9","0"] : ["q","w","e","r","t","y","u","i","o","p"]).map(k => (
                <button
                  type="button"
                  key={k}
                  onClick={() => handleKeyPress(k)}
                  className={`flex-1 h-[44px] ${keyBg} flex items-center justify-center text-[22px] font-normal cursor-pointer active:scale-95 transition-transform hover:brightness-110`}
                >
                  {isShift ? k.toUpperCase() : k}
                </button>
              ))}
            </div>

            {/* Row 2 */}
            <div className="flex justify-center gap-1.5 px-4 w-full">
              {(is123 ? ["-","/",":",";","(",")","$","&","@",'"'] : ["a","s","d","f","g","h","j","k","l"]).map(k => (
                <button
                  type="button"
                  key={k}
                  onClick={() => handleKeyPress(k)}
                  className={`flex-1 h-[44px] ${keyBg} flex items-center justify-center text-[22px] font-normal cursor-pointer active:scale-95 transition-transform hover:brightness-110`}
                >
                  {isShift ? k.toUpperCase() : k}
                </button>
              ))}
            </div>

            {/* Row 3 */}
            <div className="flex justify-center gap-1.5 w-full px-0.5">
              {/* Shift Key (⇧) - Authentic iOS Outlined (Inactive) vs Filled (Active) states */}
              <button
                type="button"
                onClick={() => setIsShift(prev => !prev)}
                className={`w-11 h-[44px] ${isShift ? 'bg-white text-black shadow-sm' : specialKeyBg} flex items-center justify-center cursor-pointer active:scale-95 transition-transform rounded-[5px] shrink-0`}
                title={isShift ? 'Shift Active (Uppercase)' : 'Shift Inactive (Lowercase)'}
              >
                <svg
                  className={`w-5 h-5 transition-colors ${
                    isShift ? 'fill-black stroke-black' : 'fill-transparent stroke-current'
                  }`}
                  strokeWidth={isShift ? '1' : '1.8'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4.5L19.5 12H15V19.5H9V12H4.5L12 4.5Z" />
                </svg>
              </button>
              {(is123 ? [".",",","?","!","'"] : ["z","x","c","v","b","n","m"]).map(k => (
                <button
                  type="button"
                  key={k}
                  onClick={() => handleKeyPress(k)}
                  className={`flex-1 h-[44px] ${keyBg} flex items-center justify-center text-[22px] font-normal cursor-pointer active:scale-95 transition-transform hover:brightness-110`}
                >
                  {isShift ? k.toUpperCase() : k}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                className={`w-11 h-[44px] ${specialKeyBg} flex items-center justify-center cursor-pointer active:scale-95 transition-transform hover:brightness-110 shrink-0`}
              >
                <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
                  <line x1="18" y1="9" x2="12" y2="15"/>
                  <line x1="12" y1="9" x2="18" y2="15"/>
                </svg>
              </button>
            </div>

            {/* Row 4 */}
            <div className="flex justify-center gap-1.5 w-full px-0.5 mt-0.5">
              <button
                type="button"
                onClick={() => setIs123(prev => !prev)}
                className={`w-11 h-[44px] ${specialKeyBg} flex items-center justify-center text-[12px] font-semibold cursor-pointer active:scale-95 transition-transform shrink-0`}
              >
                {is123 ? 'ABC' : '123'}
              </button>
              <div className={`w-11 h-[44px] ${specialKeyBg} flex items-center justify-center shrink-0`}>
                <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <button
                type="button"
                onClick={handleSpace}
                className={`flex-1 h-[44px] ${spacebarBg} flex items-center justify-end px-3 text-[11px] font-light text-white/50 tracking-wide cursor-pointer active:scale-95 transition-transform hover:brightness-110`}
              >
                EN ID
              </button>
              <button
                type="button"
                className={`w-[76px] h-[44px] ${specialKeyBg} flex items-center justify-center text-[14px] font-normal ${isDarkKb ? 'text-white' : 'text-black'} cursor-pointer active:scale-95 transition-transform shrink-0`}
              >
                return
              </button>
            </div>

            {/* Bottom Keyboard Bar */}
            <div className="flex items-center justify-between px-6 pt-2 pb-2">
              <svg className={`w-5 h-5 ${isDarkKb ? 'text-white/80' : 'text-black/80'}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9"/>
                <path d="M3.6 9h16.8M3.6 15h16.8"/>
                <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/>
              </svg>

              <div className={`w-[140px] h-[5px] ${isDarkKb ? 'bg-white' : 'bg-black'} rounded-full my-0.5`} />

              <svg className={`w-5 h-5 ${isDarkKb ? 'text-white/80' : 'text-black/80'}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="22"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODE 2: STANDARD IG STORY VIEW (isStoryReplyMode === false)
  // -------------------------------------------------------------
  const wrapperBgHex = isLight ? '#ffffff' : '#000000';
  const cardBgClass = isLight ? 'bg-slate-100 text-slate-900' : 'bg-neutral-900 text-white';

  const renderClusterAvatar = (url?: string) => {
    if (url && url.trim() !== '') {
      return (
        <img
          src={url}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <div className="w-full h-full bg-neutral-600 flex items-center justify-center text-neutral-300">
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    );
  };

  const barActiveClass = isLight ? 'bg-slate-900' : 'bg-white';
  const barInactiveClass = isLight ? 'bg-slate-900/25' : 'bg-white/40';

  const textHeaderClass = isLight ? 'text-slate-900 font-semibold' : 'text-white font-semibold';
  const subtextClass = isLight ? 'text-slate-600' : 'text-white/70';
  const iconBtnClass = isLight ? 'text-slate-800 hover:text-black' : 'text-white/80 hover:text-white';

  const replyBarBg = isLight
    ? 'bg-slate-900/10 border border-slate-900/20 text-slate-800'
    : 'bg-black/40 border border-white/30 text-white/90';

  return (
    <div
      ref={previewRef}
      id="export-ig-story"
      className={`w-[380px] min-w-[380px] max-w-[380px] mx-auto aspect-[9/16] relative overflow-hidden flex flex-col justify-between font-sans select-none shadow-none outline-none transition-all shrink-0 ${cardBgClass}`}
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
        backgroundColor: wrapperBgHex,
      }}
    >
      {/* Media Backdrop / Image */}
      {mediaImage && mediaImage.trim() !== '' ? (
        <div className="absolute inset-0 z-0">
          <img
            src={mediaImage}
            alt="Story media"
            className="w-full h-full object-cover"
            style={{
              imageRendering: '-webkit-optimize-contrast',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translate3d(0, 0, 0)',
            }}
          />
          {/* Subtle top/bottom vignette gradient - ONLY when story reply mode is enabled */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              isStoryReplyMode
                ? (isLight
                    ? 'bg-gradient-to-b from-white/75 via-transparent to-white/85'
                    : 'bg-black/40')
                : 'bg-transparent'
            }`}
          />
        </div>
      ) : (
        <div
          className={`absolute inset-0 z-0 flex items-center justify-center text-xs ${
            isLight ? 'bg-slate-200 text-slate-500' : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          No story image uploaded
        </div>
      )}

      {/* Top Header Overlay */}
      <div className="relative z-10 w-full pt-2">
        {/* Dynamic Story Progress Indicators (Line Story) */}
        <div id="story-progress-container" className="flex items-center space-x-1 px-3 pt-1">
          {progressBars.map((_, idx) => {
            const position = idx + 1;
            const isPast = position < activePos;
            const isActive = position === activePos;
            const fillPercent = isActive ? Math.max(0, Math.min(100, activeStoryProgress)) : isPast ? 100 : 0;

            return (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full overflow-hidden ${barInactiveClass}`}
              >
                <div
                  className={`h-full rounded-full transition-all ${barActiveClass}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* User Profile Bar */}
        <div className="flex items-center justify-between px-3 pt-2.5">
          <div className="flex items-center space-x-2">
            <img
              src={(avatar && avatar.trim() !== '') ? avatar : DEFAULT_AVATAR}
              alt={username || 'username'}
              className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-200"
            />

            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1.5 leading-normal">
                <span className={`text-[13px] font-semibold drop-shadow-xs ${textHeaderClass}`}>{renderFormattedTextWithAppleEmojis(username || 'username')}</span>
                {verified === 'ig-blue' && <InstagramVerifiedBadge className="w-3.5 h-3.5" />}
                <span className={`text-[12px] ${subtextClass}`}>{renderFormattedTextWithAppleEmojis(timeAgo || '12m')}</span>
              </div>

              {/* Music Indicator under Username */}
              {(musicArtist || musicTitle) && (
                <div className="flex items-center gap-1.5 text-[11px] mt-0.5 text-white max-w-[240px] leading-normal py-0.5">
                  {/* Equalizer Icon */}
                  <svg className="w-2.5 h-3 fill-white shrink-0" viewBox="0 0 10 12">
                    <rect x="0" y="0.5" width="2.2" height="11" rx="1" />
                    <rect x="3.9" y="3.5" width="2.2" height="5" rx="1" />
                    <rect x="7.8" y="0.5" width="2.2" height="11" rx="1" />
                  </svg>
                  <span className="truncate text-white inline-flex items-center leading-normal py-0.5">
                    {musicTitle && <span className="font-bold text-white tracking-tight">{renderFormattedTextWithAppleEmojis(musicTitle)}</span>}
                    {musicArtist && musicTitle && <span className="mx-1 font-normal text-white/90">•</span>}
                    {musicArtist && <span className="font-normal text-white/90 tracking-tight">{renderFormattedTextWithAppleEmojis(musicArtist)}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Close Friends Capsule Badge */}
            {isCloseFriends && (
              <div
                id="preview-close-friends-badge"
                className="bg-[#1cd14f] rounded-full px-2 py-0.5 flex items-center gap-1 select-none shadow-xs"
                title="Close Friends"
              >
                <Star className="w-3 h-3 text-white fill-white" />
                <ChevronDown className="w-2.5 h-2.5 text-white stroke-[3]" />
              </div>
            )}

            {/* Story Options (...) */}
            <button className={`p-1 ${iconBtnClass}`}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {/* Close Button (X) */}
            <button className={`p-1 ${iconBtnClass}`}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Center spacing */}
      <div className="relative z-10 flex-1 w-full" />

      {/* Story Reply / Comment Overlay */}
      {showCommentOverlay && (() => {
        const avatars = commentOverlayAvatars || [];
        const count = Math.max(1, Math.min(3, avatars.length || 1));
        const isWhiteBubble = commentOverlayBubbleColor === 'light';
        const bubbleBg = isWhiteBubble ? 'bg-white' : 'bg-[#262626]';
        const bubbleTextColor = isWhiteBubble ? 'text-black' : 'text-white';
        const bubbleTailColor = isWhiteBubble ? 'text-white' : 'text-[#262626]';

        return (
          <div id="story-comment-overlay" className="relative z-20 w-full px-3 pb-2 pt-1">
            <div className="flex items-end gap-1.5 min-w-0">
              {/* Dynamic Cluster Avatar Container */}
              {count === 1 && (
                <div className="relative w-7 h-7 shrink-0 select-none">
                  <div className="w-7 h-7 rounded-full border border-black/80 overflow-hidden shadow-xs bg-neutral-600">
                    {renderClusterAvatar(avatars[0])}
                  </div>
                </div>
              )}

              {count === 2 && (
                <div className="relative w-8.5 h-8 shrink-0 select-none">
                  <div className="absolute top-0 left-0 w-5 h-5 rounded-full border border-black/80 overflow-hidden shadow-xs bg-neutral-600 z-10">
                    {renderClusterAvatar(avatars[0])}
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full border border-black/80 overflow-hidden shadow-xs bg-neutral-500 z-20">
                    {renderClusterAvatar(avatars[1])}
                  </div>
                </div>
              )}

              {count === 3 && (
                <div className="relative w-10 h-9 shrink-0 select-none">
                  <div className="absolute top-1 left-0 w-5 h-5 rounded-full border border-black/80 overflow-hidden shadow-xs bg-neutral-600 z-10">
                    {renderClusterAvatar(avatars[0])}
                  </div>
                  <div className="absolute top-0 left-2.5 w-5 h-5 rounded-full border border-black/80 overflow-hidden shadow-xs bg-neutral-500 z-20">
                    {renderClusterAvatar(avatars[1])}
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full border border-black/80 overflow-hidden shadow-xs bg-neutral-400 z-30">
                    {renderClusterAvatar(avatars[2])}
                  </div>
                </div>
              )}

              {/* Chat Bubble with Tail */}
              <div className={`relative inline-flex items-center min-w-0 max-w-[calc(100%-2.5rem)] ${bubbleBg} ${bubbleTextColor} px-3.5 py-1.5 sm:py-2 rounded-[20px] shadow-lg`}>
                <svg
                  className={`absolute -left-2.5 bottom-0.5 w-3.5 h-3.5 ${bubbleTailColor} fill-current pointer-events-none`}
                  viewBox="0 0 14 14"
                >
                  <path d="M14 0 C14 7 8 12 0 14 C7 13 12 10 14 4 Z" />
                </svg>
                <span className={`text-xs sm:text-[13px] font-normal ${bubbleTextColor} truncate tracking-tight leading-snug`}>
                  {renderFormattedTextWithAppleEmojis(commentOverlayText || 'Your text goes here...')}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom Reply Bar */}
      {showReplyBar && (
        <div className="relative z-10 w-full px-3 pb-4 pt-2 flex items-center space-x-3">
          <div className={`flex-1 rounded-full px-4 py-2.5 text-xs font-normal ${replyBarBg}`}>
            Send message...
          </div>
          <button className={`hover:scale-110 transition-transform ${iconBtnClass}`}>
            <InstagramHeartIcon className={`w-6 h-6 ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </button>
          <button className={`hover:scale-110 transition-transform ${iconBtnClass}`}>
            <InstagramCommentIcon className={`w-6 h-6 ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </button>
          <button className={`hover:scale-110 transition-transform ${iconBtnClass}`}>
            <InstagramSendIcon className={`w-6 h-6 ${isLight ? 'text-slate-900' : 'text-white'}`} />
          </button>
        </div>
      )}
    </div>
  );
};
