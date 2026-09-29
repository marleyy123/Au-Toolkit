import React from 'react';
import { TwitterPostData } from '../types';
import { renderFormattedTextWithAppleEmojis } from '../utils/emojiUtils';
import {
  VerifiedBadgeBlue,
  VerifiedBadgeGold,
  VerifiedBadgeGray,
  TwitterLockIcon,
  TwitterReplyIcon,
  TwitterRetweetIcon,
  TwitterHeartIcon,
  TwitterShareIcon,
  TwitterBookmarkIcon,
} from './Icons';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';
import { ArrowLeft, ChevronDown, Lock, Play } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: TwitterPostData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (updated: TwitterPostData) => void;
}

export const TwitterPreview: React.FC<Props> = ({ data, previewRef, onChange }) => {
  const { language } = useLanguage();
  const {
    name,
    handle,
    avatar,
    verified,
    isLocked = false,
    replyingTo,
    content,
    mediaImages,
    showPlayButton = false,
    showQuoteTweet = false,
    quoteTweetName = '',
    quoteTweetHandle = '',
    quoteTweetAvatar,
    quoteTweetVerified = 'none',
    quoteTweetDate = '',
    quoteTweetContent = '',
    quoteTweetImages,
    quoteTweetShowPlayButton = true,
    time,
    date,
    clientApp,
    retweets,
    likes,
    isLikedByMe,
    isRetweetedByMe,
    isBookmarkedByMe,
    isSavedByMe,
    theme,
    replies,
  } = data || {};

  const isBookmarked = !!(isBookmarkedByMe || isSavedByMe);

  const toggleCount = (currentStr: string | undefined, wasActive: boolean): string => {
    if (!currentStr || currentStr.trim() === '') {
      return wasActive ? '0' : '1';
    }
    const cleanStr = currentStr.trim();
    if (/[kmb]$/i.test(cleanStr)) {
      return cleanStr;
    }
    const num = parseInt(cleanStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return wasActive ? '0' : '1';
    const newNum = wasActive ? Math.max(0, num - 1) : num + 1;
    return newNum.toString();
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextLiked = !isLikedByMe;
    const nextLikes = toggleCount(likes, !!isLikedByMe);
    if (onChange) {
      onChange({
        ...data,
        isLikedByMe: nextLiked,
        likes: nextLikes,
      });
    }
  };

  const handleToggleRetweet = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextRetweeted = !isRetweetedByMe;
    const nextRetweets = toggleCount(retweets, !!isRetweetedByMe);
    if (onChange) {
      onChange({
        ...data,
        isRetweetedByMe: nextRetweeted,
        retweets: nextRetweets,
      });
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextBookmarked = !isBookmarked;
    if (onChange) {
      onChange({
        ...data,
        isBookmarkedByMe: nextBookmarked,
        isSavedByMe: nextBookmarked,
      });
    }
  };

  const handleToggleReplyLike = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replies || !replies[index]) return;
    const updatedReplies = [...replies];
    const target = updatedReplies[index];
    if (!target) return;
    const nextLiked = !target.isLiked;
    const nextLikes = toggleCount(target.likes, !!target.isLiked);
    updatedReplies[index] = {
      ...target,
      isLiked: nextLiked,
      likes: nextLikes,
    };
    if (onChange) {
      onChange({
        ...data,
        replies: updatedReplies,
      });
    }
  };

  const handleToggleReplyRetweet = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replies || !replies[index]) return;
    const updatedReplies = [...replies];
    const target = updatedReplies[index];
    if (!target) return;
    const nextRetweeted = !target.isRetweeted;
    const nextRetweets = toggleCount(target.retweets, !!target.isRetweeted);
    updatedReplies[index] = {
      ...target,
      isRetweeted: nextRetweeted,
      retweets: nextRetweets,
    };
    if (onChange) {
      onChange({
        ...data,
        replies: updatedReplies,
      });
    }
  };

  const handleToggleReplyBookmark = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replies || !replies[index]) return;
    const updatedReplies = [...replies];
    const target = updatedReplies[index];
    if (!target) return;
    const nextBookmarked = !target.isBookmarked;
    const nextBookmarks = toggleCount(target.bookmarks, !!target.isBookmarked);
    updatedReplies[index] = {
      ...target,
      isBookmarked: nextBookmarked,
      bookmarks: nextBookmarks,
    };
    if (onChange) {
      onChange({
        ...data,
        replies: updatedReplies,
      });
    }
  };

  const safeTheme = (theme === 'dim' || theme === 'dark') ? theme : 'light';

  // Theme styles
  const themeClasses = {
    light: 'bg-white text-[#0f1419] border-neutral-200',
    dim: 'bg-[#15202b] text-[#f7f9f9] border-[#38444d]',
    dark: 'bg-black text-[#e7e9ea] border-[#2f3336]',
  }[safeTheme];

  const subtextClass = {
    light: 'text-[#536471]',
    dim: 'text-[#8b98a5]',
    dark: 'text-[#71767b]',
  }[safeTheme];

  const borderClass = {
    light: 'border-[#eff3f4]',
    dim: 'border-[#38444d]',
    dark: 'border-[#2f3336]',
  }[safeTheme];

  const threadLineClass = {
    light: 'bg-[#cfd9de]',
    dim: 'bg-[#38444d]',
    dark: 'bg-[#333639]',
  }[safeTheme];

  const avatarRingClass = {
    light: 'ring-white',
    dim: 'ring-[#15202b]',
    dark: 'ring-black',
  }[safeTheme];

  // Format Tweet Text to highlight @mentions and #hashtags
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('@') || part.startsWith('#') || part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <span key={idx} className="text-[#1d9bf0] hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return <React.Fragment key={idx}>{renderFormattedTextWithAppleEmojis(part)}</React.Fragment>;
    });
  };

  // Render Verified Badge
  const renderBadge = (type: typeof verified) => {
    if (type === 'blue' || type === 'ig-blue') return <VerifiedBadgeBlue className="w-4 h-4 shrink-0" />;
    if (type === 'gold') return <VerifiedBadgeGold className="w-4 h-4 shrink-0" />;
    if (type === 'gray') return <VerifiedBadgeGray className="w-4 h-4 shrink-0" />;
    return null;
  };

  // Solid background class & hex for outer export wrapper node
  const wrapperBgClass = {
    light: 'bg-white text-[#0f1419]',
    dim: 'bg-[#15202b] text-[#f7f9f9]',
    dark: 'bg-black text-[#e7e9ea]',
  }[theme];

  const wrapperBgHex = {
    light: '#ffffff',
    dim: '#15202b',
    dark: '#000000',
  }[theme];

  const validMediaImages = (Array.isArray(mediaImages) ? mediaImages : []).filter(
    (img: any) => typeof img === 'string' && img.trim() !== ''
  );
  const validQuoteTweetImages = (Array.isArray(quoteTweetImages) ? quoteTweetImages : []).filter(
    (img: any) => typeof img === 'string' && img.trim() !== ''
  );
  const safeAvatar = (avatar && typeof avatar === 'string' && avatar.trim() !== '') ? avatar.trim() : DEFAULT_AVATAR;
  const safeQuoteTweetAvatar = (quoteTweetAvatar && typeof quoteTweetAvatar === 'string' && quoteTweetAvatar.trim() !== '') ? quoteTweetAvatar.trim() : DEFAULT_AVATAR;

  return (
    <div
      ref={previewRef}
      id="export-twitter"
      className={`w-[480px] min-w-[480px] max-w-[480px] mx-auto p-0 m-0 border-0 shadow-none outline-none transition-all font-sans leading-normal select-none overflow-hidden shrink-0 ${wrapperBgClass}`}
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
        backgroundColor: wrapperBgHex,
      }}
    >
      {/* Top Header */}
      <div className={`px-4 sm:px-5 py-3 flex items-center justify-between border-b ${borderClass}`}>
        <div className="flex items-center">
          <ArrowLeft className="w-5 h-5 text-[#1d9bf0] cursor-pointer" />
        </div>
        <span className="font-bold text-[17px] text-center flex-1 pr-5">Tweet</span>
      </div>

      {/* Main Tweet Content Area */}
      <div className="w-full px-4 sm:px-5 pt-3.5 pb-0">
        {/* User Info Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src={safeAvatar}
              alt={name}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover shrink-0 bg-slate-200"
            />
            <div className="flex flex-col min-w-0 justify-center">
              <div className="flex items-center gap-1 font-bold text-[15px] sm:text-[16px] truncate leading-tight">
                <span className="truncate">{renderFormattedTextWithAppleEmojis(name || 'Name')}</span>

                {/* Lock Icon next to Display Name */}
                {isLocked && (
                  <TwitterLockIcon
                    className={`w-[15px] h-[15px] sm:w-4 sm:h-4 shrink-0 inline-block ${
                      theme === 'dark' || theme === 'dim'
                        ? 'text-white'
                        : 'text-[#0f1419]'
                    }`}
                  />
                )}

                {renderBadge(verified)}
              </div>
              <span className={`text-[14px] sm:text-[15px] truncate ${subtextClass} mt-0.5`}>
                @{renderFormattedTextWithAppleEmojis(handle || 'username')}
              </span>
            </div>
          </div>

          {/* Chevron-down icon top right */}
          <button type="button" className={`p-1.5 rounded-full ${subtextClass} hover:bg-neutral-500/10 transition-colors cursor-pointer`}>
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Replying to indicator */}
        {replyingTo && (
          <div className={`text-[14px] sm:text-[15px] -mt-1 mb-3 ${subtextClass}`}>
            {language === 'id' ? 'Membalas ke' : 'Replying to'} <span className="text-[#1d9bf0] hover:underline cursor-pointer">@{renderFormattedTextWithAppleEmojis(String(replyingTo).replace(/^@/, ''))}</span>
          </div>
        )}

        {/* Tweet Content Text */}
        <div className="text-[16px] sm:text-[17px] whitespace-pre-wrap break-words leading-relaxed mb-3.5 text-inherit">
          {renderFormattedText(content || 'Your text goes here...')}
        </div>

        {/* Media Attachments Grid */}
        {validMediaImages.length > 0 && (
          <div className="relative mb-3.5 overflow-hidden rounded-2xl border border-neutral-500/20">
            {validMediaImages.length === 1 && (
              <img
                src={validMediaImages[0]}
                alt="Tweet attachment"
                className="w-full max-h-[380px] object-cover"
              />
            )}

            {validMediaImages.length === 2 && (
              <div className="grid grid-cols-2 gap-0.5 max-h-[300px]">
                <img src={validMediaImages[0]} alt="Attachment 1" className="w-full h-full object-cover" />
                <img src={validMediaImages[1]} alt="Attachment 2" className="w-full h-full object-cover" />
              </div>
            )}

            {validMediaImages.length === 3 && (
              <div className="grid grid-cols-2 gap-0.5 max-h-[320px]">
                <img src={validMediaImages[0]} alt="Attachment 1" className="w-full h-full object-cover" />
                <div className="grid grid-rows-2 gap-0.5 h-full">
                  <img src={validMediaImages[1]} alt="Attachment 2" className="w-full h-full object-cover" />
                  <img src={validMediaImages[2]} alt="Attachment 3" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {validMediaImages.length >= 4 && (
              <div className="grid grid-cols-2 gap-0.5 max-h-[320px]">
                <img src={validMediaImages[0]} alt="Attachment 1" className="w-full h-full object-cover" />
                <img src={validMediaImages[1]} alt="Attachment 2" className="w-full h-full object-cover" />
                <img src={validMediaImages[2]} alt="Attachment 3" className="w-full h-full object-cover" />
                <img src={validMediaImages[3]} alt="Attachment 4" className="w-full h-full object-cover" />
              </div>
            )}

            {showPlayButton && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/75 flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quote Tweet Box */}
        <div
          id="quote-tweet-box"
          className={`mb-3.5 border ${borderClass} rounded-2xl p-3.5 space-y-2 ${
            showQuoteTweet ? 'block' : 'hidden'
          }`}
        >
          {/* Mini Profile Header */}
          <div className="flex items-center gap-1.5 flex-wrap text-[14px]">
            <img
              src={safeQuoteTweetAvatar}
              alt="Quote avatar"
              className="w-5 h-5 rounded-full object-cover shrink-0 bg-slate-200"
            />
            <span className="font-bold text-[14px] truncate">{renderFormattedTextWithAppleEmojis(quoteTweetName || 'Name')}</span>
            {renderBadge(quoteTweetVerified)}
            <span className={`${subtextClass} text-[13px] truncate`}>@{renderFormattedTextWithAppleEmojis(quoteTweetHandle || 'username')}</span>
            <span className={`${subtextClass} text-[13px]`}>· {renderFormattedTextWithAppleEmojis(quoteTweetDate || '15/07/26')}</span>
          </div>

          {/* Quote Text */}
          <div className="text-[14px] leading-snug">
            {renderFormattedText(quoteTweetContent || 'Your text goes here...')}
          </div>

          {/* Quote Images Grid with Play icon */}
          {validQuoteTweetImages.length > 0 && (
            <div className="relative overflow-hidden rounded-xl border border-neutral-500/20 mt-2">
              {validQuoteTweetImages.length === 1 ? (
                <img src={validQuoteTweetImages[0]} alt="Quote attachment" className="w-full max-h-[250px] object-cover" />
              ) : (
                <div className="grid grid-cols-2 gap-0.5 max-h-[220px]">
                  {validQuoteTweetImages.map((img, idx) => (
                    <img key={idx} src={img} alt={`Quote attachment ${idx + 1}`} className="w-full h-44 object-cover" />
                  ))}
                </div>
              )}
              {quoteTweetShowPlayButton && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-black/75 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata & Timestamp */}
        <div className={`flex flex-wrap items-center space-x-1.5 text-[14px] sm:text-[15px] py-3.5 border-t ${borderClass} ${subtextClass}`}>
          <span>{renderFormattedTextWithAppleEmojis(time || '14.17')}</span>
          <span>·</span>
          <span>{renderFormattedTextWithAppleEmojis(date || '22/07/26')}</span>
          {clientApp && (
            <>
              <span>·</span>
              <span className="text-[#1d9bf0] hover:underline cursor-pointer">{renderFormattedTextWithAppleEmojis(clientApp)}</span>
            </>
          )}
        </div>

        {/* Stats Line */}
        <div className={`py-3.5 border-t ${borderClass} text-[14px] sm:text-[15px] flex flex-wrap gap-x-6 gap-y-1`}>
          <div>
            <span className="font-bold text-inherit">{retweets || '6K'}</span> <span className={subtextClass}>{language === 'id' ? 'Posting Ulang' : 'Retweets'}</span>
          </div>
          <div>
            <span className="font-bold text-inherit">{likes || '40K'}</span> <span className={subtextClass}>{language === 'id' ? 'Suka' : 'Likes'}</span>
          </div>
        </div>

        {/* Action Bar: 5 evenly distributed columns across the full width */}
        <div className={`grid grid-cols-5 items-center w-full py-2.5 px-0 border-t ${borderClass} text-[#6E7A89] bg-transparent`}>
          {/* 1. Reply */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              className="p-2 cursor-pointer bg-transparent text-[#6E7A89] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors border-0 outline-none flex items-center justify-center"
              title="Reply"
            >
              <TwitterReplyIcon className="w-5 h-5 shrink-0 aspect-square" />
            </button>
          </div>

          {/* 2. Repost */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={handleToggleRetweet}
              className={`p-2 cursor-pointer bg-transparent hover:bg-[#00ba7c]/10 rounded-full transition-colors border-0 outline-none flex items-center justify-center ${
                isRetweetedByMe ? 'text-[#00ba7c]' : 'text-[#6E7A89] hover:text-[#00ba7c]'
              }`}
              title="Repost"
            >
              <TwitterRetweetIcon className="w-5 h-5 shrink-0 aspect-square" />
            </button>
          </div>

          {/* 3. Like */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={handleToggleLike}
              className={`p-2 cursor-pointer bg-transparent hover:bg-[#f91880]/10 rounded-full transition-colors border-0 outline-none flex items-center justify-center ${
                isLikedByMe ? 'text-[#f91880]' : 'text-[#6E7A89] hover:text-[#f91880]'
              }`}
              title="Like"
            >
              <TwitterHeartIcon filled={isLikedByMe} className="w-5 h-5 shrink-0 aspect-square" />
            </button>
          </div>

          {/* 4. Bookmark / Saved */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`p-2 cursor-pointer bg-transparent hover:bg-[#1d9bf0]/10 rounded-full transition-colors border-0 outline-none flex items-center justify-center ${
                isBookmarked ? 'text-[#1d9bf0]' : 'text-[#6E7A89] hover:text-[#1d9bf0]'
              }`}
              title="Bookmark"
            >
              <TwitterBookmarkIcon filled={isBookmarked} className="w-5 h-5 shrink-0 aspect-square" />
            </button>
          </div>

          {/* 5. Share */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              className="p-2 cursor-pointer bg-transparent text-[#6E7A89] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors border-0 outline-none flex items-center justify-center"
              title="Share"
            >
              <TwitterShareIcon className="w-5 h-5 shrink-0 aspect-square" />
            </button>
          </div>
        </div>
      </div>

      {/* Replies Section for AU Threading */}
      {replies && replies.length > 0 && (
        <div className={`border-t ${borderClass} pt-1 pb-2`}>
          {replies.map((reply, index) => (
            <div key={reply.id} className="px-4 sm:px-5 flex space-x-3.5 items-stretch relative text-[14px] sm:text-[15px]">
              {/* Left Column: Avatar + Continuous Vertical Thread Connector Line */}
              <div className="relative flex flex-col items-center shrink-0 w-10 sm:w-11 pt-2.5 pb-2.5">
                {/* Continuous Thread Line Logic: 0px gap between consecutive rows */}
                {replies.length > 1 && (
                  <>
                    {/* For all replies except the last: line extends from avatar center down through the bottom edge of the row */}
                    {index < replies.length - 1 && (
                      <div className={`absolute top-[30px] sm:top-[32px] bottom-0 w-[2px] left-1/2 -translate-x-1/2 ${threadLineClass}`} />
                    )}
                    {/* For all replies except the first: line enters from top edge down to avatar center */}
                    {index > 0 && (
                      <div className={`absolute top-0 h-[30px] sm:h-[32px] w-[2px] left-1/2 -translate-x-1/2 ${threadLineClass}`} />
                    )}
                  </>
                )}

                {/* Avatar with theme background ring */}
                <img
                  src={(reply.avatar && typeof reply.avatar === 'string' && reply.avatar.trim() !== '') ? reply.avatar.trim() : DEFAULT_AVATAR}
                  alt={reply.name}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shrink-0 bg-slate-200 relative z-10 ring-4 ${avatarRingClass}`}
                />
              </div>

              {/* Right Column: Reply Content & Hierarchy */}
              <div className="flex-1 min-w-0 pt-2 pb-3">
                {/* Author Name, Badge, Handle, Timestamp */}
                <div className="flex items-center space-x-1.5 flex-wrap leading-tight">
                  <span className="font-bold text-[15px] sm:text-[16px] text-inherit">
                    {renderFormattedTextWithAppleEmojis(reply.name || 'Name')}
                  </span>
                  {renderBadge(reply.verified)}
                  <span className={`${subtextClass} text-[14px]`}>@{renderFormattedTextWithAppleEmojis(reply.handle || 'username')}</span>
                  <span className={`${subtextClass} text-[14px]`}>· {renderFormattedTextWithAppleEmojis(reply.timestamp || '12m')}</span>
                </div>

                {/* "Replying to @username" Tag */}
                <div className={`text-[13px] sm:text-[14px] mt-0.5 mb-1 ${subtextClass}`}>
                  {language === 'id' ? 'Membalas ke ' : 'Replying to '}
                  <span className="text-[#1d9bf0] hover:underline cursor-pointer">
                    @{renderFormattedTextWithAppleEmojis(reply.replyingTo ? String(reply.replyingTo).replace(/^@/, '') : (handle ? String(handle).replace(/^@/, '') : 'username'))}
                  </span>
                </div>

                {/* Text Body */}
                <div className="text-[15px] sm:text-[16px] mt-1 whitespace-pre-wrap leading-relaxed break-words text-inherit">
                  {renderFormattedText(reply.content || 'Your text goes here...')}
                </div>

                {/* Action Bar for Replies: 5 evenly spaced, medium-weight action icons */}
                <div className="flex items-center justify-between max-w-[340px] pt-2.5 text-[#6E7A89]">
                  {/* Reply */}
                  <button
                    type="button"
                    className="p-1.5 -ml-1.5 bg-transparent hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] rounded-full transition-colors border-0 outline-none flex items-center justify-center cursor-pointer"
                    title="Reply"
                  >
                    <TwitterReplyIcon className="w-4 h-4 shrink-0" />
                  </button>

                  {/* Retweet */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleReplyRetweet(index, e)}
                    className={`p-1.5 bg-transparent hover:bg-[#00ba7c]/10 rounded-full transition-colors border-0 outline-none flex items-center space-x-1 cursor-pointer ${
                      reply.isRetweeted ? 'text-[#00ba7c]' : 'hover:text-[#00ba7c]'
                    }`}
                    title="Repost"
                  >
                    <TwitterRetweetIcon className="w-4 h-4 shrink-0" />
                    <span className="text-[12px] font-medium">
                      {reply.retweets !== undefined && reply.retweets !== '' ? reply.retweets : '6K'}
                    </span>
                  </button>

                  {/* Like */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleReplyLike(index, e)}
                    className={`p-1.5 bg-transparent hover:bg-[#f91880]/10 rounded-full transition-colors border-0 outline-none flex items-center space-x-1 cursor-pointer ${
                      reply.isLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'
                    }`}
                    title="Like"
                  >
                    <TwitterHeartIcon filled={!!reply.isLiked} className="w-4 h-4 shrink-0" />
                    <span className="text-[12px] font-medium">
                      {reply.likes !== undefined && reply.likes !== '' ? reply.likes : '40K'}
                    </span>
                  </button>

                  {/* Bookmark */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleReplyBookmark(index, e)}
                    className={`p-1.5 bg-transparent hover:bg-[#1d9bf0]/10 rounded-full transition-colors border-0 outline-none flex items-center space-x-1 cursor-pointer ${
                      reply.isBookmarked ? 'text-[#1d9bf0]' : 'hover:text-[#1d9bf0]'
                    }`}
                    title="Bookmark"
                  >
                    <TwitterBookmarkIcon filled={!!reply.isBookmarked} className="w-4 h-4 shrink-0" />
                    <span className="text-[12px] font-medium">
                      {reply.bookmarks !== undefined && reply.bookmarks !== '' ? reply.bookmarks : '1K'}
                    </span>
                  </button>

                  {/* Share */}
                  <button
                    type="button"
                    className="p-1.5 bg-transparent hover:bg-[#1d9bf0]/10 hover:text-[#1d9bf0] rounded-full transition-colors border-0 outline-none flex items-center justify-center cursor-pointer"
                    title="Share"
                  >
                    <TwitterShareIcon className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
