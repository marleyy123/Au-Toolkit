import React from 'react';
import { InstagramProfileData } from '../../../types';
import { InstagramVerifiedBadge } from './InstagramIcons';
import { renderFormattedTextWithAppleEmojis } from '../../../utils/emojiUtils';
import { Pin, Layers, AtSign, Music, UserPlus, ArrowLeft, MoreVertical } from 'lucide-react';

interface Props {
  data: InstagramProfileData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const InstagramProfilePreview: React.FC<Props> = ({ data, previewRef }) => {
  const {
    username,
    name,
    avatar,
    verified,
    postsCount,
    followersCount,
    followingCount,
    bio,
    website,
    showThreadsBadge,
    threadsHandle,
    showMusicBadge,
    musicTitle,
    musicArtist,
    showMutualFriends,
    mutualFriendsText,
    followButtonText,
    messageButtonText,
    isFollowing,
    highlights,
    gridPosts,
    showReelsTab = true,
    theme = 'light',
  } = (data || {}) as any;

  const [activeTab, setActiveTab] = React.useState<'grid' | 'reels' | 'tagged'>('grid');

  const isDark = theme === 'dark';

  const themeClasses = isDark
    ? 'bg-[#000000] text-white'
    : 'bg-white text-gray-900';
  const subtextClass = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const buttonBgPrimary = isFollowing
    ? isDark
      ? 'bg-transparent border border-neutral-700 text-white hover:bg-neutral-800'
      : 'bg-transparent border border-neutral-300 text-slate-900 hover:bg-neutral-100'
    : 'bg-[#0095f6] text-white hover:bg-[#1877f2] border border-transparent';
  const buttonBgSecondary = isDark
    ? 'bg-neutral-800 text-white hover:bg-neutral-700'
    : 'bg-neutral-200 text-gray-900 hover:bg-neutral-300';
  const badgeBg = isDark
    ? 'bg-neutral-800/80 text-neutral-200 border-neutral-700/60'
    : 'bg-neutral-100 text-neutral-800 border-neutral-200';
  const activeTabStyle = isDark ? 'border-white text-white' : 'border-black text-black';
  const inactiveTabStyle = isDark ? 'border-transparent text-neutral-500' : 'border-transparent text-neutral-400';

  const wrapperBgClass = isDark ? 'bg-black text-white' : 'bg-white text-black';
  const wrapperBgHex = isDark ? '#000000' : '#ffffff';
  const hasBio = typeof bio === 'string' && bio.trim() !== '';
  const visibleHighlights = Array.isArray(highlights) ? highlights : [];
  const shouldShowHighlights = data.showHighlights !== false && visibleHighlights.length > 0;

  return (
    <div
      ref={previewRef}
      id="export-ig-profile"
      className={`w-[380px] min-w-[380px] max-w-[380px] h-auto mx-auto p-0 m-0 border-0 shadow-none outline-none transition-all font-sans leading-normal select-none overflow-hidden shrink-0 ${wrapperBgClass}`}
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
        backgroundColor: wrapperBgHex,
      }}
    >
      <div
        id="instagram-profile-preview-card"
        className={`w-full rounded-none border-0 shadow-none outline-none ${themeClasses}`}
      >
      <div className="w-full font-sans leading-normal select-none pb-4">
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-transparent">
          <div className="flex items-center space-x-3 min-w-0">
            <ArrowLeft className="w-5 h-5 cursor-pointer opacity-80 shrink-0" />
            <div className="flex items-center gap-1 font-bold text-[16px] truncate">
              <span id="preview-username" className="truncate">{renderFormattedTextWithAppleEmojis(username || 'username')}</span>
              {(verified === 'ig-blue' || verified === 'blue') && <InstagramVerifiedBadge className="w-[14px] h-[14px] shrink-0" />}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MoreVertical className="w-5 h-5 cursor-pointer opacity-80" />
          </div>
        </div>

        {/* Profile Header (Avatar & Right Column: Name + Stats left-aligned) */}
        <div className="flex items-center gap-3.5 px-4 pt-1">
          {/* Avatar Profile Picture */}
          <div className="relative shrink-0">
            <div className={`w-20 h-20 rounded-full p-[2px] ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-200 border-neutral-300'} border flex items-center justify-center overflow-hidden`}>
              {avatar && avatar.trim() !== '' ? (
                <img
                  id="preview-avatar-img"
                  src={avatar.trim()}
                  alt={username || 'Avatar'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div id="preview-avatar-placeholder" className={`w-full h-full rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-500'} flex items-center justify-center`}>
                  <svg className="w-10 h-10 fill-current opacity-60" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Name & Statistics directly below Name (Left Aligned & Compact) */}
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            {/* Display Name */}
            <div id="preview-name" className={`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-[15px] mb-1 truncate text-left`}>
              {renderFormattedTextWithAppleEmojis(name || 'Name')}
            </div>

            {/* Stats Summary (Posts, Followers, Following - bold, prominent font size & clean horizontal spacing) */}
            <div className="flex items-center justify-start gap-5 sm:gap-6 text-left">
              <div id="preview-stat-posts" className="min-w-0">
                <div id="preview-posts-count" className={`font-bold text-[17px] sm:text-[18px] leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{postsCount || '12'}</div>
                <div className={`text-[13px] ${isDark ? 'text-white' : 'text-gray-900'} font-normal leading-tight mt-0.5`}>posts</div>
              </div>
              <div id="preview-stat-followers" className="min-w-0">
                <div id="preview-followers-count" className={`font-bold text-[17px] sm:text-[18px] leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{followersCount || '12K'}</div>
                <div className={`text-[13px] ${isDark ? 'text-white' : 'text-gray-900'} font-normal leading-tight mt-0.5`}>followers</div>
              </div>
              <div id="preview-stat-following" className="min-w-0">
                <div id="preview-following-count" className={`font-bold text-[17px] sm:text-[18px] leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{followingCount || '120'}</div>
                <div className={`text-[13px] ${isDark ? 'text-white' : 'text-gray-900'} font-normal leading-tight mt-0.5`}>following</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="px-4 pt-3 space-y-1 text-[13px]">
          {/* Bio Text */}
          {hasBio && (
            <div id="preview-bio" className="whitespace-pre-line leading-relaxed">
              {renderFormattedTextWithAppleEmojis(bio)}
            </div>
          )}

          {/* Website Link (Inline SVG & flex items-center gap-1.5 font-medium) */}
          {website && (
            <div className={`flex items-center gap-1.5 font-medium text-[12px] hover:underline cursor-pointer ${isDark ? 'text-[#e0f1ff]' : 'text-[#00376b]'}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span id="preview-website" className="truncate">{website}</span>
            </div>
          )}

          {/* Profile Music Container (Bentuk Kapsul) - Posisikan tepat di bawah Bio dan Link */}
          {showMusicBadge && (musicTitle || musicArtist) && (
            <div
              id="preview-profile-music"
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 w-max mt-1 select-none ${
                isDark ? 'bg-[#262626] text-white' : 'bg-gray-100 text-black'
              }`}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="shrink-0"
              >
                <path d="M6 4l14 8-14 8V4z" />
              </svg>
              <span className="text-[11px] truncate max-w-[220px] inline-flex items-center gap-1">
                {musicTitle && <span className="font-bold">{renderFormattedTextWithAppleEmojis(musicTitle)}</span>}
                {musicArtist && <span className="font-normal opacity-90">{renderFormattedTextWithAppleEmojis(musicArtist)}</span>}
              </span>
            </div>
          )}

          {/* Mutual Friends Section */}
          <div
            id="preview-mutual-friends"
            className={`pt-1 flex items-center space-x-2 text-[11px] ${
              showMutualFriends ? 'flex' : 'hidden'
            }`}
          >
            <div className="flex -space-x-1.5 shrink-0 items-center">
              {data.mutualFriendsAvatars && data.mutualFriendsAvatars.filter((av) => typeof av === 'string' && av.trim() !== '').length > 0 ? (
                data.mutualFriendsAvatars.filter((av) => typeof av === 'string' && av.trim() !== '').slice(0, 3).map((av, idx) => (
                  <img
                    key={idx}
                    src={av.trim()}
                    alt="Mutual friend"
                    className={`w-4 h-4 rounded-full object-cover border ${isDark ? 'border-black' : 'border-white'}`}
                  />
                ))
              ) : (
                <>
                  <div className={`w-4 h-4 rounded-full bg-neutral-600 border ${isDark ? 'border-black' : 'border-white'}`} />
                  <div className={`w-4 h-4 rounded-full bg-neutral-500 border ${isDark ? 'border-black' : 'border-white'}`} />
                  <div className={`w-4 h-4 rounded-full bg-neutral-400 border ${isDark ? 'border-black' : 'border-white'}`} />
                </>
              )}
            </div>
            <span className={`truncate font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Followed by {renderFormattedTextWithAppleEmojis(mutualFriendsText || '')}
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="px-4 pt-3 flex items-center space-x-2">
          <button
            id="preview-btn-follow"
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all text-center ${buttonBgPrimary}`}
          >
            {renderFormattedTextWithAppleEmojis(isFollowing ? 'Following' : (followButtonText || 'Follow'))}
          </button>

          <button
            id="preview-btn-message"
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all text-center ${buttonBgSecondary}`}
          >
            {renderFormattedTextWithAppleEmojis(messageButtonText || 'Message')}
          </button>

          <button className={`p-1.5 rounded-xl transition-all ${buttonBgSecondary}`}>
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Highlights Row (Sorotan) */}
        {shouldShowHighlights && <div className="px-4 pt-4 pb-2 overflow-x-auto no-scrollbar">
          <div id="preview-highlights-container" className="flex items-center space-x-4 min-w-max">
            {visibleHighlights.map((hl, idx) => (
                <div key={hl.id || idx} className="flex flex-col items-center space-y-1.5">
                  <div className={`w-16 h-16 rounded-full p-[2px] ${theme === 'dark' ? 'bg-neutral-800 border-neutral-700/80' : 'bg-neutral-200 border-neutral-300'} border flex items-center justify-center overflow-hidden`}>
                    {hl.image && hl.image.trim() !== '' ? (
                      <img
                        id={`preview-highlight-img-${idx}`}
                        src={hl.image.trim()}
                        alt={hl.title || 'Highlight'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div
                        id={`preview-highlight-placeholder-${idx}`}
                        className={`w-full h-full rounded-full ${theme === 'dark' ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-200 text-neutral-400'} flex items-center justify-center`}
                      >
                        <svg className="w-6 h-6 fill-current opacity-40" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span
                    id={`preview-highlight-text-${idx}`}
                    className="text-[11px] font-medium text-center truncate max-w-[68px]"
                  >
                    {renderFormattedTextWithAppleEmojis((hl.title && hl.title.trim() !== '') ? hl.title : `Highlight ${idx + 1}`)}
                  </span>
                </div>
              ))}
          </div>
        </div>}
        {/* Tab Navigation Icons (Grid / Reels / Tagged) */}
        <div className={`border-t ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'} mt-2 flex items-center justify-around`}>
          {/* Tab 1: Grid (9 squares) */}
          <button
            id="preview-tab-grid"
            onClick={() => setActiveTab('grid')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-all ${
              activeTab === 'grid' ? activeTabStyle : inactiveTabStyle
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

          {/* Tab 2: Reels (Clapper with play icon) - Controlled by showReelsTab */}
          <button
            id="preview-tab-reels"
            onClick={() => setActiveTab('reels')}
            className={`flex-1 py-3 justify-center items-center border-b-2 transition-all ${
              showReelsTab ? 'flex' : 'hidden'
            } ${activeTab === 'reels' ? activeTabStyle : inactiveTabStyle}`}
          >
            <svg className="w-6 h-6 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="8" y1="3" x2="11" y2="9" />
              <line x1="14" y1="3" x2="17" y2="9" />
              <path d="M10 12l5 3-5 3v-6z" fill="currentColor" stroke="none" />
            </svg>
          </button>

          {/* Tab 3: Tagged (Square with user silhouette) */}
          <button
            id="preview-tab-tagged"
            onClick={() => setActiveTab('tagged')}
            className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-all ${
              activeTab === 'tagged' ? activeTabStyle : inactiveTabStyle
            }`}
          >
            <svg className="w-6 h-6 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 18c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
            </svg>
          </button>
        </div>

        {/* Post Grid Section (3 Columns grid-cols-3) - Render 4:5 aspect ratio boxes */}
        {(() => {
          const allPosts = gridPosts || [];
          if (allPosts.length === 0) {
            return (
              <div id="preview-post-grid-empty" className="py-12 text-center text-xs text-neutral-400 font-medium">
                No posts yet
              </div>
            );
          }
          return (
            <div id="preview-post-grid" className="grid grid-cols-3 gap-0.5 bg-transparent">
              {allPosts.map((post, idx) => {
                const hasImage = Boolean(post && post.image && post.image.trim() !== '');
                return (
                  <div
                    key={post.id || idx}
                    id={`preview-grid-box-${idx}`}
                    className={`aspect-[4/5] relative overflow-hidden group flex items-center justify-center ${
                      hasImage
                        ? (isDark ? 'bg-white/5' : 'bg-black/5')
                        : (isDark ? 'bg-[#1a1a1a] border border-neutral-800/60' : 'bg-neutral-200/70 border border-neutral-300/30')
                    }`}
                  >
                    {hasImage ? (
                      <img
                        id={`preview-grid-img-${idx}`}
                        src={post.image}
                        alt={`Post ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className={`w-6 h-6 ${isDark ? 'text-neutral-600' : 'text-neutral-400'} opacity-60`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}

                    {/* Optional Pin / Carousel Badges on Top Right */}
                    {post.isPinned && (
                      <div className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full text-white backdrop-blur-xs">
                        <Pin className="w-3 h-3 fill-current rotate-45 text-white" />
                      </div>
                    )}

                    {!post.isPinned && post.isCarousel && (
                      <div className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full text-white backdrop-blur-xs">
                        <Layers className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  </div>
  );
};
