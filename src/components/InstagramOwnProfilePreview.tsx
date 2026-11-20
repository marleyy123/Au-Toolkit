import React, { useState } from 'react';
import { InstagramOwnProfileData, InstagramHighlight, InstagramGridPost } from '../types';
import { InstagramVerifiedBadge } from './Icons';
import { renderFormattedTextWithAppleEmojis } from '../utils/emojiUtils';
import { InstagramNoteText } from '../utils/instagramNoteTextWrapper';
import { Pin, Layers, Video, Eye } from 'lucide-react';

interface Props {
  data: InstagramOwnProfileData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const InstagramOwnProfilePreview: React.FC<Props> = ({ data, previewRef }) => {
  const {
    theme = 'light',
    // Header
    username = '',
    showNotificationDot = true,
    showDropdownArrow = true,
    showCreateButton = true,
    showMenuButton = true,
    isPrivate = false,
    // Profile Info
    name = '',
    avatar = '',
    hasStoryRing = false,
    showAddAvatarBadge = true,
    verified = 'none',
    postsCount = '0',
    followersCount = '0',
    followingCount = '0',
    bio = '',
    website = '',
    // Notes
    showNotes = false,
    notesText = '',
    notesBgColor = '',
    notesTextColor = '',
    // Music
    showMusic = false,
    musicTitle = '',
    musicArtist = '',
    // Dashboard
    showDashboard = false,
    dashboardTitle = 'Your dashboard',
    dashboardViews = '12k views in the last 30 days',
    dashboardGrowth = '',
    // Actions
    showEditProfile = true,
    editProfileText = 'Edit profile',
    showShareProfile = true,
    shareProfileText = 'Share profile',
    showAddPerson = true,
    // Highlights
    showHighlights = true,
    highlights = [],
    showNewHighlightButton = true,
    // Post Grid
    activeTab: initialActiveTab = 'grid',
    gridPosts = [],
    reelsPosts = [],
    taggedPosts = [],
  } = (data || {}) as InstagramOwnProfileData;

  const [currentTab, setCurrentTab] = useState<'grid' | 'reels' | 'tagged'>(
    initialActiveTab === 'reels' || initialActiveTab === 'tagged' ? initialActiveTab : 'grid'
  );

  // Keep state synced if props change
  React.useEffect(() => {
    if (initialActiveTab === 'reels' || initialActiveTab === 'tagged' || initialActiveTab === 'grid') {
      setCurrentTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  const isDark = theme === 'dark';
  const bgHex = isDark ? '#000000' : '#ffffff';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const subtextClass = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const buttonBg = isDark
    ? 'bg-[#262626] text-white hover:bg-[#333333]'
    : 'bg-neutral-100 text-slate-900 hover:bg-neutral-200';
  const activeTabStyle = isDark ? 'border-white text-white' : 'border-black text-black';
  const inactiveTabStyle = isDark ? 'border-transparent text-neutral-500' : 'border-transparent text-neutral-400';

  // Format Bio to highlight @mentions and #hashtags in blue while supporting multiline & Apple emojis
  const renderBioWithMentionsAndTags = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const regex = /([@#][a-zA-Z0-9_.]+)/g;
      const parts = line.split(regex);
      return (
        <span key={lineIdx} className="block min-h-[1.15em]">
          {parts.map((part, partIdx) => {
            if (part.startsWith('@') || part.startsWith('#')) {
              return (
                <span
                  key={partIdx}
                  className={`font-normal ${isDark ? 'text-[#0095f6]' : 'text-[#00376b]'}`}
                >
                  {renderFormattedTextWithAppleEmojis(part)}
                </span>
              );
            }
            return (
              <React.Fragment key={partIdx}>
                {renderFormattedTextWithAppleEmojis(part)}
              </React.Fragment>
            );
          })}
        </span>
      );
    });
  };

  return (
    <div
      ref={previewRef}
      id="export-ig-own-profile"
      className={`w-[380px] min-w-[380px] max-w-[380px] h-auto mx-auto p-0 m-0 border-0 shadow-none outline-none transition-all font-sans leading-normal select-none overflow-hidden shrink-0 ${
        isDark ? 'bg-black text-white' : 'bg-white text-black'
      }`}
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
        backgroundColor: bgHex,
      }}
    >
      <div id="instagram-own-profile-card" className={`w-full relative flex flex-col ${textClass}`}>
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between px-4 py-2 relative min-h-[44px]">
          {/* Left: Create (+) icon */}
          <div className="w-8 flex items-center justify-start">
            {showCreateButton && (
              <button type="button" className="opacity-90 hover:opacity-100 transition-opacity">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
            )}
          </div>

          {/* Center: Private Lock Icon (Left) + Username in bold + Verified badge + dropdown chevron + optional red dot */}
          <div className="flex items-center gap-1 font-bold text-[17px] tracking-tight justify-center min-w-0 max-w-[215px]">
            {isPrivate && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-90 mr-0.5">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            )}
            <span className="truncate">{renderFormattedTextWithAppleEmojis(username || 'janerubyjane')}</span>
            {(verified === 'ig-blue' || verified === 'blue') && (
              <InstagramVerifiedBadge className="w-[14px] h-[14px] shrink-0 inline-block align-middle ml-0.5" />
            )}
            {showDropdownArrow && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-80 mt-0.5">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            )}
            {showNotificationDot && (
              <span className="w-2 h-2 rounded-full bg-[#ff3040] inline-block shrink-0" />
            )}
          </div>

          {/* Right: Hamburger menu */}
          <div className="w-8 flex items-center justify-end">
            {showMenuButton && (
              <button type="button" className="opacity-90 hover:opacity-100 transition-opacity">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 3. Profile Information Row (Avatar on Left, Stats on Right) */}
        <div className="px-4 pt-3 flex items-center justify-between gap-4">
          {/* Avatar Container with Notes & Story Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Instagram Notes Floating Above Profile Picture */}
            {showNotes && Boolean(notesText && notesText.trim() !== '') && (
              <div className="absolute bottom-[calc(100%-8px)] left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center w-max max-w-[140px]">
                <div
                  className={`relative px-3 py-1.5 rounded-[18px] max-w-[140px] min-w-[50px] text-center flex flex-col items-center justify-center shadow-md border ${
                    notesBgColor
                      ? ''
                      : isDark
                      ? 'bg-[#262626] text-white border-white/10'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                  style={{
                    backgroundColor: notesBgColor || undefined,
                    color: notesTextColor || undefined,
                  }}
                >
                  <span className="text-[11px] leading-snug font-normal text-center">
                    <InstagramNoteText text={notesText.trim()} maxCharsPerLine={20} />
                  </span>
                  {/* Two small rounded tail dots pointing to profile */}
                  <div
                    className={`absolute -bottom-1.5 left-4 w-2.5 h-2.5 rounded-full border shadow-2xs ${
                      notesBgColor ? '' : isDark ? 'bg-[#262626] border-white/10' : 'bg-white border-slate-200'
                    }`}
                    style={{ backgroundColor: notesBgColor || undefined }}
                  />
                  <div
                    className={`absolute -bottom-3 left-5.5 w-1.5 h-1.5 rounded-full border shadow-2xs ${
                      notesBgColor ? '' : isDark ? 'bg-[#262626] border-white/10' : 'bg-white border-slate-200'
                    }`}
                    style={{ backgroundColor: notesBgColor || undefined }}
                  />
                </div>
              </div>
            )}

            {/* Profile Avatar Outer Circle */}
            <div
              className={`w-[84px] h-[84px] rounded-full flex items-center justify-center relative overflow-visible ${
                hasStoryRing
                  ? 'p-[2.5px] bg-gradient-to-tr from-[#fba636] via-[#e1306c] to-[#833ab4]'
                  : ''
              }`}
            >
              <div
                className={`w-full h-full rounded-full overflow-hidden ${
                  hasStoryRing
                    ? isDark
                      ? 'border-2 border-black'
                      : 'border-2 border-white'
                    : isDark
                    ? 'border border-neutral-800'
                    : 'border border-neutral-200'
                }`}
              >
                {avatar && avatar.trim() !== '' ? (
                  <img
                    src={avatar.trim()}
                    alt={username || 'janerubyjane'}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-full ${
                      isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-500'
                    } flex items-center justify-center`}
                  >
                    <svg className="w-10 h-10 fill-current opacity-60" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Blue "+" button badge at bottom right of avatar */}
              {showAddAvatarBadge && (
                <div
                  className={`absolute bottom-0 right-0 w-[24px] h-[24px] rounded-full bg-[#0095f6] border-2 ${
                    isDark ? 'border-black' : 'border-white'
                  } flex items-center justify-center text-white shadow-xs z-10`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Statistics Summary (Posts, Followers, Following) */}
          <div className="flex-1 flex items-center justify-around text-center">
            <div className="min-w-0">
              <div className="font-bold text-[17px] leading-tight">{postsCount || '0'}</div>
              <div className="text-[13px] font-normal leading-tight mt-0.5 opacity-90">posts</div>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[17px] leading-tight">{followersCount || '0'}</div>
              <div className="text-[13px] font-normal leading-tight mt-0.5 opacity-90">followers</div>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[17px] leading-tight">{followingCount || '0'}</div>
              <div className="text-[13px] font-normal leading-tight mt-0.5 opacity-90">following</div>
            </div>
          </div>
        </div>

        {/* 4. Display Name & Bio & Website Section */}
        <div className="px-4 pt-2.5 text-left">
          {/* Display Name */}
          <div className="font-bold text-[13.5px] leading-snug">
            <span>{renderFormattedTextWithAppleEmojis(name || 'Name')}</span>
          </div>

          {/* Biography Text (multiline preserved with blue @mentions and #hashtags) */}
          {bio && bio.trim() !== '' && (
            <div className="text-[13px] leading-snug mt-1 space-y-0.5">
              {renderBioWithMentionsAndTags(bio)}
            </div>
          )}

          {/* Website Link */}
          {website && website.trim() !== '' && (
            <div
              className={`flex items-center gap-1.5 text-[12.5px] font-semibold mt-1.5 ${
                isDark ? 'text-[#e0f1ff]' : 'text-[#00376b]'
              }`}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span className="truncate">{website}</span>
            </div>
          )}

          {/* 5. Profile Music Section (Visual Pill) */}
          {showMusic && (
            <div
              className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium w-max max-w-full ${
                isDark ? 'bg-[#262626] text-white' : 'bg-neutral-100 text-black'
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M6 4l14 8-14 8V4z" />
              </svg>
              <span className="truncate max-w-[260px] inline-flex items-center gap-1">
                {musicTitle ? (
                  <>
                    <span className="font-semibold">{renderFormattedTextWithAppleEmojis(musicTitle)}</span>
                    {musicArtist && (
                      <span className="opacity-75">· {renderFormattedTextWithAppleEmojis(musicArtist)}</span>
                    )}
                  </>
                ) : (
                  <span className="opacity-80">Add music</span>
                )}
              </span>
            </div>
          )}

          {/* 6. Professional Dashboard (Optional) */}
          {showDashboard && (
            <div
              className={`mt-2.5 px-3.5 py-2.5 rounded-xl border ${
                isDark ? 'bg-[#1a1a1a] border-neutral-800' : 'bg-neutral-100 border-neutral-200'
              } flex flex-col gap-0.5 text-left`}
            >
              <div className="text-[12.5px] font-semibold flex items-center justify-between">
                <span>{dashboardTitle || 'Your dashboard'}</span>
                {dashboardGrowth && (
                  <span className="text-[11px] text-[#4ade80] font-bold">{dashboardGrowth}</span>
                )}
              </div>
              <div className={`text-[11.5px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {dashboardViews || '12k views in the last 30 days'}
              </div>
            </div>
          )}

          {/* 7. Profile Action Buttons */}
          <div className="flex items-center gap-1.5 mt-3">
            {showEditProfile && (
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-lg text-[13px] font-semibold text-center transition-colors ${buttonBg}`}
              >
                {editProfileText || 'Edit profile'}
              </button>
            )}
            {showShareProfile && (
              <button
                type="button"
                className={`flex-1 py-1.5 rounded-lg text-[13px] font-semibold text-center transition-colors ${buttonBg}`}
              >
                {shareProfileText || 'Share profile'}
              </button>
            )}
            {showAddPerson && (
              <button
                type="button"
                className={`p-1.5 rounded-lg text-center transition-colors ${buttonBg}`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 8. Story Highlights Section */}
        {showHighlights && (
          <div className="px-4 pt-3.5 pb-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center space-x-4 min-w-max">
              {/* Highlight Items */}
              {highlights && highlights.length > 0
                ? highlights.map((hl, idx) => (
                    <div key={hl.id || idx} className="flex flex-col items-center space-y-1.5">
                      <div
                        className={`w-[62px] h-[62px] rounded-full p-[2px] ${
                          isDark ? 'bg-neutral-800 border-neutral-700/80' : 'bg-neutral-200 border-neutral-300'
                        } border flex items-center justify-center overflow-hidden`}
                      >
                        {hl.image && hl.image.trim() !== '' ? (
                          <img
                            src={hl.image.trim()}
                            alt={hl.title || 'Highlight'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full rounded-full ${
                              isDark ? 'bg-neutral-800' : 'bg-neutral-200'
                            }`}
                          />
                        )}
                      </div>
                      <span className="text-[11px] font-normal text-center truncate max-w-[68px]">
                        {hl.title && hl.title.trim() !== '' ? hl.title : `Highlight ${idx + 1}`}
                      </span>
                    </div>
                  ))
                : null}

              {/* "New" Highlight Button */}
              {showNewHighlightButton && (
                <div className="flex flex-col items-center space-y-1.5 shrink-0">
                  <div
                    className={`w-[62px] h-[62px] rounded-full border ${
                      isDark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-300 bg-white'
                    } flex items-center justify-center`}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-normal">New</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. Post Grid Navigation Tabs */}
        <div className={`border-t ${borderClass} mt-2 flex items-center justify-around`}>
          {/* Tab 1: Posts Grid (3x3 grid) */}
          <button
            type="button"
            onClick={() => setCurrentTab('grid')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-all ${
              currentTab === 'grid' ? activeTabStyle : inactiveTabStyle
            }`}
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <rect x="2" y="2" width="6.2" height="6.2" rx="0.8" />
              <rect x="8.9" y="2" width="6.2" height="6.2" rx="0.8" />
              <rect x="15.8" y="2" width="6.2" height="6.2" rx="0.8" />
              <rect x="2" y="8.9" width="6.2" height="6.2" rx="0.8" />
              <rect x="8.9" y="8.9" width="6.2" height="6.2" rx="0.8" />
              <rect x="15.8" y="8.9" width="6.2" height="6.2" rx="0.8" />
              <rect x="2" y="15.8" width="6.2" height="6.2" rx="0.8" />
              <rect x="8.9" y="15.8" width="6.2" height="6.2" rx="0.8" />
              <rect x="15.8" y="15.8" width="6.2" height="6.2" rx="0.8" />
            </svg>
          </button>

          {/* Tab 2: Reels / Video (Clapperboard icon next to grid) */}
          <button
            type="button"
            onClick={() => setCurrentTab('reels')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-all ${
              currentTab === 'reels' ? activeTabStyle : inactiveTabStyle
            }`}
          >
            <svg className="w-6 h-6 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="M3 9h18" />
              <line x1="8" y1="3" x2="6" y2="9" />
              <line x1="14" y1="3" x2="12" y2="9" />
              <polygon points="10 12 15 15 10 18" fill="currentColor" stroke="none" />
            </svg>
          </button>

          {/* Tab 3: Tagged (User contact silhouette) */}
          <button
            type="button"
            onClick={() => setCurrentTab('tagged')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-all ${
              currentTab === 'tagged' ? activeTabStyle : inactiveTabStyle
            }`}
          >
            <svg className="w-6 h-6 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 18c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
            </svg>
          </button>
        </div>

        {/* 10. Post Grid Content */}
        <div className="w-full min-h-[160px]">
          {currentTab === 'grid' && (
            <>
              {gridPosts && gridPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5 bg-transparent">
                  {gridPosts.map((post, idx) => {
                    const hasImage = Boolean(post && post.image && post.image.trim() !== '');
                    const postAspectClass = data.gridAspectRatio === '1:1' ? 'aspect-square' : 'aspect-[4/5]';
                    const hasViewersBadge = Boolean(post.showViewers || post.isVideo || (post.viewersCount && post.viewersCount.trim() !== ''));

                    return (
                      <div
                        key={post.id || idx}
                        className={`${postAspectClass} relative overflow-hidden flex items-center justify-center ${
                          hasImage
                            ? isDark
                              ? 'bg-white/5'
                              : 'bg-black/5'
                            : isDark
                            ? 'bg-[#1a1a1a]'
                            : 'bg-neutral-200/70'
                        }`}
                      >
                        {hasImage ? (
                          <img
                            src={post.image}
                            alt={`Post ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className={`w-6 h-6 ${isDark ? 'text-neutral-600' : 'text-neutral-400'} opacity-60`}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        )}

                        {/* Top-Right Badges (Pinned, Carousel, Video) */}
                        {post.isPinned && (
                          <div className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full text-white backdrop-blur-xs z-10">
                            <Pin className="w-3 h-3 fill-current rotate-45 text-white" />
                          </div>
                        )}
                        {!post.isPinned && post.isCarousel && (
                          <div className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full text-white backdrop-blur-xs z-10">
                            <Layers className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {!post.isPinned && !post.isCarousel && post.isVideo && (
                          <div className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full text-white backdrop-blur-xs z-10">
                            <Video className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* Bottom-Left Viewers Badge */}
                        {hasViewersBadge && (
                          <div className="absolute bottom-1.5 left-1.5 flex items-center space-x-1 text-white text-[10px] font-semibold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs z-10">
                            <Eye className="w-3 h-3" />
                            <span>{post.viewersCount || '1.000'}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                  <div
                    className={`w-14 h-14 rounded-full border-2 ${
                      isDark ? 'border-neutral-700 text-neutral-400' : 'border-neutral-300 text-neutral-500'
                    } flex items-center justify-center mb-3`}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-[15px]">
                    {name || 'Profile'} hasn't shared any posts yet.
                  </h4>
                  <p className={`text-[12px] ${subtextClass} mt-1`}>
                    Photos and videos will appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {currentTab === 'reels' && (
            <>
              {reelsPosts && reelsPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5 bg-transparent">
                  {reelsPosts.map((post, idx) => (
                    <div
                      key={post.id || idx}
                      className="aspect-[9/16] relative overflow-hidden bg-neutral-800 flex items-center justify-center"
                    >
                      {post.image ? (
                        <img
                          src={post.image}
                          alt={`Reel ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                          <Eye className="w-6 h-6 text-neutral-500 opacity-60" />
                        </div>
                      )}
                      {/* Top Right: Pin if pinned */}
                      {post.isPinned && (
                        <div className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full text-white backdrop-blur-xs z-10">
                          <Pin className="w-3 h-3 fill-current rotate-45 text-white" />
                        </div>
                      )}
                      {/* Viewers Count */}
                      <div className="absolute bottom-1.5 left-1.5 flex items-center space-x-1 text-white text-[10px] font-semibold bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs z-10">
                        <Eye className="w-3 h-3" />
                        <span>{post.viewersCount || '1.2K'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                  <div
                    className={`w-14 h-14 rounded-full border-2 ${
                      isDark ? 'border-neutral-700 text-neutral-400' : 'border-neutral-300 text-neutral-500'
                    } flex items-center justify-center mb-3`}
                  >
                    <Eye className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-[15px]">No reels yet</h4>
                  <p className={`text-[12px] ${subtextClass} mt-1`}>Videos will appear here.</p>
                </div>
              )}
            </>
          )}

          {currentTab === 'tagged' && (
            <>
              {taggedPosts && taggedPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5 bg-transparent">
                  {taggedPosts.map((post, idx) => {
                    const taggedAspectClass =
                      data.gridAspectRatio === '1:1' ? 'aspect-square' : 'aspect-[4/5]';
                    return (
                      <div
                        key={post.id || idx}
                        className={`${taggedAspectClass} relative overflow-hidden bg-neutral-800`}
                      >
                        {post.image ? (
                          <img
                            src={post.image}
                            alt={`Tagged ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-800" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                  <h4 className="font-bold text-[15px]">Photos and videos of you</h4>
                  <p className={`text-[12px] ${subtextClass} mt-1`}>
                    When people tag you in photos and videos, they'll appear here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
