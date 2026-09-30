import React from 'react';
import { InstagramActivityData, InstagramActivityNotification } from '../../../types';
import { renderFormattedTextWithAppleEmojis } from '../../../utils/emojiUtils';
import { useLanguage } from '../../../context/LanguageContext';
import {
  ChevronRight,
  Home,
  Search,
  PlusSquare,
  Heart,
  ChevronLeft,
} from 'lucide-react';

interface Props {
  data: InstagramActivityData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const InstagramActivityPreview: React.FC<Props> = ({ data, previewRef }) => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const {
    theme = 'light',
    aspectRatio = '4:5',
    showFollowRequests = false,
    followRequestsSubtext = '',
    followRequestsAvatars = [],
    followRequestsUnread = false,
    userAvatar = '',
    notifications = [],
  } = (data || {}) as any;

  const isDark = theme === 'dark';

  const genericSilhouetteAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2327272a"/><circle cx="50" cy="38" r="18" fill="%2371717a"/><path d="M20 88c0-18 13.4-30 30-30s30 12 30 30z" fill="%2371717a"/></svg>`;
  const genericThumbnailPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%2327272a"/><rect x="25" y="25" width="50" height="50" rx="6" fill="%233f3f46"/><circle cx="40" cy="40" r="6" fill="%2371717a"/><path d="M30 65l12-15 8 10 10-13 10 18z" fill="%2371717a"/></svg>`;

  const avatar1 = (followRequestsAvatars[0] && followRequestsAvatars[0].trim() !== '') ? followRequestsAvatars[0] : genericSilhouetteAvatar;
  const avatar2 = (followRequestsAvatars[1] && followRequestsAvatars[1].trim() !== '') ? followRequestsAvatars[1] : genericSilhouetteAvatar;
  const userNavAvatar = (userAvatar && userAvatar.trim() !== '') ? userAvatar : genericSilhouetteAvatar;

  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square max-w-[420px]';
      case '4:5':
        return 'aspect-[4/5] max-w-[420px]';
      case '9:16':
      default:
        return 'aspect-[9/16] max-w-[400px] min-h-[680px]';
    }
  };

  // Group notifications by section or render section breaks
  let lastSection = '';

  // Helper to parse and highlight @mentions with Instagram blue styling while retaining Apple emojis
  const renderFormattedActivityText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, idx) => {
      if (part && part.startsWith('@')) {
        return (
          <span
            key={idx}
            className={`${
              isDark ? 'text-[#3897f0]' : 'text-[#00376b]'
            } font-medium hover:underline cursor-pointer`}
          >
            {renderFormattedTextWithAppleEmojis(part)}
          </span>
        );
      }
      return <React.Fragment key={idx}>{renderFormattedTextWithAppleEmojis(part)}</React.Fragment>;
    });
  };

  return (
    <div
      ref={previewRef}
      id="export-instagram-activity"
      className="w-[380px] min-w-[380px] max-w-[380px] mx-auto p-0 bg-transparent shrink-0"
    >
      <div
        id="instagram-activity-preview-card"
        style={{
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className={`w-full overflow-y-auto border ${
          isDark ? 'bg-black text-white border-zinc-900' : 'bg-white text-black border-slate-200'
        } font-sans select-none relative shadow-2xl ${getAspectRatioClasses()} flex flex-col justify-between`}
      >
        {/* TOP CONTENT AREA */}
        <div className="flex-1 flex flex-col">
          {/* 1. TOP HEADER */}
          <div className={`relative flex items-center justify-center px-4 py-3.5 border-b sticky top-0 z-10 ${
            isDark ? 'border-neutral-900 bg-black' : 'border-slate-100 bg-white'
          }`}>
            <button type="button" className={`absolute left-4 p-1 ${isDark ? 'text-white' : 'text-black'}`}>
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>
            <h1 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isId ? 'Notifikasi' : 'Notifications'}
            </h1>
          </div>

          {/* MAIN SCROLLABLE LIST AREA */}
          <div className="flex-1 py-1">
            {/* 2. FOLLOW REQUESTS SECTION (TOP ROW) */}
            {showFollowRequests && (
              <div className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                isDark ? 'hover:bg-neutral-900/50 border-b border-neutral-900/60' : 'hover:bg-slate-50 border-b border-slate-100'
              }`}>
                {/* Left Side: Stacked Avatars */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="relative w-11 h-11 shrink-0">
                    {/* Background Avatar (avatar 2) */}
                    <img
                      src={avatar2}
                      alt="Follow request user 2"
                      className={`absolute bottom-0 right-0 w-8 h-8 rounded-full object-cover border-2 ${
                        isDark ? 'border-black' : 'border-white'
                      }`}
                    />
                    {/* Foreground Avatar (avatar 1) */}
                    <img
                      src={avatar1}
                      alt="Follow request user 1"
                      className={`absolute top-0 left-0 w-8 h-8 rounded-full object-cover border-2 z-10 ${
                        isDark ? 'border-black' : 'border-white'
                      }`}
                    />
                  </div>

                  {/* Middle Text */}
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {isId ? 'Permintaan mengikuti' : 'Follow requests'}
                    </span>
                    <span className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
                      {renderFormattedActivityText(followRequestsSubtext || (isId ? 'Setujui atau abaikan permintaan' : 'Approve or ignore requests'))}
                    </span>
                  </div>
                </div>

                {/* Right Side: Blue Unread Dot & Chevron */}
                <div className="flex items-center space-x-2 shrink-0 pl-2">
                  {followRequestsUnread && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                  <ChevronRight className={`w-5 h-5 ${isDark ? 'text-neutral-500' : 'text-slate-400'}`} />
                </div>
              </div>
            )}

            {/* 3. DYNAMIC NOTIFICATION ROWS */}
            {(() => {
              const SECTION_ORDER: Record<string, number> = {
                'New': 1,
                'Baru': 1,
                'Today': 2,
                'Hari ini': 2,
                'This week': 3,
                'Minggu ini': 3,
                'This Week': 3,
                'This month': 4,
                'Bulan ini': 4,
                'This Month': 4,
                'Earlier': 5,
                'Sebelumnya': 5,
              };

              const sortedNotifications = [...notifications].sort((a, b) => {
                const rankA = SECTION_ORDER[a.section || 'Today'] ?? 99;
                const rankB = SECTION_ORDER[b.section || 'Today'] ?? 99;
                return rankA - rankB;
              });

              return sortedNotifications.map((notif: InstagramActivityNotification, idx: number) => {
                const currentSection = notif.section || (isId ? 'Hari ini' : 'Today');
                const showSectionHeader = currentSection && currentSection !== lastSection;
                if (showSectionHeader) {
                  lastSection = currentSection;
                }

                const isFollowRequestType = notif.type === 'follow_request';
                const isFollowType = notif.type === 'follow';
                const isCommentType = notif.type === 'comment';
                const isMentionType = notif.type === 'mention';
                const isLikeType = notif.type === 'like';

                const isFollowingState = notif.isFollowing || false;
                const buttonLabel = isFollowingState
                  ? (isId ? 'Mengikuti' : 'Following')
                  : (notif.buttonText || (isFollowRequestType ? (isId ? 'Konfirmasi' : 'Confirm') : (isId ? 'Ikuti balik' : 'Follow back')));
                const notifAvatar = (notif.avatarUrl && notif.avatarUrl.trim() !== '') ? notif.avatarUrl.trim() : genericSilhouetteAvatar;
                const thumbnailSrc = (notif.postThumbnail && notif.postThumbnail.trim() !== '') ? notif.postThumbnail.trim() : genericThumbnailPlaceholder;

                // Format action text based on notification type mapping
                let renderActionText = notif.actionText || '';
                if (isFollowType) {
                  renderActionText = isId ? 'mulai mengikuti Anda.' : 'started following you.';
                } else if (isFollowRequestType) {
                  renderActionText = isId ? 'meminta untuk mengikuti Anda.' : 'requested to follow you.';
                } else if (isCommentType) {
                  const text = (notif.actionText || 'Awesome post! 🔥').trim();
                  if (text.toLowerCase().startsWith('commented on your post') || text.toLowerCase().startsWith('mengomentari')) {
                    renderActionText = text;
                  } else {
                    renderActionText = isId ? `mengomentari: ${text}` : `commented on your post: ${text}`;
                  }
                } else if (isMentionType) {
                  const text = (notif.actionText || '@you check this out!').trim();
                  if (
                    text.toLowerCase().startsWith('mentioned you in a photo') ||
                    text.toLowerCase().startsWith('mentioned you in a comment') ||
                    text.toLowerCase().startsWith('menyebut anda')
                  ) {
                    renderActionText = text;
                  } else {
                    renderActionText = isId ? `menyebut Anda dalam foto: ${text}` : `mentioned you in a photo: ${text}`;
                  }
                } else if (isLikeType) {
                  renderActionText = notif.actionText || (isId ? 'menyukai foto Anda.' : 'liked your photo.');
                }

                return (
                  <React.Fragment key={notif.id || `notif-${idx}`}>
                    {/* SECTION HEADER (TIME SEPARATOR) */}
                    {showSectionHeader && (
                      <div className="px-4 pt-4 pb-2">
                        <h2 className={`text-sm font-bold tracking-tight ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          {renderFormattedTextWithAppleEmojis(currentSection)}
                        </h2>
                      </div>
                    )}

                    {/* NOTIFICATION ITEM ROW */}
                    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                      isDark ? 'hover:bg-neutral-900/40' : 'hover:bg-slate-50'
                    }`}>
                      {/* Left: Avatar (Optional Story Ring) */}
                      <div className="shrink-0 relative">
                        {notif.hasStory ? (
                          <div className="p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-full">
                            <div className={`p-[1.5px] rounded-full ${isDark ? 'bg-black' : 'bg-white'}`}>
                              <img
                                src={notifAvatar}
                                alt={notif.username}
                                className="w-11 h-11 sm:w-11 sm:h-11 rounded-full object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={notifAvatar}
                            alt={notif.username}
                            className="w-11 h-11 sm:w-11 sm:h-11 rounded-full object-cover"
                          />
                        )}
                      </div>

                      {/* Middle: Content Text */}
                      <div className="flex-1 min-w-0 pr-1">
                        <p className={`text-xs sm:text-[13px] leading-tight break-words ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}>
                          <span className="font-bold mr-1">{renderFormattedTextWithAppleEmojis(notif.username || 'username')}</span>
                          <span>{renderFormattedActivityText(renderActionText)}</span>
                          <span className={`ml-1.5 text-xs font-normal ${
                            isDark ? 'text-neutral-400' : 'text-slate-500'
                          }`}>
                            {renderFormattedTextWithAppleEmojis(notif.timestamp || '3m')}
                          </span>
                        </p>
                      </div>

                      {/* Right Side: Conditional Action Elements */}
                      <div className="shrink-0 flex items-center pl-1">
                        {isFollowRequestType ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                            >
                              {renderFormattedTextWithAppleEmojis(notif.buttonText || 'Confirm')}
                            </button>
                            <button
                              type="button"
                              className={`px-3.5 py-1.5 font-semibold text-xs rounded-lg border transition-colors shadow-xs cursor-pointer ${
                                isDark
                                  ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                                  : 'bg-white text-black border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {renderFormattedTextWithAppleEmojis(notif.secondarySubtext || 'Delete')}
                            </button>
                          </div>
                        ) : isFollowType ? (
                          <div className="flex flex-col items-end">
                            <button
                              type="button"
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isFollowingState
                                  ? isDark
                                    ? 'bg-black border border-neutral-700 text-white hover:bg-neutral-900'
                                    : 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-100'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              {renderFormattedTextWithAppleEmojis(buttonLabel)}
                            </button>
                          </div>
                        ) : (
                          /* Thumbnail image for likes/mentions/comments */
                          <img
                            src={thumbnailSrc}
                            alt="Post thumbnail"
                            className={`w-11 h-11 rounded-md object-cover border ${
                              isDark ? 'border-neutral-800' : 'border-slate-200'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>
        </div>

        {/* 5. BOTTOM NAVIGATION BAR */}
        <div className={`sticky bottom-0 z-20 flex items-center justify-around py-3 px-2 border-t ${
          isDark ? 'bg-black border-neutral-900' : 'bg-white border-slate-200'
        }`}>
          {/* Home Tab */}
          <button type="button" className={`p-1 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}>
            <Home className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Search Tab */}
          <button type="button" className={`p-1 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}>
            <Search className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Add (+) Tab */}
          <button type="button" className={`p-1 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-slate-500 hover:text-black'}`}>
            <PlusSquare className="w-6 h-6 stroke-[2]" />
          </button>

          {/* Activity Tab (Solid Heart with a tiny red dot below it indicating active state) */}
          <button type="button" className="p-1 relative flex flex-col items-center">
            <Heart className={`w-6 h-6 stroke-[2] fill-current ${isDark ? 'text-white' : 'text-black'}`} />
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute -bottom-1" />
          </button>

          {/* Profile Tab */}
          <button type="button" className="p-0.5">
            <img
              src={userNavAvatar}
              alt="User profile"
              className={`w-6 h-6 rounded-full object-cover border ${
                isDark ? 'border-white/80' : 'border-slate-800'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
