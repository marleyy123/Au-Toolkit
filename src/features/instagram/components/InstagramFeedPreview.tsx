import React from 'react';
import { InstagramFeedData } from '../../../types';
import { DEFAULT_AVATAR } from '../../../data/defaultTemplates';
import { renderFormattedTextWithAppleEmojis } from '../../../utils/emojiUtils';
import { resolveLocalImageReference } from '../../../utils/imageManager';
import { useLanguage } from '../../../context/LanguageContext';
import {
  InstagramVerifiedBadge,
  InstagramHeartIcon,
  InstagramCommentIcon,
  InstagramRepostIcon,
  InstagramSendIcon,
  InstagramBookmarkIcon,
  InstagramGlossyRepostBadge,
} from './InstagramIcons';

interface Props {
  data: InstagramFeedData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

const ReposterAvatar: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [loadedSource, setLoadedSource] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoadedSource(null);
    if (!src) return () => { cancelled = true; };

    const prepareSource = async () => {
      const cleanSource = src.trim();
      if (!cleanSource) return;
      const resolvedSource = cleanSource.startsWith('au-local-media://')
        ? await resolveLocalImageReference(cleanSource)
        : cleanSource;
      if (cancelled || !resolvedSource) return;

    const image = new Image();
    image.onload = () => {
      if (!cancelled && image.naturalWidth > 0 && image.naturalHeight > 0) {
          setLoadedSource(resolvedSource);
      }
    };
    image.onerror = () => {
      if (!cancelled) setLoadedSource(null);
    };
      image.src = resolvedSource;
    };

    void prepareSource();

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!loadedSource) {
    return (
      <svg viewBox="0 0 24 24" aria-label={alt} className="w-8 h-8 text-white fill-current">
        <circle cx="12" cy="7.5" r="4.5" />
        <path d="M4 19.5c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    );
  }

  return (
    <img
      src={loadedSource}
      alt={alt}
      className="w-full h-full object-cover rounded-full"
      referrerPolicy="no-referrer"
      onError={() => setLoadedSource(null)}
    />
  );
};

export const InstagramFeedPreview: React.FC<Props> = ({ data, previewRef }) => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const {
    username,
    avatar,
    hasStoryRing,
    location,
    audioTrack,
    showLocation,
    locationText,
    showMusic,
    musicText,
    subtitleMode,
    verified,
    isPrivate,
    mediaImages,
    aspectRatio,
    likesCount,
    likedByUsername,
    caption,
    commentsCount,
    timestamp,
    isLikedByMe,
    isSavedByMe,
    theme,
    comments,
    showRepost = true,
    repostCount = '6.135',
    showRepostCount = true,
    showRepostBubbleNotes = true,
    reposters = [],
  } = (data || {}) as any;

  const [activeImageIdx, setActiveImageIdx] = React.useState(0);

  const validMediaImages = (Array.isArray(mediaImages) ? mediaImages : []).filter(
    (img: any) => typeof img === 'string' && img.trim() !== ''
  );
  const safeAvatar = (avatar && typeof avatar === 'string' && avatar.trim() !== '') ? avatar.trim() : DEFAULT_AVATAR;

  const isDark = theme === 'dark';
  const themeClasses = isDark ? 'bg-black text-white' : 'bg-white text-black';
  const subtextClass = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const headerTextColor = isDark ? 'text-white' : 'text-gray-900';
  const subtitleTextColor = isDark ? 'text-white' : 'text-gray-700';

  const activeLocation = locationText !== undefined ? locationText : (location || '');
  const activeMusic = musicText !== undefined ? musicText : (audioTrack || '');
  const displayLikesCount = typeof likesCount === 'string' && likesCount.trim() !== '' ? likesCount.trim() : '2.000';
  const displayCommentsCount = typeof commentsCount === 'string' && commentsCount.trim() !== '' ? commentsCount.trim() : '1.8K';

  let activeSubtitle: 'none' | 'location' | 'music' = 'none';
  if (subtitleMode) {
    activeSubtitle = subtitleMode;
  } else if (showMusic) {
    activeSubtitle = 'music';
  } else if (showLocation) {
    activeSubtitle = 'location';
  } else if (activeMusic && !activeLocation) {
    activeSubtitle = 'music';
  } else if (activeLocation) {
    activeSubtitle = 'location';
  }

  const aspectClass = {
    '1:1': 'aspect-square',
    '4:5': 'aspect-[4/5]',
    '9:16': 'aspect-[9/16]',
    '16:9': 'aspect-[16/9]',
  }[aspectRatio] || 'aspect-[4/5]';

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <span key={idx} className={`${isDark ? 'text-[#e0f1ff]' : 'text-[#00376b]'} font-medium hover:underline cursor-pointer`}>
            {part}
          </span>
        );
      }
      return <React.Fragment key={idx}>{renderFormattedTextWithAppleEmojis(part)}</React.Fragment>;
    });
  };

  const wrapperBg = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';
  const wrapperBgHex = theme === 'dark' ? '#000000' : '#ffffff';

  return (
    <div
      ref={previewRef}
      id="export-ig-feed"
      className={`w-[380px] min-w-[380px] max-w-[380px] mx-auto p-0 m-0 border-0 shadow-none outline-none transition-all font-sans leading-normal select-none overflow-hidden shrink-0 ${wrapperBg}`}
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
        backgroundColor: wrapperBgHex,
      }}
    >
      <div
        id="instagram-feed-preview-card"
        className={`w-full rounded-none border-0 shadow-none outline-none overflow-hidden ${themeClasses}`}
      >
        <div className="w-full leading-normal">
          {/* Post Header */}
        <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Profile Avatar */}
            <div className="shrink-0">
              <img
                src={safeAvatar}
                alt={username || 'username'}
                className="w-8 h-8 rounded-full object-cover bg-slate-200"
              />
            </div>

            <div className="flex flex-col min-w-0 leading-tight">
              <div className="flex items-center gap-1 font-semibold text-[14px] leading-tight">
                <span className="truncate">{renderFormattedTextWithAppleEmojis(username || 'username')}</span>
                {verified === 'ig-blue' && <InstagramVerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
              </div>

              {/* Condition 1: Subtitle - Lokasi */}
              {activeSubtitle === 'location' && (
                <div className={`text-[12px] font-normal mt-0.5 truncate ${subtitleTextColor}`}>
                  {renderFormattedTextWithAppleEmojis(activeLocation || 'New York, USA')}
                </div>
              )}

              {/* Condition 2: Subtitle - Musik */}
              {activeSubtitle === 'music' && (
                <div className={`flex items-center gap-1.5 mt-0.5 text-[12px] font-normal truncate ${subtitleTextColor}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                    <path d="M21 3v12.5a3.5 3.5 0 1 1-3.5-3.5c.54 0 1.05.13 1.5.36V6.5h-7v9a3.5 3.5 0 1 1-3.5-3.5c.54 0 1.05.13 1.5.36V3h11z"/>
                  </svg>
                  <span className="truncate">
                    {(() => {
                      const displayMusic = activeMusic || 'Artist • Song Title';
                      if (displayMusic.includes('•')) {
                        const parts = displayMusic.split('•').map((s) => s.trim());
                        return (
                          <>
                            <span className="font-normal">{renderFormattedTextWithAppleEmojis(parts[0])}</span>
                            <span className="font-normal mx-1">•</span>
                            <span className="font-normal">{renderFormattedTextWithAppleEmojis(parts.slice(1).join(' • '))}</span>
                          </>
                        );
                      }
                      return <span className="font-normal">{renderFormattedTextWithAppleEmojis(displayMusic)}</span>;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button className="p-1 text-neutral-400 hover:text-neutral-200">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 14a2 2 0 100-4 2 2 0 000 4zm-6 0a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </div>

        {/* Post Image Media */}
        <div className={`relative w-full overflow-hidden ${isDark ? 'bg-neutral-950' : 'bg-slate-100'} ${aspectClass}`}>
          {validMediaImages.length > 0 ? (
            <img
              src={validMediaImages[activeImageIdx] || validMediaImages[0]}
              alt="Instagram Post"
              className="w-full h-full object-cover block border-0 outline-none"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
              No image uploaded
            </div>
          )}

          {showRepost && Array.isArray(reposters) && reposters.length > 0 && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 pointer-events-none select-none">
              {reposters.map((reposter: any, index: number) => {
                const avatarSource = typeof reposter.avatar === 'string' ? reposter.avatar.trim() : '';
                const note = typeof reposter.username === 'string' ? reposter.username.trim() : '';
                const normalizedNote = note.toLowerCase();
                const isPlaceholder = !note || normalizedNote === 'reposter' || normalizedNote === 'reposter1' || normalizedNote === 'reposter2';
                const displayNote = isPlaceholder ? (isId ? 'Catatan...' : 'Note...') : note;
                const offsetClass = index % 2 === 1 ? '-translate-y-1.5' : 'translate-y-1.5';

                return (
                  <div key={reposter.id || index} className={`relative ${offsetClass}`}>
                    <div className="relative w-14 h-14 rounded-full bg-[#8e949e] shadow-xl flex items-center justify-center shrink-0 overflow-visible">
                      {showRepostBubbleNotes && (
                        <div className="absolute bottom-[calc(100%-6px)] left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center w-max max-w-[140px]">
                          <div className={`relative px-3 py-1.5 rounded-[18px] max-w-[130px] min-w-[46px] text-center flex items-center justify-center min-h-[28px] border shadow-lg backdrop-blur-md ${
                            isDark
                              ? 'bg-[#262626]/95 border-white/15 text-white shadow-black/40'
                              : 'bg-white/95 border-black/10 text-black shadow-black/20'
                          }`}>
                            <span className="text-[11px] leading-tight break-words max-w-[120px] text-center">
                              {renderFormattedTextWithAppleEmojis(displayNote)}
                            </span>
                            <span className={`absolute -bottom-1.5 left-3.5 w-2 h-2 rounded-full border ${
                              isDark ? 'bg-[#262626] border-white/15' : 'bg-white border-black/10'
                            }`} />
                            <span className={`absolute -bottom-[14.5px] left-[17px] w-1.5 h-1.5 rounded-full border ${
                              isDark ? 'bg-[#262626] border-white/15' : 'bg-white border-black/10'
                            }`} />
                          </div>
                        </div>
                      )}

                      <ReposterAvatar src={avatarSource} alt={note || 'Reposter'} />

                      <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center filter drop-shadow-md">
                        <InstagramGlossyRepostBadge className="w-[18px] h-[18px]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Carousel Counter & Dots */}
          {validMediaImages.length > 1 && (
            <>
              <div className="absolute top-3 right-3 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                {activeImageIdx + 1}/{validMediaImages.length}
              </div>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5">
                {validMediaImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === activeImageIdx ? 'bg-blue-500 w-2.5' : 'bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-1.5">
              <button className="hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center">
                <InstagramHeartIcon filled={isLikedByMe} className="w-[23px] h-[23px]" />
              </button>
              <span className="text-[13px] font-semibold tracking-tight leading-none select-none">{renderFormattedTextWithAppleEmojis(displayLikesCount)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center">
                <InstagramCommentIcon className="w-[23px] h-[23px]" />
              </button>
              <span className="text-[13px] font-semibold tracking-tight leading-none select-none">{renderFormattedTextWithAppleEmojis(displayCommentsCount)}</span>
            </div>
            {showRepost && (
              <div className="flex items-center gap-1.5">
                <button className="hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center text-inherit" aria-label="Repost">
                  <InstagramRepostIcon className="w-[23px] h-[23px]" strokeWidth={2} />
                </button>
                {showRepostCount && (
                  <span className="text-[13px] font-semibold tracking-tight leading-none select-none">
                    {repostCount && repostCount.trim() !== '' ? repostCount : '6.135'}
                  </span>
                )}
              </div>
            )}
            <button className="hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center">
              <InstagramSendIcon className="w-[23px] h-[23px]" strokeWidth={1.9} />
            </button>
          </div>

          <button className="hover:opacity-75 transition-opacity cursor-pointer flex items-center justify-center">
            <InstagramBookmarkIcon filled={isSavedByMe} className="w-[23px] h-[23px]" />
          </button>
        </div>

        {/* Likes Count */}
        <div className="px-3 text-[14px] font-semibold">
          <span>
            {isId ? 'Disukai oleh' : 'Liked by'} <span className="font-bold">{renderFormattedTextWithAppleEmojis(likedByUsername || 'Jungkook')}</span> {isId ? 'dan' : 'and'} <span className="font-bold">{renderFormattedTextWithAppleEmojis(displayLikesCount)} {isId ? 'lainnya' : 'others'}</span>
          </span>
        </div>

        {/* Caption */}
        {caption && (
          <div className="px-3 pt-1.5 text-[14px] leading-snug break-words">
            <span className="font-semibold mr-1.5">{renderFormattedTextWithAppleEmojis(username || 'username')}</span>
            <span>{renderFormattedText(caption)}</span>
          </div>
        )}

        {/* View Comments Count */}
        <div className={`px-3 pt-1 text-[13px] cursor-pointer ${subtextClass}`}>
          {isId ? `Lihat semua ${displayCommentsCount} komentar` : `View all ${displayCommentsCount} comments`}
        </div>

        {/* Recent Fake Comments */}
        {comments && comments.length > 0 && (
          <div className="px-3 pt-1 space-y-1 text-[13px]">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start justify-between">
                <div className="pr-2 leading-snug">
                  <span className="font-semibold mr-1.5">{renderFormattedTextWithAppleEmojis(comment.username || 'username')}</span>
                  <span>{renderFormattedText(comment.content || 'Is my lyrics quiz here')}</span>
                </div>
                <button className="pt-0.5 text-neutral-400 hover:text-rose-500">
                  <InstagramHeartIcon filled={comment.isLiked} className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`px-3 pt-1.5 pb-1.5 text-[10px] tracking-wider uppercase ${subtextClass}`}>
          {timestamp ? timestamp.toUpperCase() : (isId ? '1 JAM YANG LALU' : '1 HOUR AGO')}
        </div>
      </div>
    </div>
  </div>
  );
};
