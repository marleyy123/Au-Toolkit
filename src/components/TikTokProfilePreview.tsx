import React from 'react';
import { TikTokProfileData } from '../types';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';
import { renderFormattedTextWithAppleEmojis } from '../utils/emojiUtils';
import { TikTokVerifiedBadge } from './Icons';
import {
  ArrowLeft,
  Bell,
  Play,
  UserPlus,
  Radio,
  Send,
  ChevronDown,
} from 'lucide-react';

interface Props {
  data: TikTokProfileData;
  onChange?: (updated: TikTokProfileData) => void;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

// Custom TikTok Curved Right Arrow Share Icon SVG
const TikTokShareArrowIcon: React.FC<{ className?: string }> = ({ className = 'w-5.5 h-5.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9l6 6-6 6" />
    <path d="M4 4v7a4 4 0 0 0 4 4h12" />
  </svg>
);

// Custom TikTok Grid (3 columns vertical dashed lines + dropdown triangle)
const TikTokGridTabIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-5' }) => (
  <svg
    className={`shrink-0 ${className}`}
    viewBox="0 0 28 24"
    fill="none"
  >
    {/* 6 Segmen Garis Vertikal (3 Kolom, 2 Baris) */}
    <path
      d="M5 4v6m0 4v6M11 4v6m0 4v6M17 4v6m0 4v6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Segitiga Dropdown (Solid) di Kanan */}
    <path d="M22 12l5 0l-2.5 3z" fill="currentColor" />
  </svg>
);

// Custom TikTok Shop Tab Icon (Taller, sleek official TikTok Shop bag silhouette)
const TikTokShopTabIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M 6 20 h 12 c 1.5 0 2.5 -0.8 2.8 -2.2 l 1 -8.8 c 0.2 -1.5 -0.8 -2.5 -2.3 -2.5 H 4.5 c -1.5 0 -2.5 1 -2.3 2.5 l 1 8.8 C 3.5 19.2 4.5 20 6 20 Z" />
    <path d="M 9 9 V 6.5 a 3 3 0 0 1 6 0 V 9" />
  </svg>
);

// Custom Repost Icon (Exact replica of vertical repost arrows icon)
const TikTokRepostIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3.5 6.5 6 4 8.5 6.5" />
    <path d="M6 4v13a3 3 0 0 0 3 3h4.5" />
    <polyline points="15.5 17.5 18 20 20.5 17.5" />
    <path d="M18 20V7a3 3 0 0 0-3-3h-4.5" />
  </svg>
);

export const TikTokProfilePreview: React.FC<Props> = ({ data, onChange, previewRef }) => {
  const {
    profileName = '',
    handle = '',
    avatarUrl = '',
    followingCount = '',
    followersCount = '',
    likesCount = '',
    bio = '',
    linkUrl = '',
    showOrders = false,
    showQnA = false,
    showStoryRing = false,
    isFollowing = false,
    showHighlights = false,
    highlights = [],
    activeTab = 'grid',
    videos = [],
    theme = 'light',
  } = (data || {}) as any;

  const isDark = theme === 'dark';

  const userAvatar = (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') ? avatarUrl.trim() : DEFAULT_AVATAR;

  const handleToggleFollow = () => {
    if (onChange) {
      onChange({ ...data, isFollowing: !isFollowing });
    }
  };

  return (
    <div
      ref={previewRef}
      id="export-tiktok-profile"
      className="w-[380px] min-w-[380px] max-w-[380px] mx-auto p-0 bg-transparent shrink-0"
    >
      <div
        id="tiktok-profile-preview-card"
        style={{
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className={`w-full overflow-hidden border ${
          isDark
            ? 'bg-black text-white border-zinc-800'
            : 'bg-white text-gray-900 border-gray-200 shadow-xl'
        } font-sans select-none relative`}
      >
        {/* 1. Top Bar (Header) */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back Arrow Icon */}
          <button
            type="button"
            className={`p-1 hover:opacity-75 cursor-pointer ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Right: Bell Icon & Share Curved Arrow Icon */}
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className={`p-1 hover:opacity-75 cursor-pointer ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <Bell className="w-5.5 h-5.5" />
            </button>
            <button
              type="button"
              className={`p-1 hover:opacity-75 cursor-pointer ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <TikTokShareArrowIcon className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container for Profile Details */}
        <div className="px-5 pt-1 pb-3 space-y-3.5">
          {/* 2. Profile Header Area (Flexbox: Left Name/Stats + Right Avatar) */}
          <div className="flex items-start justify-between">
            {/* Left Side: Name, Handle, & Stats aligned left */}
            <div className="flex-1 pr-3 space-y-1 text-left">
              {/* Profile Name (Bold, Large) */}
              <h1
                className={`text-xl font-bold tracking-tight leading-tight ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
              >
                {renderFormattedTextWithAppleEmojis(profileName || 'username')}
              </h1>

              {/* Username Handle (Grey color right below name with verified badge) */}
              <div className="flex items-center space-x-1">
                <p
                  className={`text-xs font-medium ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {renderFormattedTextWithAppleEmojis(handle ? (handle.startsWith('@') ? handle : `@${handle}`) : '@username')}
                </p>
                {data.isVerified && (
                  <TikTokVerifiedBadge className="w-3.5 h-3.5" />
                )}
              </div>

              {/* 3 Stats Columns Aligned Left */}
              <div className="flex items-center space-x-4 pt-2 text-left">
                <div>
                  <span
                    className={`block text-sm font-bold leading-none ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {followingCount && followingCount.trim() ? followingCount : '245'}
                  </span>
                  <span
                    className={`text-[11px] font-normal ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Following
                  </span>
                </div>
                <div>
                  <span
                    className={`block text-sm font-bold leading-none ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {followersCount && followersCount.trim() ? followersCount : '12.8K'}
                  </span>
                  <span
                    className={`text-[11px] font-normal ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Followers
                  </span>
                </div>
                <div>
                  <span
                    className={`block text-sm font-bold leading-none ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {likesCount && likesCount.trim() ? likesCount : '489.2K'}
                  </span>
                  <span
                    className={`text-[11px] font-normal ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Likes
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side: Large Avatar (Polosan tanpa border/ring/outline) */}
            <div className="relative shrink-0 pt-0.5">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img
                  src={userAvatar}
                  alt={profileName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 3. Action Buttons (Flex Row: Follow vs Following state logic) */}
          {isFollowing ? (
            /* Kondisi Diklik (isFollowing: true) */
            <div className="flex items-center space-x-2 pt-1">
              {/* Button 1: Message capsule */}
              <button
                type="button"
                className={`flex-1 font-semibold text-xs py-2 px-4 rounded-full text-center transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                    : 'bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200'
                }`}
              >
                Message
              </button>

              {/* Button 2: Following + Caret Down capsule */}
              <button
                type="button"
                onClick={handleToggleFollow}
                className={`px-4 py-2 flex items-center space-x-1 font-semibold text-xs rounded-full transition-all cursor-pointer ${
                  isDark
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                    : 'bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200'
                }`}
              >
                <span>Following</span>
                <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              {/* Button 3: UserPlus icon (no border) */}
              <button
                type="button"
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
                title="Add friend"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Kondisi Awal (isFollowing: false) */
            <div className="flex items-center space-x-2 pt-1">
              {/* Button 1: Red Follow capsule */}
              <button
                type="button"
                onClick={handleToggleFollow}
                className="flex-1 font-bold text-xs py-2 px-4 rounded-full text-center transition-all cursor-pointer shadow-xs bg-[#FE2C55] hover:bg-[#e0264a] text-white"
              >
                Follow
              </button>

              {/* Button 2: Send (Paper plane) icon circle button */}
              <button
                type="button"
                className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800'
                    : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
                }`}
                title="Message"
              >
                <Send className="w-4 h-4" />
              </button>

              {/* Button 3: UserPlus icon circle button */}
              <button
                type="button"
                className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? 'bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800'
                    : 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200'
                }`}
                title="Add friend"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4. Bio & Links (Pure text link, NO link chain icon) */}
          <div className="space-y-1 pt-0.5 text-left">
            {/* Multi-line Bio */}
            <p
              className={`text-xs whitespace-pre-line leading-relaxed ${
                isDark ? 'text-gray-200' : 'text-gray-800'
              }`}
            >
              {renderFormattedTextWithAppleEmojis(bio || 'Your text goes here')}
            </p>

            {/* Clean Bold Link */}
            <div
              className={`text-xs font-bold hover:underline cursor-pointer pt-0.5 truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {linkUrl || 'https://linkhere.com'}
            </div>
          </div>

          {/* 5. Pill Badges / Showcase & LIVE */}
          {(showOrders !== false || showQnA !== false) && (
            <div className="flex items-center space-x-2 pt-0.5 text-left">
              {showOrders !== false && (
                <div
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-gray-200'
                      : 'bg-gray-100 border-gray-300 text-gray-800'
                  }`}
                >
                  <TikTokShopTabIcon className="w-3.5 h-3.5 text-[#FE2C55]" />
                  <span>Showcase</span>
                </div>
              )}
              {showQnA !== false && (
                <div
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-gray-200'
                      : 'bg-gray-100 border-gray-300 text-gray-800'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-[#FE2C55]" />
                  <span>LIVE</span>
                </div>
              )}
            </div>
          )}

          {/* 6. Story Highlights (Dynamic List, Squircle Shape, Horizontal Scroll) */}
          {showHighlights !== false && (
            <div className="pt-1">
              <div className="flex items-center space-x-3.5 overflow-x-auto no-scrollbar py-0.5 text-left">
                {(highlights && highlights.length > 0
                  ? highlights
                  : [
                      {
                        id: 'hl-1',
                        image: '',
                        title: '',
                      },
                    ]
                ).map((hl, idx) => {
                  const hlImage = (hl.image && typeof hl.image === 'string' && hl.image.trim() !== '') ? hl.image.trim() : DEFAULT_AVATAR;
                  const hlTitle = hl.title && hl.title.trim() ? hl.title : `hl-${idx + 1}`;
                  return (
                    <div key={hl.id || `hl-${idx}`} className="flex flex-col items-center shrink-0 cursor-pointer">
                      <div
                        className={`w-12 h-12 rounded-[16px] p-[2px] ${
                          isDark
                            ? 'bg-gradient-to-tr from-zinc-700 to-zinc-600'
                            : 'bg-gradient-to-tr from-gray-300 to-gray-400'
                        }`}
                      >
                        <div
                          className={`w-full h-full rounded-[14px] p-[1px] ${
                            isDark ? 'bg-black' : 'bg-white'
                          }`}
                        >
                          <img
                            src={hlImage}
                            alt={hlTitle}
                            className="w-full h-full rounded-[13px] object-cover"
                          />
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium mt-1 truncate max-w-[56px] text-center ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {renderFormattedTextWithAppleEmojis(hlTitle)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 7. Content Tabs (3 Icons: Grid with 6 lines + Caret, Squircle Shop, Repost) */}
        <div
          className={`grid grid-cols-3 border-b mt-1 ${
            isDark ? 'border-zinc-800' : 'border-gray-200'
          }`}
        >
          {/* Tab 1: Grid (Active) */}
          <button
            type="button"
            className={`flex items-center justify-center py-3 relative transition-colors cursor-pointer ${
              activeTab === 'grid' || !activeTab
                ? isDark
                  ? 'text-white'
                  : 'text-gray-900'
                : isDark
                ? 'text-zinc-600 hover:text-zinc-400'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <TikTokGridTabIcon className="w-6 h-5" />
            {(activeTab === 'grid' || !activeTab) && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${
                  isDark ? 'bg-white' : 'bg-gray-900'
                }`}
              />
            )}
          </button>

          {/* Tab 2: Shop */}
          <button
            type="button"
            className={`flex items-center justify-center py-3 relative transition-colors cursor-pointer ${
              activeTab === 'shop'
                ? isDark
                  ? 'text-white'
                  : 'text-gray-900'
                : isDark
                ? 'text-zinc-600 hover:text-zinc-400'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <TikTokShopTabIcon className="w-5 h-5" />
            {activeTab === 'shop' && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${
                  isDark ? 'bg-white' : 'bg-gray-900'
                }`}
              />
            )}
          </button>

          {/* Tab 3: Repost */}
          <button
            type="button"
            className={`flex items-center justify-center py-3 relative transition-colors cursor-pointer ${
              activeTab === 'repost'
                ? isDark
                  ? 'text-white'
                  : 'text-gray-900'
                : isDark
                ? 'text-zinc-600 hover:text-zinc-400'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <TikTokRepostIcon className="w-5 h-5" />
            {activeTab === 'repost' && (
              <div
                className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${
                  isDark ? 'bg-white' : 'bg-gray-900'
                }`}
              />
            )}
          </button>
        </div>

        {/* 8. Video Grid (3 Columns, Left to Right) */}
        {videos && videos.length > 0 ? (
          <div
            id="preview-tiktok-video-grid"
            className={`grid grid-cols-3 gap-[1px] ${
              isDark ? 'bg-zinc-800' : 'bg-gray-200'
            }`}
          >
            {videos.map((vid, idx) => {
              const isPinned = Boolean(vid.isPinned);
              return (
                <div
                  key={vid.id || `v-${idx}`}
                  className={`relative aspect-[3/4] ${isDark ? 'bg-zinc-800' : 'bg-neutral-200'} overflow-hidden group text-left`}
                >
                  {vid.thumbnail && typeof vid.thumbnail === 'string' && vid.thumbnail.trim() !== '' ? (
                    <img
                      src={vid.thumbnail.trim()}
                      alt={`TikTok video ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-neutral-200'} flex items-center justify-center`}>
                      <Play className={`w-6 h-6 ${isDark ? 'text-zinc-600' : 'text-neutral-400'}`} />
                    </div>
                  )}

                  {/* Red Pinned Badge at Top Left */}
                  {isPinned && (
                    <div className="absolute top-1 left-1 bg-[#FE2C55] text-white text-[9px] font-normal px-1.5 py-0.5 rounded-xs tracking-tight shadow-xs">
                      Pinned
                    </div>
                  )}

                  {/* Play Icon (▷) + Views at Bottom Left */}
                  <div className="absolute bottom-1.5 left-1.5 flex items-center space-x-1 text-white font-semibold text-[11px] drop-shadow-md">
                    <Play className="w-3 h-3 fill-white text-white stroke-none" />
                    <span>{vid.views && vid.views.trim() ? vid.views : '0'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div id="preview-tiktok-video-empty" className="py-12 text-center text-xs text-neutral-400 font-medium">
            No videos posted yet
          </div>
        )}
      </div>
    </div>
  );
};
