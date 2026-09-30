import React, { forwardRef, useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { renderEmojiReaction, renderEmojiText } from '../../../utils/emojiUtils';

interface Props {
  data: any;
  onChange?: (updated: any) => void;
}

export const InstagramStoryReplyPreview = forwardRef<HTMLDivElement, Props>(({ data, onChange }, ref) => {
  const { language } = useLanguage();
  const isId = language === 'id';
  const [isShift, setIsShift] = useState(false);
  const [is123, setIs123] = useState(false);

  const {
    username = "ramadhniap_",
    avatarUrl = data?.avatar || "",
    messageText = data?.replyMessageText ?? (isId ? "Kirim pesan..." : "Send message..."),
    theme = "dark",
    showKeyboard = true,
    showQuickReactions = true,
    emojis = ['😂', '😮', '😍', '😢', '👏', '🔥'],
    storySegmentsCount = 3,
    activeSegmentIndex = 1,
    activeSegmentProgress = 70,
  } = data || {};

  const currentText = data?.messageText ?? data?.replyMessageText ?? messageText ?? '';

  const handleUpdateText = (nextText: string) => {
    if (onChange) {
      onChange({
        ...data,
        messageText: nextText,
        replyMessageText: nextText,
      });
    }
  };

  const handleKeyPress = (char: string) => {
    let current = currentText;
    if (current === 'Send message...') {
      current = '';
    }
    const charToInsert = isShift ? char.toUpperCase() : char.toLowerCase();
    const next = current + charToInsert;
    if (isShift) setIsShift(false);
    handleUpdateText(next);
  };

  const handleBackspace = () => {
    let current = currentText;
    if (current === 'Send message...' || current.length === 0) {
      handleUpdateText('');
      return;
    }
    handleUpdateText(current.slice(0, -1));
  };

  const handleSpace = () => {
    let current = currentText;
    if (current === 'Send message...') {
      current = '';
    }
    handleUpdateText(current + ' ');
  };

  // Check flexible story background image properties
  const storyImg = data?.storyImageUrl || data?.storyImage || data?.backgroundImage || data?.bgImage || "";

  const isDark = theme === 'dark';

  // San Francisco / iOS system font style
  const sfFontStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "San Francisco", sans-serif',
  };

  // Keyboard theme styling based on dark / light mode
  const keyboardBg = isDark ? 'bg-[#1c1c1e]' : 'bg-[#d2d5db]';
  const keyBg = isDark
    ? 'bg-[#505052] text-white rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.4)]'
    : 'bg-white text-black rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.35)]';
  const specialKeyBg = isDark
    ? 'bg-[#363638] text-white rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.4)]'
    : 'bg-[#adb5bd] text-black rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.25)]';
  const spacebarBg = isDark
    ? 'bg-[#505052] text-white/60 rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.4)]'
    : 'bg-white text-black/50 rounded-[5px] shadow-[0_1px_0_rgba(0,0,0,0.35)]';

  const renderQuickReaction = (value: string | undefined, fallback: string): React.ReactNode => {
    return renderEmojiReaction(value, fallback);
  };

  // Dynamic Story Progress Bar math
  const segmentsCount = Math.max(1, Math.min(10, Number(storySegmentsCount) || 3));
  const activeIdx = Math.max(1, Math.min(segmentsCount, Number(activeSegmentIndex) || 1));
  const activeProgress = Math.max(0, Math.min(100, Number(activeSegmentProgress) ?? 70));

  const row1Keys = is123 ? ["1","2","3","4","5","6","7","8","9","0"] : ["q","w","e","r","t","y","u","i","o","p"];
  const row2Keys = is123 ? ["-","/",":",";","(",")","$","&","@",'"'] : ["a","s","d","f","g","h","j","k","l"];
  const row3Keys = is123 ? [".",",","?","!","'"] : ["z","x","c","v","b","n","m"];

  return (
    <div
      ref={ref}
      id="preview-target"
      style={{
        ...sfFontStyle,
        borderRadius: 'var(--preview-corner-radius, 0px)',
      }}
      className="w-[380px] min-w-[380px] max-w-[380px] aspect-[9/16] mx-auto bg-black text-white overflow-hidden shadow-2xl border-0 relative select-none flex flex-col justify-between shrink-0"
    >
      {/* 1. STORY BACKGROUND AREA (BACKGROUND IMAGE OR POLOS #111111) */}
      <div className="relative w-full flex-1 bg-[#111111] overflow-hidden flex flex-col justify-between p-3.5 pt-3">
        {/* Render background image if available */}
        {storyImg && storyImg.trim() !== '' ? (
          <>
            <img
              src={storyImg}
              alt="Story Background"
              className="absolute inset-0 w-full h-full object-cover z-0"
              style={{
                imageRendering: '-webkit-optimize-contrast',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translate3d(0, 0, 0)',
              }}
            />
            {/* Dark gradient overlay so story text and elements remain clear */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/75 z-10 pointer-events-none" />
          </>
        ) : null}

        {/* STORY HEADER (PROGRESS BAR & USER INFO) */}
        <div className="relative z-20">
          {/* Dynamic Segmented Progress Bar */}
          <div className="w-full h-[2px] mb-3 flex gap-1">
            {Array.from({ length: segmentsCount }).map((_, idx) => {
              const isCompleted = idx < activeIdx - 1;
              const isActive = idx === activeIdx - 1;
              return (
                <div key={idx} className="h-full bg-white/30 flex-1 rounded-full overflow-hidden">
                  {isCompleted && <div className="h-full bg-white w-full rounded-full" />}
                  {isActive && (
                    <div
                      className="h-full bg-white rounded-full transition-all duration-150"
                      style={{ width: `${activeProgress}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* User Info Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Profile Avatar: image if present, blank circle if empty */}
              <div className="w-8 h-8 rounded-full bg-neutral-700/60 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                {avatarUrl && avatarUrl.trim() !== '' ? (
                  <img src={avatarUrl} alt={username || 'username'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-700/60" />
                )}
              </div>
              <span className="text-xs font-semibold text-white tracking-wide">{renderEmojiText(username)}</span>
            </div>

            {/* Close Button (X) */}
            <button type="button" className="text-white opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
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
            <div className="flex items-center gap-0.5 text-sm text-white font-normal truncate">
              <span>{renderEmojiText(currentText || (isId ? "Tulis teks Anda di sini..." : "Your text goes here..."))}</span>
              <span className="w-[1.5px] h-4 bg-white animate-pulse ml-0.5 inline-block shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. iOS KEYBOARD MOCKUP INTERACTIVE */}
      {showKeyboard && (
        <div className={`w-full ${keyboardBg} pt-2 pb-4 px-1 flex flex-col gap-2 z-30 select-none border-none outline-none ring-0 shadow-none shrink-0 -mb-[1px]`}>
          {/* Row 1 */}
          <div className="flex justify-center gap-1.5 w-full px-0.5">
            {row1Keys.map(k => (
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
            {row2Keys.map(k => (
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
            {row3Keys.map(k => (
              <button
                type="button"
                key={k}
                onClick={() => handleKeyPress(k)}
                className={`flex-1 h-[44px] ${keyBg} flex items-center justify-center text-[22px] font-normal cursor-pointer active:scale-95 transition-transform hover:brightness-110`}
              >
                {isShift ? k.toUpperCase() : k}
              </button>
            ))}
            {/* Backspace Key (⌫) */}
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
            {/* iOS Emoji Key */}
            <div className={`w-11 h-[44px] ${specialKeyBg} flex items-center justify-center shrink-0`}>
              <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Spacebar */}
            <button
              type="button"
              onClick={handleSpace}
              className={`flex-1 h-[44px] ${spacebarBg} flex items-center justify-end px-3 text-[11px] font-light text-white/50 tracking-wide cursor-pointer active:scale-95 transition-transform hover:brightness-110`}
            >
              EN ID
            </button>
            <button
              type="button"
              className={`w-[76px] h-[44px] ${specialKeyBg} flex items-center justify-center text-[14px] font-normal ${isDark ? 'text-white' : 'text-black'} cursor-pointer active:scale-95 transition-transform shrink-0`}
            >
              return
            </button>
          </div>

          {/* Bottom Keyboard Bar */}
          <div className="flex items-center justify-between px-6 pt-2 pb-2">
            <svg className={`w-5 h-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9"/>
              <path d="M3.6 9h16.8M3.6 15h16.8"/>
              <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18"/>
            </svg>

            <div className={`w-[140px] h-[5px] ${isDark ? 'bg-white' : 'bg-black'} rounded-full my-0.5`} />

            <svg className={`w-5 h-5 ${isDark ? 'text-white/80' : 'text-black/80'}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

InstagramStoryReplyPreview.displayName = 'InstagramStoryReplyPreview';
