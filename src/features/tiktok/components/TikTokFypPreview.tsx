import React from 'react';
import { TikTokFypData } from '../../../types';
import { renderFormattedTextWithAppleEmojis } from '../../../utils/emojiUtils';
import { TikTokVerifiedBadge } from './TikTokIcons';
import {
  Tv,
  Search,
  Home,
  ShoppingBag,
  Plus,
  MessageSquare,
  User,
} from 'lucide-react';

interface Props {
  data: TikTokFypData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onToggleLike?: () => void;
  onToggleBookmark?: () => void;
  onToggleFollow?: () => void;
}

// 1. TikTok Official Solid Heart (Like)
const TikTokHeartIcon: React.FC<{ isLiked?: boolean; className?: string }> = ({
  isLiked,
  className = 'w-7 h-7',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-md transition-transform active:scale-90`}
    fill={isLiked ? '#FE2C55' : '#FFFFFF'}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

// 2. TikTok Official Solid Comment Bubble with 3 punchout dots
const TikTokCommentIcon: React.FC<{ className?: string }> = ({
  className = 'w-7 h-7',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-md transition-transform active:scale-90`}
    fill="#FFFFFF"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.5C6.753 2.5 2.5 6.306 2.5 11c0 2.593 1.306 4.908 3.361 6.426-.142.868-.588 2.22-1.573 3.208a.75.75 0 00.53 1.28c2.148 0 3.99-1.026 5.01-1.897.7.126 1.425.193 2.172.193 5.247 0 9.5-3.806 9.5-8.5s-4.253-8.71-9.5-8.71zm-4 9a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm4 0a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5zm4 0a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
    />
  </svg>
);

// 3. TikTok Official Solid Bookmark / Save
const TikTokBookmarkIcon: React.FC<{ isBookmarked?: boolean; className?: string }> = ({
  isBookmarked,
  className = 'w-7 h-7',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-md transition-transform active:scale-90`}
    fill={isBookmarked ? '#FACE15' : '#FFFFFF'}
  >
    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3.5 7 3.5V5c0-1.1-.9-2-2-2z" />
  </svg>
);

// 4. TikTok Official Solid Curvy Share Arrow
const TikTokShareCurvyIcon: React.FC<{ className?: string }> = ({
  className = 'w-7 h-7',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-md transition-transform active:scale-90`}
    fill="#FFFFFF"
  >
    <path d="M14 4.5v3.6c-7.2.4-11 5.2-12 11.9 2.5-3.6 6.1-5.4 12-5.4v3.9l8-7-8-7z" />
  </svg>
);

// 5. Stylized Compact Music Note Icon
const TikTokMusicNoteIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} drop-shadow-sm shrink-0`}
    fill="#FFFFFF"
  >
    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h6V3h-8z" />
  </svg>
);

// 6. Custom TikTok Repost Icon (Vertical looping arrows with solid rounded arrowheads)
const TikTokRepostSymbol: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={`shrink-0 ${className}`}
    viewBox="0 0 24 24"
    fill="none"
  >
    {/* Left Arrow: Horizontal bottom tail curving UP on the left */}
    <path
      d="M11.2 19H7.8C6.3 19 5.5 18.2 5.5 16.7V7.5"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.6 8.8L5.5 4.8L8.4 8.8Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
    {/* Right Arrow: Horizontal top tail curving DOWN on the right */}
    <path
      d="M12.8 5H16.2C17.7 5 18.5 5.8 18.5 7.3V16.5"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.6 15.2L18.5 19.2L21.4 15.2Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

export const TikTokFypPreview: React.FC<Props> = ({
  data,
  previewRef,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
}) => {
  const {
    mediaImage = '',
    avatarUrl = '',
    username = '',
    caption = '',
    soundName = '',
    soundCover = '',
    locationText = '',
    activeNavTab = 'foryou',
    likesCount = '',
    isLiked = true,
    commentsCount = '',
    bookmarksCount = '',
    isBookmarked = false,
    sharesCount = '',
    isFollowed = false,
    showReposted = false,
    repostedByText = '',
    repostedByAvatar = '',
    unreadInboxCount = '1',
  } = (data || {}) as any;

  const repostAvatar = (repostedByAvatar && repostedByAvatar.trim() !== '') ? repostedByAvatar.trim() : '';
  const displayedSoundText = soundName || 'original sound - music';
  const displayedCaption = caption || 'Your text goes here...';

  return (
    <div
      ref={previewRef}
      id="export-tiktok-fyp"
      className="w-[380px] min-w-[380px] max-w-[380px] mx-auto p-0 bg-transparent shrink-0"
    >
      <div
        id="tiktok-fyp-card"
        style={{
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className="w-full aspect-[9/16] min-h-[675px] relative overflow-hidden bg-neutral-950 text-white select-none font-sans flex flex-col justify-between"
      >
        {/* 1. Fullscreen Background Video / Photo Post */}
        {mediaImage && mediaImage.trim() !== '' ? (
          <img
            src={mediaImage}
            alt="TikTok post media"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-950 z-0 flex items-center justify-center text-white/20 text-xs font-normal">
            {/* Clean empty canvas */}
          </div>
        )}

        {/* 2. Top Feed Navigation Bar: Single Horizontal Row with Aligned Tabs & Stacked LIVE Button on Far Left */}
        <div className="relative z-20 px-3.5 pt-3 pb-1 flex items-center justify-between text-white drop-shadow-md gap-1">
          {/* Left: Stacked LIVE Button with TV on top and LIVE text below */}
          <button
            type="button"
            className="flex flex-col items-center justify-center min-w-[36px] px-1 py-0.5 hover:opacity-85 transition-opacity cursor-pointer shrink-0"
            title="TikTok LIVE"
          >
            <Tv className="w-5 h-5 text-white stroke-[2.2]" />
            <span className="text-[9px] font-black tracking-wider uppercase leading-none mt-0.5">LIVE</span>
          </button>

          {/* Center Feed Tabs in One Continuous Horizontal Line without wrapping */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 text-[14px] sm:text-[15px] font-semibold text-white/75 drop-shadow-sm whitespace-nowrap overflow-x-auto no-scrollbar">
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'location'
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              {renderFormattedTextWithAppleEmojis(locationText || 'Sleman')}
            </span>
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'friends'
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              Friends
            </span>
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'following'
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              Following
            </span>
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'foryou' || !activeNavTab
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              For You
            </span>
          </div>

          {/* Right: Search Icon */}
          <button
            type="button"
            className="p-1 text-white hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Search"
          >
            <Search className="w-5 h-5 drop-shadow-md stroke-[2.2]" />
          </button>
        </div>

        {/* Middle Spacer Area */}
        <div className="relative z-20 flex-1 flex flex-col justify-end" />

        {/* 3. Bottom Area: Left Metadata (Username, Caption, Repost, Sound) + Right Engagement Sidebar */}
        <div className="relative z-20 px-3.5 pb-3 flex items-end justify-between space-x-3">
          {/* Left Metadata Column */}
          <div className="flex-1 min-w-0 space-y-1.5 text-left pr-2">
            {/* Repost Status Bar: Left Avatar + Middle Unified White Speech Bubble + Right Clear Glass Repost Badge */}
            {showReposted && (
              <div className="mb-2 flex items-center gap-1.5 max-w-full">
                {/* 1. Left Circular User Avatar (No Outline) */}
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-[#f1f3f5] border-0 outline-none flex items-center justify-center">
                  {repostAvatar && repostAvatar.trim() !== '' ? (
                    <img
                      src={repostAvatar}
                      alt="repost user"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <circle cx="12" cy="12" r="12" fill="#f1f3f5" />
                      <circle cx="12" cy="9.2" r="3.8" fill="#8e949e" />
                      <path d="M5.2 21.2c0.8-3.6 3.5-5.8 6.8-5.8s6 2.2 6.8 5.8" fill="#8e949e" />
                    </svg>
                  )}
                </div>

                {/* 2. Middle White Speech Bubble with Seamlessly Connected Blunt Bottom-Left Tail */}
                <div className="relative bg-white text-black px-3 py-1.5 rounded-[13px] rounded-bl-[2px] drop-shadow-md max-w-[205px] ml-1">
                  <svg
                    viewBox="0 0 16 14"
                    fill="none"
                    className="absolute -left-[5px] bottom-0 w-[16px] h-[14px] text-white pointer-events-none"
                  >
                    <path
                      d="M5 0 L5 5.2 C5 8.2 2.8 10.3 1.0 11.5 C-0.3 12.4 0.3 14 2.1 14 L12 14 L12 0 Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="relative z-10 block text-[11.5px] font-bold text-black leading-[1.22] tracking-tight break-words">
                    {renderFormattedTextWithAppleEmojis(
                      repostedByText &&
                        repostedByText.trim() !== '' &&
                        repostedByText !== 'Name reposted'
                        ? repostedByText
                        : 'Account reposted'
                    )}
                  </span>
                </div>

                {/* 3. Right Smaller Clear Glass Circle Badge (No Blur) with Smaller White Repost Icon */}
                <div className="w-[21px] h-[21px] rounded-full bg-white/[0.08] border border-white/35 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.45),inset_0_-0.5px_1px_rgba(255,255,255,0.15)] flex items-center justify-center shrink-0">
                  <TikTokRepostSymbol className="w-[12.5px] h-[12.5px] text-white drop-shadow-2xs" />
                </div>
              </div>
            )}

            {/* Stacked Creator Name / Username with Verified Badge & Post Time */}
            <div className="flex items-center space-x-1.5 flex-wrap">
              <h2 className="text-[15px] sm:text-base font-bold text-white drop-shadow-md leading-tight hover:underline cursor-pointer flex items-center gap-1">
                <span>{renderFormattedTextWithAppleEmojis(data.displayName ? data.displayName : (username ? `@${username.replace(/^@/, '')}` : 'Name'))}</span>
                {data.isVerified && (
                  <TikTokVerifiedBadge className="w-3.5 h-3.5" />
                )}
              </h2>
              {data.postTime && data.postTime.trim() !== '' && (
                <span className="text-[13px] font-normal text-white/80 drop-shadow-md flex items-center">
                  <span className="mx-1 opacity-70">·</span>
                  <span>{renderFormattedTextWithAppleEmojis(data.postTime)}</span>
                </span>
              )}
            </div>

            {/* Stacked Caption */}
            <div className="text-[13px] sm:text-sm font-normal text-white/95 leading-snug drop-shadow-md line-clamp-3">
              {renderFormattedTextWithAppleEmojis(displayedCaption)}
            </div>

            {/* Static Music Note and Text (Completely still, no marquee animation) */}
            <div className="flex items-center space-x-2 pt-1 text-xs text-white/95 drop-shadow-md max-w-[240px]">
              <TikTokMusicNoteIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-[12px] truncate">{renderFormattedTextWithAppleEmojis(displayedSoundText)}</span>
            </div>
          </div>

          {/* Right Column: Standard TikTok Vertical Engagement Sidebar with Increased Gap from Profile Pic */}
          <div className="flex flex-col items-center shrink-0 pb-1">
            {/* Creator Profile Avatar without white outline/border */}
            <div className="relative flex flex-col items-center mb-5 cursor-pointer" onClick={onToggleFollow}>
              <div className="w-11 h-11 rounded-full overflow-hidden transition-transform hover:scale-105 bg-zinc-800 flex items-center justify-center">
                {avatarUrl && avatarUrl.trim() !== '' ? (
                  <img
                    src={avatarUrl.trim()}
                    alt={username || 'creator'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-zinc-400" />
                )}
              </div>

              {/* Follow Button Logic: Only render the red [+] button when NOT followed. When followed, it disappears completely */}
              {!isFollowed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onToggleFollow) onToggleFollow();
                  }}
                  className="absolute -bottom-1.5 w-5 h-5 rounded-full bg-[#FE2C55] text-white flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-110 cursor-pointer"
                  title="Follow"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                </button>
              )}
            </div>

            {/* Engagement Action Buttons List */}
            <div className="flex flex-col items-center space-y-4">
              {/* 1. Like Heart Button + Count (Solid white / Solid red) */}
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={onToggleLike}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <div className="p-1 rounded-full group-hover:scale-110 transition-transform">
                  <TikTokHeartIcon isLiked={isLiked} className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-md mt-0.5">
                  {likesCount || '245.8K'}
                </span>
              </div>

              {/* 2. Comments Bubble Button + Count (Solid White) */}
              <div
                className="flex flex-col items-center cursor-pointer group"
                title="Comments"
              >
                <div className="p-1 rounded-full group-hover:scale-110 transition-transform">
                  <TikTokCommentIcon className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-md mt-0.5">
                  {commentsCount || '1,842'}
                </span>
              </div>

              {/* 3. Bookmark / Save Button + Count (Solid White / Solid Yellow) */}
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={onToggleBookmark}
                title={isBookmarked ? 'Saved' : 'Save'}
              >
                <div className="p-1 rounded-full group-hover:scale-110 transition-transform">
                  <TikTokBookmarkIcon isBookmarked={isBookmarked} className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-md mt-0.5">
                  {bookmarksCount || '12.5K'}
                </span>
              </div>

              {/* 4. Official TikTok Curvy Arrow Share Button + Count (Solid White) */}
              <div
                className="flex flex-col items-center cursor-pointer group"
                title="Share"
              >
                <div className="p-1 rounded-full group-hover:scale-110 transition-transform">
                  <TikTokShareCurvyIcon className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-md mt-0.5">
                  {sharesCount || '3,219'}
                </span>
              </div>

              {/* 5. Full Image Circular Audio Disc at bottom-right (fills entire circle cleanly without borders) */}
              <div className="relative pt-1 cursor-pointer">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-md bg-zinc-900 flex items-center justify-center border border-white/10">
                  {soundCover && soundCover.trim() !== '' ? (
                    <img
                      src={soundCover.trim()}
                      alt="album sound cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                      <TikTokMusicNoteIcon className="w-5 h-5 text-white/80" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Bottom Navigation Bar */}
        <div className="relative z-20 h-14 bg-black/95 backdrop-blur-md border-t border-white/10 px-4 flex items-center justify-between text-white/70">
          {/* Home */}
          <div className="flex flex-col items-center justify-center cursor-pointer text-white">
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-0.5">Home</span>
          </div>

          {/* Shop */}
          <div className="flex flex-col items-center justify-center cursor-pointer hover:text-white transition-colors">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] font-medium mt-0.5">Shop</span>
          </div>

          {/* TikTok [+] Create Button */}
          <div className="relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform px-1">
            <div className="w-11 h-7 bg-white rounded-lg relative flex items-center justify-center shadow-md">
              {/* Cyan / Blue left accent */}
              <div className="absolute top-0 bottom-0 -left-1 w-3 bg-[#00f2fe] rounded-l-lg -z-10" />
              {/* Pink / Red right accent */}
              <div className="absolute top-0 bottom-0 -right-1 w-3 bg-[#FE2C55] rounded-r-lg -z-10" />
              <Plus className="w-5 h-5 text-black stroke-[3]" />
            </div>
          </div>

          {/* Inbox */}
          <div className="flex flex-col items-center justify-center cursor-pointer hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] font-medium mt-0.5">Inbox</span>
          </div>

          {/* Profile */}
          <div className="flex flex-col items-center justify-center cursor-pointer hover:text-white transition-colors">
            <User className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] font-medium mt-0.5">Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};
