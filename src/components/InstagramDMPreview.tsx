import React, { forwardRef } from 'react';
import { InstagramDMData, InstagramDMMessage } from '../types';
import { IOSEmojiText } from '../utils/iosEmoji';
import { splitEmojiGraphemes } from '../utils/emojiUtils';
import { normalizeColor } from '../utils/colorUtils';
import { INSTAGRAM_DM_PRESETS } from '../data/instagramPresets';
import { InstagramVerifiedBadge } from './Icons';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: InstagramDMData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onUpdateMessageText?: (id: string, newText: string) => void;
  onChange?: (data: InstagramDMData) => void;
}

// Custom iOS SF Symbol-style SVG Icons
const ChevronLeftIcon = () => (
  <svg className="w-6 h-6 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const PhoneCallIcon = () => (
  <svg className="w-5 h-5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const VideoCamIcon = () => (
  <svg className="w-5.5 h-5.5 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="14" height="14" rx="3" />
    <path d="M22 8l-6 4 6 4V8z" />
  </svg>
);

const CameraSolidIcon = ({ color }: { color?: string }) => (
  <svg className="w-5 h-5 fill-current" style={{ color: color || '#ffffff' }} viewBox="0 0 24 24">
    <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z" />
    <path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
  </svg>
);

const SearchSolidIcon = ({ color }: { color?: string }) => (
  <svg className="w-[18px] h-[18px]" style={{ color: color || '#ffffff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="6.2" />
    <line x1="15.2" y1="15.2" x2="20.2" y2="20.2" />
  </svg>
);

const SendPlaneSolidIcon = ({ color, bgColor }: { color?: string; bgColor?: string }) => (
  <svg className="w-[19.5px] h-[19.5px]" style={{ color: color || '#ffffff' }} viewBox="0 0 24 24" fill="none">
    <path d="M4.2 6.8C3.1 6.8 2.5 8.1 3.3 8.9L8.6 13.8L11.2 19.6C11.7 20.7 13.3 20.6 13.7 19.5L20.4 8.6C21 7.6 20.3 6.8 19.1 6.8H4.2Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8.1 14.1L15.3 9.5" stroke={bgColor || '#262626'} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

// High quality, exact Instagram DM Input Bar Icons (consistent stroke and size)
const MicOutlineIcon = () => (
  <svg className="w-[22px] h-[22px] text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
    <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
    <line x1="12" y1="18" x2="12" y2="21.5" />
    <line x1="8" y1="21.5" x2="16" y2="21.5" />
  </svg>
);

const GalleryOutlineIcon = () => (
  <svg className="w-[22px] h-[22px] text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4.5" />
    <circle cx="8" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
    <path d="M4.5 17L8 14L11.5 16.5L15.5 11.5L19.5 17" />
  </svg>
);

const StickerOutlineIcon = () => (
  <svg className="w-[22px] h-[22px] text-current" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 3H16.5C18.9853 3 21 5.01472 21 7.5V13.5C21 13.8978 20.842 14.2794 20.5607 14.5607L14.5607 20.5607C14.2794 20.842 13.8978 21 13.5 21H7.5C5.01472 21 3 18.9853 3 16.5V7.5C3 5.01472 5.01472 3 7.5 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 20.8V16.5C14 15.1193 15.1193 14 16.5 14H20.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8.5" cy="9.5" r="1.25" fill="currentColor" />
    <circle cx="15.5" cy="9.5" r="1.25" fill="currentColor" />
    <path d="M8.5 13.5C9.2 15.2 11.2 16.2 13.2 15.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const PlusCircleOutlineIcon = () => (
  <svg className="w-[22px] h-[22px] text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const VerifiedBadge = ({ type }: { type?: string }) => {
  if (!type || type === 'none') return null;
  return <InstagramVerifiedBadge className="w-3.5 h-3.5 inline-block ml-0.5 shrink-0" />;
};

// --- Sub-component: ProfileHeaderCard (Top Intro Profile Block at Top of Feed) ---
const ProfileHeaderCard: React.FC<{
  data: InstagramDMData;
  isDark: boolean;
}> = ({ data, isDark }) => {
  const { language } = useLanguage();
  const displayName = data.name || data.username || (language === 'id' ? 'Nama' : 'Name');
  const rawUser = data.username || '';
  const cleanUser = rawUser ? (rawUser.startsWith('@') ? rawUser.substring(1) : rawUser) : 'username';
  const followers = data.followersCount || '1.2K';
  const posts = data.postsCount || '42';
  const followersLabel = language === 'id' ? 'pengikut' : 'followers';
  const postsLabel = language === 'id' ? 'postingan' : 'posts';
  const defaultSubtitle = language === 'id'
    ? 'Anda tidak saling mengikuti di Instagram'
    : "You don't follow each other on Instagram";
  const statusLine = data.profileSubtitle || defaultSubtitle;
  const viewProfileBtn = language === 'id' ? 'Lihat profil' : 'View profile';

  const customTextColor = data.useCustomTheme && data.customTextColor
    ? normalizeColor(data.customTextColor)
    : undefined;

  const secondaryColorStyle = data.useCustomTheme && data.customSecondaryTextColor
    ? { color: normalizeColor(data.customSecondaryTextColor) }
    : undefined;

  return (
    <div className="flex flex-col items-center justify-center pt-6 pb-6 px-4 text-center select-none mb-2 w-full">
      {/* 1. Large Circular Avatar (No border/ring) */}
      <div className="relative mb-3">
        <div className={`w-20 h-20 rounded-full overflow-hidden ${
          isDark ? 'bg-neutral-800' : 'bg-slate-200'
        } flex items-center justify-center shrink-0`}>
          {data.avatar && data.avatar.trim() !== '' ? (
            <img src={data.avatar} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-neutral-700 to-neutral-800 flex items-center justify-center text-neutral-200 font-bold text-2xl">
              <IOSEmojiText text={(splitEmojiGraphemes(displayName)[0] || 'IG').toUpperCase()} />
            </div>
          )}
        </div>
        {data.isActiveNow !== false && !data.isGroupChat && (
          <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 z-10" />
        )}
      </div>

      {/* 2. Name (Bold) + Verified Badge */}
      <h2
        className={`text-[16px] font-bold tracking-tight flex items-center justify-center space-x-1 ${
          !data.useCustomTheme ? (isDark ? 'text-white' : 'text-slate-900') : ''
        }`}
        style={{ color: customTextColor }}
      >
        <span><IOSEmojiText text={displayName} /></span>
        <VerifiedBadge type={data.verified} />
      </h2>

      {/* Username line (Regular with @) */}
      <p
        className={`text-[12px] font-normal mt-0.5 ${!data.useCustomTheme ? (isDark ? 'text-neutral-400' : 'text-slate-500') : ''}`}
        style={secondaryColorStyle}
      >
        <IOSEmojiText text={`@${cleanUser}`} />
      </p>

      {/* 3. "Instagram" Label */}
      <p
        className={`text-[12px] font-normal mt-0.5 ${!data.useCustomTheme ? (isDark ? 'text-neutral-400' : 'text-slate-500') : ''}`}
        style={secondaryColorStyle}
      >
        Instagram
      </p>

      {/* 4. Stats Line: {followersCount} followers · {postsCount} posts */}
      <p
        className={`text-[12px] font-normal mt-0.5 ${!data.useCustomTheme ? (isDark ? 'text-neutral-400' : 'text-slate-500') : ''}`}
        style={secondaryColorStyle}
      >
        <IOSEmojiText text={`${followers} ${followersLabel} · ${posts} ${postsLabel}`} />
      </p>

      {/* 5. Relationship Status */}
      <p
        className={`text-[11.5px] mt-1 max-w-[280px] leading-snug ${!data.useCustomTheme ? (isDark ? 'text-neutral-400' : 'text-slate-500') : ''}`}
        style={secondaryColorStyle}
      >
        <IOSEmojiText text={statusLine} />
      </p>

      {/* 6. "View profile" Button */}
      <button
        type="button"
        className={`mt-3.5 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-opacity cursor-pointer shadow-xs ${
          isDark
            ? 'bg-[#262626] text-white hover:bg-[#333333]'
            : 'bg-gray-200 text-slate-900 hover:bg-gray-300'
        }`}
      >
        {viewProfileBtn}
      </button>
    </div>
  );
};

// --- Sub-component 1: Header ---
const Header: React.FC<{ data: InstagramDMData; isDark: boolean }> = ({ data, isDark }) => {
  const { language } = useLanguage();
  const displayName = data.name || data.username || (language === 'id' ? 'Nama' : 'Name');
  const cleanUsername = data.username ? (data.username.startsWith('@') ? data.username : `@${data.username}`) : '@username';
  const isGroup = data.isGroupChat;
  const activeNowLabel = language === 'id' ? 'Sedang aktif' : 'Active now';
  const subtitleText = isGroup
    ? (data.groupMembers?.trim() || 'username, username, username')
    : (data.activeStatusText || (data.isActiveNow !== false ? activeNowLabel : cleanUsername));

  const isCustomActive = Boolean(data.useCustomTheme);

  const activePreset = data.activeThemePreset
    ? INSTAGRAM_DM_PRESETS.find((p) => p.id === data.activeThemePreset)
    : undefined;

  const customHeaderBg = isCustomActive && data.customHeaderBg ? normalizeColor(data.customHeaderBg) : undefined;
  const customHeaderTextColor = isCustomActive && data.customHeaderTextColor
    ? normalizeColor(data.customHeaderTextColor)
    : (isCustomActive && data.customTextColor ? normalizeColor(data.customTextColor) : (isDark ? '#ffffff' : '#000000'));
  const customIconColor = isCustomActive && data.customIconColor
    ? normalizeColor(data.customIconColor)
    : (isCustomActive && activePreset?.iconColor
        ? normalizeColor(activePreset.iconColor)
        : (isDark ? '#ffffff' : '#000000'));

  const secondaryColorStyle = isCustomActive && data.customSecondaryTextColor
    ? { color: normalizeColor(data.customSecondaryTextColor) }
    : (customHeaderTextColor ? { color: customHeaderTextColor, opacity: 0.75 } : undefined);

  return (
    <div
      style={{ backgroundColor: customHeaderBg }}
      className={`flex items-center justify-between px-3 py-2.5 shrink-0 overflow-x-hidden ${
        (!data.useCustomTheme || !data.customHeaderBg) && (isDark ? 'bg-black text-white' : 'bg-white text-slate-900 border-b border-slate-100')
      } z-10 select-none`}
    >
      <div className="flex items-center space-x-2.5 min-w-0">
        <button
          type="button"
          className="p-0.5 hover:opacity-75 transition-opacity cursor-pointer"
          style={{ color: customIconColor }}
        >
          <ChevronLeftIcon />
        </button>

        <div className="flex items-center space-x-2.5 min-w-0 cursor-pointer">
          {/* Avatar with Active Green Dot (No borders/rings) */}
          <div className="relative shrink-0">
            <div className={`w-9 h-9 rounded-full overflow-hidden ${
              isDark ? 'bg-neutral-800' : 'bg-slate-200'
            } flex items-center justify-center`}>
              {data.avatar && data.avatar.trim() !== '' ? (
                <img src={data.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-neutral-700 to-neutral-800 flex items-center justify-center text-neutral-300 font-bold text-xs">
                  <IOSEmojiText
                    text={isGroup ? '👥' : (splitEmojiGraphemes(displayName)[0] || 'IG').toUpperCase()}
                  />
                </div>
              )}
            </div>
            {!isGroup && data.isActiveNow !== false && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 z-10" />
            )}
          </div>

          <div className="flex flex-col min-w-0 leading-tight">
            <div className="flex items-center space-x-1 min-w-0">
              <span
                className="text-[15px] font-bold tracking-tight truncate"
                style={{ color: customHeaderTextColor }}
              >
                <IOSEmojiText text={displayName} />
              </span>
              <VerifiedBadge type={data.verified} />
            </div>
            {subtitleText && (
              <span
                className={`text-[11px] font-normal tracking-tight leading-normal whitespace-normal ${
                  !data.useCustomTheme ? (isDark ? 'text-neutral-400' : 'text-slate-500') : ''
                }`}
                style={secondaryColorStyle}
              >
                <IOSEmojiText text={subtitleText} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center space-x-4 shrink-0 pr-1"
        style={{ color: customIconColor }}
      >
        <button type="button" className="hover:opacity-70 transition-opacity cursor-pointer" title="Audio Call">
          <PhoneCallIcon />
        </button>
        <button type="button" className="hover:opacity-70 transition-opacity cursor-pointer" title="Video Call">
          <VideoCamIcon />
        </button>
      </div>
    </div>
  );
};

// --- Sub-component 2: MediaStack (Fanned Photo Cards - Clean & Rotated) ---
const MediaStack: React.FC<{
  photoStack?: string[];
  photoCount?: number;
  isOutgoing?: boolean;
}> = ({ photoStack, photoCount = 0, isOutgoing = true }) => {
  if (!photoStack || photoStack.length === 0 || photoStack.every((p) => !p)) {
    return null;
  }
  const photos = (photoStack || []).filter((p) => typeof p === 'string' && p.trim() !== '');
  if (photos.length === 0) return null;

  return (
    <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} my-1 w-full overflow-x-hidden`}>
      <div className="relative w-[110px] h-[140px] shrink-0 my-1">
        {photos[2] && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-md transform -rotate-6 -translate-x-2 -translate-y-1 bg-neutral-800 border border-white/10 scale-95">
            <img src={photos[2]} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {photos[1] && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-md transform rotate-4 translate-x-1.5 -translate-y-0.5 bg-neutral-800 border border-white/10 scale-98">
            <img src={photos[1]} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        {photos[0] && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl transform rotate-0 bg-neutral-800 border border-white/10">
            <img src={photos[0]} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-component 3: MessageBubble ---
const MessageBubble: React.FC<{
  msg: InstagramDMMessage;
  data: InstagramDMData;
  isDark: boolean;
  isPrevSame: boolean;
  isNextSame: boolean;
  isLastOutgoing?: boolean;
  isEditing?: boolean;
  editingText?: string;
  onStartEdit?: (id: string, currentText: string) => void;
  onSaveEdit?: (id: string, newText: string) => void;
  onCancelEdit?: () => void;
  onEditingTextChange?: (text: string) => void;
  onChange?: (data: InstagramDMData) => void;
}> = ({
  msg,
  data,
  isDark,
  isPrevSame,
  isNextSame,
  isLastOutgoing,
  isEditing,
  editingText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditingTextChange,
  onChange,
}) => {
  const { language } = useLanguage();
  const [isSeenFocused, setIsSeenFocused] = React.useState(false);
  const isOutgoing = msg.sender === 'outgoing';
  const isSeenVisible = isOutgoing && (msg.showSeen !== undefined
    ? msg.showSeen
    : data.showSeenStatus !== false && Boolean(isLastOutgoing));
  const rawSeenValue = msg.seenText !== undefined && msg.seenText !== '' ? msg.seenText : (data.seenText ?? '');
  const cleanSeenDraft = rawSeenValue === 'Seen 56m ago' || rawSeenValue === 'Dilihat 56m lalu' ? '' : rawSeenValue;
  const effectiveSeenText = cleanSeenDraft.trim() || 'Seen 56m ago';

  // Outgoing Color / Gradient Logic
  const getOutgoingStyle = (): React.CSSProperties => {
    if (data.useCustomTheme && data.customOutgoingBg) {
      const norm = normalizeColor(data.customOutgoingBg);
      return { background: norm, backgroundColor: norm };
    }
    if (!isDark) {
      // Reference Instagram DM light-mode accent.
      return { background: '#a855f7', backgroundColor: '#a855f7' };
    }
    // Dark Mode Default: Vertical Gradient (Top-to-Bottom, 180deg) from Purple to Blue
    return {
      background: 'linear-gradient(180deg, #a855f7 0%, #3b82f6 100%)',
    };
  };

  const getIncomingStyle = (): React.CSSProperties => {
    if (data.useCustomTheme && data.customIncomingBg) {
      const normBg = normalizeColor(data.customIncomingBg);
      const normText = normalizeColor(data.customTextColor);
      return {
        background: normBg,
        backgroundColor: normBg,
        color: normText || (isDark ? '#ffffff' : '#000000'),
      };
    }
    return {};
  };

  const incomingBgClass = isDark ? 'bg-[#262626] text-white' : 'bg-[#eef1f5] text-slate-900';

  // Configurable Spacing & Roundness (calibrated: slider value 0 = 2px visual gap)
  const sameGap = (data.sameSenderGap ?? 0) + 2;
  const diffGap = data.differentSenderGap ?? 6;
  const marginTopVal = isPrevSame ? sameGap : diffGap;
  const roundness = data.bubbleRoundness ?? 22;

  // Dynamic Corner Radius String according to consecutive grouping rules:
  // Standalone: r r r r
  // Right sender (Sent):
  // - Top (first): r r sm r
  // - Middle: r sm sm r
  // - Bottom (last): r sm r r
  // Left sender (Received):
  // - Top (first): r r r sm
  // - Middle: sm r r sm
  // - Bottom (last): sm r r r
  const getBubbleBorderRadius = () => {
    const r = roundness;
    const sm = Math.min(4, r);

    if (isOutgoing) {
      if (!isPrevSame && !isNextSame) {
        return `${r}px ${r}px ${r}px ${r}px`;
      }
      if (!isPrevSame && isNextSame) {
        return `${r}px ${r}px ${sm}px ${r}px`;
      }
      if (isPrevSame && isNextSame) {
        return `${r}px ${sm}px ${sm}px ${r}px`;
      }
      if (isPrevSame && !isNextSame) {
        return `${r}px ${sm}px ${r}px ${r}px`;
      }
    } else {
      if (!isPrevSame && !isNextSame) {
        return `${r}px ${r}px ${r}px ${r}px`;
      }
      if (!isPrevSame && isNextSame) {
        return `${r}px ${r}px ${r}px ${sm}px`;
      }
      if (isPrevSame && isNextSame) {
        return `${sm}px ${r}px ${r}px ${sm}px`;
      }
      if (isPrevSame && !isNextSame) {
        return `${sm}px ${r}px ${r}px ${r}px`;
      }
    }
    return `${r}px`;
  };

  const senderNameText = msg.senderName?.trim() || (data.isGroupChat ? 'username' : (data.name || data.username || 'User'));
  const defaultSenderColor = isDark ? '#ffffff' : '#000000';
  const effectiveSenderColor = msg.senderColor ? normalizeColor(msg.senderColor) : defaultSenderColor;
  const reactionEmoji = msg.reactionEmoji || (msg.isLiked ? '❤️' : '');

  return (
    <div
      style={{ marginTop: `${marginTopVal}px` }}
      className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} w-full`}
    >
      {/* Uppercase Centered Timestamps (e.g. YESTERDAY 12:07 PM) */}
      {msg.time && data.showTimestamps !== false && (
        <div className="text-center my-2 select-none w-full">
          <span
            className={`text-[10.5px] font-semibold tracking-wider uppercase ${
              !data.useCustomTheme ? (isDark ? 'text-neutral-500' : 'text-slate-400') : ''
            }`}
            style={{ color: data.useCustomTheme && data.customSecondaryTextColor ? normalizeColor(data.customSecondaryTextColor) : undefined }}
          >
            <IOSEmojiText text={msg.time} />
          </span>
        </div>
      )}

      {/* Group Chat Sender Name */}
      {!isOutgoing && data.isGroupChat && !isPrevSame && (
        <span
          className="text-[11px] font-semibold mb-0.5 ml-9 select-none"
          style={{ color: effectiveSenderColor }}
        >
          <IOSEmojiText text={senderNameText} />
        </span>
      )}

      {/* Multiple Images Stack (photoCount > 1 or photoStack) */}
      {( (msg.photoCount && msg.photoCount > 1) || (msg.photoStack && msg.photoStack.length > 1) ) && (
        <MediaStack photoStack={msg.photoStack} photoCount={msg.photoCount} isOutgoing={isOutgoing} />
      )}

      {/* Story Reply Message Block */}
      {(msg.isStoryReply || msg.storyReplyImageUrl) && (
        <div className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start ml-9'} my-1 space-y-1 w-full max-w-[84%]`}>
          <span
            className={`text-[11.5px] font-medium leading-tight ${
              !data.useCustomTheme ? (isDark ? 'text-neutral-400' : 'text-slate-500') : ''
            }`}
            style={{ color: data.useCustomTheme && data.customSecondaryTextColor ? normalizeColor(data.customSecondaryTextColor) : undefined }}
          >
            <IOSEmojiText
              text={
                isOutgoing
                  ? (language === 'id' ? 'Anda membalas cerita mereka' : 'You replied to their story')
                  : (language === 'id' ? 'Membalas cerita Anda' : 'Replied to your story')
              }
            />
          </span>
          <div className="flex items-center gap-2 pl-1">
            <div
              style={{
                backgroundColor: msg.replyBarColor || (isDark ? '#6b7280' : '#9ca3af'),
              }}
              className="w-[3.5px] rounded-full self-stretch shrink-0 min-h-[132px]"
            />
            {msg.storyReplyImageUrl && msg.storyReplyImageUrl.trim() !== '' ? (
              <div className="w-[74px] h-[132px] rounded-xl overflow-hidden shadow-sm bg-neutral-800 shrink-0">
                <img
                  src={msg.storyReplyImageUrl.trim()}
                  alt="Story reply preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-[74px] h-[132px] rounded-xl border-2 shrink-0 flex items-center justify-center ${
                isDark ? 'border-white bg-white/5 text-white/60' : 'border-black bg-black/5 text-black/60'
              }`}>
                <span className="text-[9px] font-semibold tracking-tight uppercase opacity-60">Story</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Message or Single Image Bubble */}
      {(msg.text !== undefined || (msg.imageUrl && (!msg.photoCount || msg.photoCount <= 1)) || (!msg.storyReplyImageUrl && (!msg.photoStack || msg.photoStack.length === 0))) && (
        <div className={`flex items-end space-x-2 max-w-[75%] ${isOutgoing ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
          {/* Avatar for Incoming Messages */}
          {!isOutgoing && (
            <div className="w-7 h-7 shrink-0 mb-0.5">
              {!isNextSame ? (
                <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
                  {data.avatar && data.avatar.trim() !== '' ? (
                    <img src={data.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-neutral-700 flex items-center justify-center text-[10px] text-neutral-300 font-bold">
                      <IOSEmojiText text={(splitEmojiGraphemes(senderNameText)[0] || 'IG').toUpperCase()} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-7 h-7" />
              )}
            </div>
          )}

          <div className={`relative group w-fit max-w-full flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
            {/* Quoted Reply Box */}
            {(msg.showReplyQuote || msg.replyToText || msg.replyToSender) && (
              <div className={`mb-1.5 flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} max-w-full`}>
                <span
                  style={{
                    color: msg.replySenderColor || undefined,
                  }}
                  className={`text-[11px] font-medium leading-tight mb-1 px-1 select-none ${
                    !msg.replySenderColor ? (isDark ? 'text-neutral-400' : 'text-neutral-500') : ''
                  }`}
                >
                  <IOSEmojiText
                    text={
                      msg.replyToSender && !msg.replyToSender.toLowerCase().includes('you replied') && !msg.replyToSender.toLowerCase().includes('anda membalas') && !msg.replyToSender.toLowerCase().includes('replied to you') && !msg.replyToSender.toLowerCase().includes('membalas anda')
                        ? msg.replyToSender
                        : isOutgoing
                          ? (language === 'id' ? 'Anda membalas' : 'You replied')
                          : (language === 'id' ? 'Membalas Anda' : 'Replied to you')
                    }
                  />
                </span>
                <div className={`flex items-center gap-1.5 max-w-full ${isOutgoing ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div
                    className={`px-3.5 py-1.5 rounded-[18px] text-[13px] leading-snug w-fit max-w-full break-words select-none ${
                      isDark
                        ? 'bg-[#262626] text-neutral-400 border border-neutral-800/80 shadow-2xs'
                        : 'bg-neutral-200 text-neutral-600 border border-neutral-300/60 shadow-2xs'
                    }`}
                  >
                    <IOSEmojiText text={msg.replyToText || (language === 'id' ? 'Pesan' : 'Message')} />
                  </div>
                  {/* Reply vertical line indicator with rounded pill shape and custom color */}
                  <div
                    style={{
                      backgroundColor: msg.replyBarColor || (isDark ? '#525252' : '#d4d4d4'),
                    }}
                    className="w-[3px] h-[22px] rounded-full shrink-0"
                  />
                </div>
              </div>
            )}

            {/* Attached Single Photo */}
            {msg.imageUrl && msg.imageUrl.trim() !== '' && (!msg.photoCount || msg.photoCount <= 1) && (
              <div
                style={{ borderRadius: getBubbleBorderRadius() }}
                className="mb-1 overflow-hidden max-w-[135px] border border-white/10 shadow-md"
              >
                <img src={msg.imageUrl.trim()} alt="" className="w-full h-auto object-cover max-h-[160px]" />
              </div>
            )}

            {/* Bubble Text */}
            {msg.isRecalled ? (
              <div
                style={{
                  borderRadius: getBubbleBorderRadius(),
                  ...(isOutgoing ? getOutgoingStyle() : getIncomingStyle()),
                }}
                className={`w-fit max-w-full px-3.5 py-2 text-[13.5px] leading-[1.35] tracking-tight font-normal italic opacity-80 break-words flex items-center gap-1.5 select-none shadow-xs ${
                  isOutgoing
                    ? 'text-white'
                    : (!data.useCustomTheme || !data.customIncomingBg ? incomingBgClass : '')
                }`}
              >
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-70">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>
                  <IOSEmojiText
                    text={msg.text && !msg.text.includes('Send a message') && !msg.text.includes('Kirim pesan')
                      ? msg.text
                      : (isOutgoing
                        ? (language === 'id' ? 'Anda membatalkan pengiriman pesan' : 'You unsent a message')
                        : (language === 'id' ? 'Pesan telah dibatalkan' : 'Message unsent'))}
                  />
                </span>
              </div>
            ) : (msg.text !== undefined || (!msg.imageUrl && !msg.storyReplyImageUrl && (!msg.photoStack || msg.photoStack.length === 0))) && (
              <div
                style={{
                  borderRadius: getBubbleBorderRadius(),
                  ...(isOutgoing ? getOutgoingStyle() : getIncomingStyle()),
                }}
                className={`w-fit max-w-full px-4 py-2.5 text-[14.5px] leading-[1.35] tracking-tight font-normal break-words whitespace-pre-wrap h-auto overflow-visible shadow-xs ${
                  isOutgoing
                    ? 'text-white'
                    : (!data.useCustomTheme || !data.customIncomingBg ? incomingBgClass : '')
                }`}
              >
                {isEditing ? (
                  <textarea
                    autoFocus
                    rows={1}
                    value={editingText}
                    onChange={(e) => onEditingTextChange?.(e.target.value)}
                    onBlur={() => onSaveEdit?.(msg.id, editingText || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSaveEdit?.(msg.id, editingText || '');
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        onCancelEdit?.();
                      }
                    }}
                    className="w-full bg-transparent border-b border-dashed border-sky-300 focus:outline-none text-[14.5px] font-sans leading-[1.35] p-0 resize-none text-current min-w-[70px]"
                  />
                ) : (
                  <span
                    onClick={() => onStartEdit?.(msg.id, msg.text || '')}
                    className="cursor-pointer hover:opacity-90 rounded-xs transition-opacity"
                    title={language === 'id' ? 'Klik untuk edit teks langsung' : 'Click to inline edit text'}
                  >
                    <IOSEmojiText text={msg.text?.trim() ? msg.text : (language === 'id' ? 'Kirim pesan' : 'Send a message')} />
                  </span>
                )}
              </div>
            )}

            {/* Reaction badge stays attached to the bubble edge, as in the reference. */}
            {reactionEmoji && (
              <div
                className={`relative -mt-1.5 ${isOutgoing ? 'self-end mr-2' : 'self-start ml-2'} z-20 select-none flex items-center justify-center ${
                  isDark ? 'bg-[#262626] border-neutral-700 text-white shadow-sm' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
                } border rounded-full px-1.5 py-0.5 min-w-[24px] h-[22px] pointer-events-none`}
                aria-label={`Reaction ${reactionEmoji}`}
              >
                <span className="text-[12px] leading-none inline-flex items-center justify-center">
                  <IOSEmojiText text={reactionEmoji} />
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {isSeenVisible && (
        <div className="relative self-end mt-1 pr-1 flex items-center justify-end max-w-[75%]">
          {(!isSeenFocused || !onChange) && (
            <span
              className={`text-[11.5px] font-normal leading-tight tracking-tight select-none text-right ${
                !data.useCustomTheme ? (isDark ? 'text-neutral-400' : 'text-slate-500') : ''
              }`}
              style={{ color: data.useCustomTheme && data.customSecondaryTextColor ? normalizeColor(data.customSecondaryTextColor) : undefined }}
            >
              <IOSEmojiText text={effectiveSeenText} />
            </span>
          )}
          {onChange && (
            <input
              type="text"
              value={cleanSeenDraft}
              onChange={(event) => {
                const value = event.target.value;
                const updatedMessages = (data.messages || []).map((item) => item.id === msg.id ? { ...item, showSeen: true, seenText: value } : item);
                onChange({ ...data, seenText: value, messages: updatedMessages });
              }}
              onFocus={() => setIsSeenFocused(true)}
              onBlur={() => setIsSeenFocused(false)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur(); }}
              placeholder="Seen 56m ago"
              className={isSeenFocused
                ? `bg-transparent border-none outline-none text-[11.5px] font-normal leading-tight tracking-tight text-right py-0 m-0 p-0 focus:ring-0 placeholder:opacity-60 no-drag w-36 ${!data.useCustomTheme ? (isDark ? 'text-neutral-300' : 'text-slate-600') : ''}`
                : 'absolute inset-0 w-full h-full opacity-0 cursor-text z-10 no-drag'}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Helper to ensure color is strictly opaque / solid
const ensureSolidColor = (colorStr?: string): string | undefined => {
  if (!colorStr) return undefined;
  const trimmed = colorStr.trim();
  if (trimmed.startsWith('rgba(')) {
    const match = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (match) {
      return `rgb(${match[1]}, ${match[2]}, ${match[3]})`;
    }
  }
  return normalizeColor(trimmed);
};

// --- Sub-component 4: InputBar ---
const InputBar: React.FC<{ data: InstagramDMData; isDark: boolean; onChange?: (data: InstagramDMData) => void }> = ({ data, isDark, onChange }) => {
  const { language } = useLanguage();
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const rawBottomText = data.bottomInputText ?? '';
  const isDefaultPlaceholder = rawBottomText === 'Message...' || rawBottomText === 'Kirim pesan...';
  const draftValue = isDefaultPlaceholder ? '' : rawBottomText;
  const hasDraftText = draftValue.trim().length > 0;
  const placeholderText = 'Message...';

  const isCustomActive = Boolean(data.useCustomTheme);

  const activePreset = (isCustomActive && data.activeThemePreset)
    ? INSTAGRAM_DM_PRESETS.find((p) => p.id === data.activeThemePreset)
    : undefined;

  // Solid, non-transparent background color calculation:
  // 1. When Custom Theme Mode is UNCHECKED (isCustomActive === false):
  //    Completely decoupled from Chat Theme Presets & Color Customization!
  //    Directly and strictly follows the main Theme Mode (Dark: #262626, Light: #efefef).
  // 2. When Custom Theme Mode is CHECKED (isCustomActive === true):
  //    Respects customPillBg, active preset pillBg/headerBg, or customHeaderBg.
  let barBgColor: string;
  let cameraBgColor: string;
  let cameraIconColor: string;
  let customIconColor: string;
  let placeholderColor: string;

  if (isCustomActive) {
    if (data.customPillBg) {
      const solidCustomPill = ensureSolidColor(data.customPillBg);
      barBgColor = solidCustomPill || (isDark ? '#262626' : '#efefef');
    } else if (activePreset && (activePreset.pillBg || activePreset.headerBg)) {
      barBgColor = activePreset.pillBg || activePreset.headerBg || (activePreset.themeMode === 'dark' ? '#262626' : '#efefef');
    } else if (data.customHeaderBg) {
      const solidHeader = ensureSolidColor(data.customHeaderBg);
      barBgColor = solidHeader || (isDark ? '#262626' : '#efefef');
    } else {
      barBgColor = isDark ? '#262626' : '#efefef';
    }

    const rawCameraColor = data.customCameraBg || activePreset?.cameraBg || activePreset?.iconColor || '#0095f6';
    cameraBgColor = normalizeColor(rawCameraColor) || '#0095f6';

    const rawCameraIconColor = data.customCameraIconColor || activePreset?.cameraIconColor || '#ffffff';
    cameraIconColor = normalizeColor(rawCameraIconColor) || '#ffffff';

    customIconColor = data.customIconColor
      ? normalizeColor(data.customIconColor)
      : (activePreset?.iconColor
          ? normalizeColor(activePreset.iconColor)
          : (isDark ? '#ffffff' : '#262626'));

    const rawPlaceholderColor = data.customSecondaryTextColor
      ? data.customSecondaryTextColor
      : (activePreset?.secondaryTextColor
          ? activePreset.secondaryTextColor
          : (isDark ? '#a1a1aa' : '#6b7280'));
    placeholderColor = normalizeColor(rawPlaceholderColor) || (isDark ? '#a1a1aa' : '#6b7280');
  } else {
    // Native Instagram DM styling strictly following Theme Mode:
    // Dark: solid #262626 bar, white icons (#ffffff), subtle light-gray placeholder (#a1a1aa)
    // Light: solid #efefef bar, dark icons (#262626), subtle dark-gray placeholder (#6b7280)
    // Reference DM camera accent.
    barBgColor = isDark ? '#262626' : '#efefef';
    cameraBgColor = '#a855f7';
    cameraIconColor = '#ffffff';
    customIconColor = isDark ? '#ffffff' : '#262626';
    placeholderColor = isDark ? '#a1a1aa' : '#6b7280';
  }

  const activeTextColor = isCustomActive && data.customTextColor
    ? normalizeColor(data.customTextColor)
    : activePreset?.textColor
      ? normalizeColor(activePreset.textColor)
      : isDark ? '#ffffff' : '#111827';

  return (
    <div
      className="shrink-0 pt-0.5 pb-1 px-1.5 select-none w-full relative z-10 bg-transparent"
    >
      <div
        style={{ backgroundColor: barBgColor }}
        className={`flex items-center justify-between w-full min-h-[38px] px-1.5 py-0.5 rounded-full transition-all duration-150 shadow-xs border ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.04]'
        }`}
      >
        {/* Camera changes to Search while a draft is present. */}
        <div className="flex items-center space-x-2 min-w-0 flex-1 pr-1">
          <button
            type="button"
            style={{ backgroundColor: cameraBgColor }}
            className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-white shrink-0 cursor-pointer shadow-xs transition-colors hover:opacity-90 self-center"
            title={hasDraftText ? 'Search' : 'Camera'}
          >
            {hasDraftText ? <SearchSolidIcon color={cameraIconColor} /> : <CameraSolidIcon color={cameraIconColor} />}
          </button>
          <div className="relative flex-1 min-w-0 flex items-center">
            {(!isInputFocused || !onChange) && (
              <span className="text-[13.5px] font-normal select-none tracking-tight whitespace-nowrap truncate max-w-full leading-none py-0.5 flex-1" style={{ color: hasDraftText ? activeTextColor : placeholderColor }}>
                <IOSEmojiText text={draftValue || placeholderText} />
              </span>
            )}
            {onChange && (
              <input
                type="text"
                value={draftValue}
                onChange={(event) => onChange({ ...data, bottomInputText: event.target.value })}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === 'Escape') event.currentTarget.blur(); }}
                placeholder={placeholderText}
                style={{ color: hasDraftText ? activeTextColor : placeholderColor }}
                className={isInputFocused
                  ? 'w-full bg-transparent border-none outline-none text-[13.5px] font-normal tracking-tight leading-none py-0.5 m-0 p-0 focus:ring-0 placeholder:opacity-60 no-drag'
                  : 'absolute inset-0 w-full h-full opacity-0 cursor-text z-10 no-drag'}
              />
            )}
          </div>
        </div>

        {hasDraftText ? (
          <button type="button" style={{ backgroundColor: cameraBgColor }} className="h-7.5 px-3 min-w-[42px] rounded-full flex items-center justify-center text-white shrink-0 cursor-pointer shadow-xs transition-all hover:opacity-90" title="Send">
            <SendPlaneSolidIcon color={cameraIconColor} bgColor={cameraBgColor} />
          </button>
        ) : (
        <div className="flex items-center space-x-1 shrink-0 pr-0.5" style={{ color: customIconColor }}>
          <button
            type="button"
            className="p-0.5 transition-opacity opacity-100 cursor-pointer shrink-0 hover:opacity-80"
            title="Voice Note"
          >
            <MicOutlineIcon />
          </button>
          <button
            type="button"
            className="p-0.5 transition-opacity opacity-100 cursor-pointer shrink-0 hover:opacity-80"
            title="Gallery"
          >
            <GalleryOutlineIcon />
          </button>
          <button
            type="button"
            className="p-0.5 transition-opacity opacity-100 cursor-pointer shrink-0 hover:opacity-80"
            title="Stickers"
          >
            <StickerOutlineIcon />
          </button>
          <button
            type="button"
            className="p-0.5 transition-opacity opacity-100 cursor-pointer shrink-0 hover:opacity-80"
            title="More"
          >
            <PlusCircleOutlineIcon />
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-component 5: Message Request Action Block (Adaptive Theme) ---
const MessageRequestPrompt: React.FC<{
  data: InstagramDMData;
  isDark: boolean;
}> = ({ data, isDark }) => {
  const { language } = useLanguage();
  const displayName = data.name || data.username || (language === 'id' ? 'Pengguna' : 'User');
  const rawUser = data.username || '';
  const cleanUser = rawUser ? (rawUser.startsWith('@') ? rawUser : `@${rawUser}`) : '';

  return (
    <div className={`shrink-0 p-3.5 select-none w-full border-t ${
      isDark ? 'border-neutral-800 bg-black text-white' : 'border-slate-200 bg-white text-slate-900'
    } z-10 text-center flex flex-col justify-center items-center`}>
      <p className="text-[13px] font-bold tracking-tight">
        <IOSEmojiText
          text={language === 'id'
            ? `Terima permintaan pesan dari ${displayName}${cleanUser ? ` (${cleanUser})` : ''}?`
            : `Accept message request from ${displayName}${cleanUser ? ` (${cleanUser})` : ''}?`}
        />
      </p>
      <p className={`text-[11px] font-normal leading-snug max-w-[320px] mt-1 ${
        isDark ? 'text-neutral-400' : 'text-slate-500'
      }`}>
        {language === 'id'
          ? "Jika Anda menerima, mereka juga dapat menelepon Anda dan melihat info seperti status aktivitas dan kapan Anda telah membaca pesan."
          : "If you accept, they will also be able to call you and see info such as your activity status and when you've read messages."}
      </p>

      {/* Adaptive Theme Buttons */}
      <div className="flex items-center justify-between space-x-2 mt-3 w-full max-w-[340px]">
        <button
          type="button"
          className={`${
            isDark ? 'bg-[#262626] hover:bg-[#333333]' : 'bg-gray-200 hover:bg-gray-300'
          } px-3 py-2.5 rounded-xl flex-1 font-semibold text-center text-[13px] text-red-500 shadow-xs cursor-pointer transition-colors`}
        >
          {language === 'id' ? 'Blokir' : 'Block'}
        </button>
        <button
          type="button"
          className={`${
            isDark ? 'bg-[#262626] hover:bg-[#333333]' : 'bg-gray-200 hover:bg-gray-300'
          } px-3 py-2.5 rounded-xl flex-1 font-semibold text-center text-[13px] text-red-500 shadow-xs cursor-pointer transition-colors`}
        >
          {language === 'id' ? 'Hapus' : 'Delete'}
        </button>
        <button
          type="button"
          className={`${
            isDark ? 'bg-[#262626] hover:bg-[#333333] text-white' : 'bg-gray-200 hover:bg-gray-300 text-slate-900'
          } px-3 py-2.5 rounded-xl flex-1 font-semibold text-center text-[13px] shadow-xs cursor-pointer transition-colors`}
        >
          {language === 'id' ? 'Terima' : 'Accept'}
        </button>
      </div>
    </div>
  );
};

// --- MAIN PREVIEW COMPONENT ---
export const InstagramDMPreview = forwardRef<HTMLDivElement, Props>(
  ({ data, previewRef, onUpdateMessageText, onChange }, ref) => {
    const targetRef = previewRef || ref;
    const isDark = data.theme !== 'light';
    const messages = data.messages || [];

    // Inline Editing State
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editingText, setEditingText] = React.useState<string>('');

    const handleStartEditing = (msgId: string, currentText: string) => {
      setEditingId(msgId);
      setEditingText(currentText || '');
    };

    const handleSaveEditing = (msgId: string, newText: string) => {
      if (onUpdateMessageText) {
        onUpdateMessageText(msgId, newText);
      } else if (onChange) {
        const updated = {
          ...data,
          messages: (data.messages || []).map((m) =>
            m.id === msgId ? { ...m, text: newText } : m
          ),
        };
        onChange(updated);
      }
      setEditingId(null);
    };

    const handleCancelEditing = () => {
      setEditingId(null);
      setEditingText('');
    };

    // Aspect Ratio Class Mapping
    const getAspectRatioClass = () => {
      const ratio = data.aspectRatio || '4:5';
      if (ratio === '1:1') return 'aspect-square';
      if (ratio === '4:5') return 'aspect-[4/5]';
      return 'aspect-[9/16]'; // 9:16 standard mobile
    };

    const getCanvasBackgroundStyle = (): React.CSSProperties => {
      if (data.customWallpaper) {
        const safeWallpaperUrl = data.customWallpaper.replace(/"/g, '\\"');
        return {
          backgroundImage: `url("${safeWallpaperUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          imageRendering: 'auto',
          filter: 'none',
          WebkitFilter: 'none',
        };
      }
      if (data.useCustomTheme && data.customBgColor) {
        return {
          background: data.customBgColor,
        };
      }
      return {
        background: isDark ? '#000000' : '#fafafa',
      };
    };

    return (
      <div
        ref={targetRef}
        id="preview-target"
        style={{
          fontFamily:
            '"Apple Color Emoji", "SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
          borderRadius: 'var(--preview-corner-radius, 0px)',
          ...getCanvasBackgroundStyle(),
          color: data.useCustomTheme && data.customTextColor ? data.customTextColor : undefined,
        }}
        className={`w-[380px] min-w-[380px] max-w-[380px] shrink-0 ${getAspectRatioClass()} mx-auto overflow-hidden shadow-2xl border-none outline-none relative select-none flex flex-col justify-between transition-all duration-200 overflow-x-hidden`}
      >
        {/* 1. Instagram iOS DM Header */}
        <Header data={data} isDark={isDark} />

        {/* 2. Unified Scroll Container for Top Profile Card & Chat Messages Feed */}
        <div
          data-chat-scroll="true"
          className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full px-3 py-2 flex flex-col justify-start z-10 touch-pan-y"
        >
          {/* Top Intro Profile Block */}
          {data.showProfileCard === true && (
            <ProfileHeaderCard data={data} isDark={isDark} />
          )}

          {/* Messages Feed */}
          <div className="flex flex-col justify-end min-h-min mt-auto w-full">
            {(() => {
              const lastOutgoingIndex = messages.reduce(
                (lastIndex, message, messageIndex) => message.sender === 'outgoing' ? messageIndex : lastIndex,
                -1,
              );

              return messages.map((msg, index) => {
              const isPrevSame = index > 0 && messages[index - 1].sender === msg.sender;
              const isNextSame =
                index < messages.length - 1 && messages[index + 1].sender === msg.sender;

              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  data={data}
                  isDark={isDark}
                  isPrevSame={isPrevSame}
                  isNextSame={isNextSame}
                  isLastOutgoing={index === lastOutgoingIndex}
                  isEditing={editingId === msg.id}
                  editingText={editingId === msg.id ? editingText : undefined}
                  onStartEdit={handleStartEditing}
                  onSaveEdit={handleSaveEditing}
                  onCancelEdit={handleCancelEditing}
                  onEditingTextChange={setEditingText}
                  onChange={onChange}
                />
              );
              });
            })()}
          </div>
        </div>

        {/* 3. Bottom Action Bar (Message Request Action Block or Normal Input Bar) */}
        <div className="z-10 w-full overflow-x-hidden">
          {data.showMessageRequestPrompt ? (
            <MessageRequestPrompt data={data} isDark={isDark} />
          ) : (
            <InputBar data={data} isDark={isDark} onChange={onChange} />
          )}
        </div>
      </div>
    );
  }
);

InstagramDMPreview.displayName = 'InstagramDMPreview';
