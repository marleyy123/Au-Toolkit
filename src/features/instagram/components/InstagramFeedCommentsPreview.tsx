import React, { useState, useRef } from 'react';
import { InstagramFeedCommentsData, InstagramFeedCommentItem, InstagramFeedCommentReply } from '../../../types';
import { DEFAULT_AVATAR } from '../../../data/defaultTemplates';
import { renderFormattedTextWithAppleEmojis } from '../../../utils/emojiUtils';
import { useLanguage } from '../../../context/LanguageContext';
import { InstagramVerifiedBadge, InstagramHeartIcon } from './InstagramIcons';
import { Pin } from 'lucide-react';

interface Props {
  data: InstagramFeedCommentsData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const InstagramFeedCommentsPreview: React.FC<Props> = ({ data, previewRef }) => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const {
    theme = 'light',
    postImage,
    showPostImage = true,
    userAvatar = DEFAULT_AVATAR,
    headerTitle,
    comments = [],
    inputPlaceholder,
    quickReactions = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'],
    aspectRatio = '9:16',
  } = (data || {}) as any;

  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#121212] text-white' : 'bg-white text-black';
  const subtextClass = isDark ? 'text-neutral-400' : 'text-neutral-500';
  const inputBgClass = isDark ? 'bg-[#262626] border-[#363636] text-white' : 'bg-[#f2f2f2] border-[#e6e6e6] text-black';
  const dividerClass = isDark ? 'border-[#262626]' : 'border-[#efefef]';
  const grabberClass = isDark ? 'bg-neutral-600' : 'bg-neutral-300';
  const mentionLinkClass = isDark ? 'text-[#e0f1ff] font-medium hover:underline' : 'text-[#00376b] font-medium hover:underline';

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '9:16':
      default:
        return 'aspect-[9/16]';
    }
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('@') || part.startsWith('#')) {
        return (
          <span key={idx} className={mentionLinkClass}>
            {part}
          </span>
        );
      }
      return <React.Fragment key={idx}>{renderFormattedTextWithAppleEmojis(part)}</React.Fragment>;
    });
  };

  const hasPostImage = showPostImage !== false && Boolean(postImage && postImage.trim() !== '');

  return (
    <div
      ref={previewRef}
      id="preview-target"
      className={`w-[380px] min-w-[380px] max-w-[380px] shrink-0 ${getAspectClass()} mx-auto overflow-hidden shadow-2xl relative select-none flex flex-col justify-between ${bgClass}`}
      style={{
        borderRadius: 'var(--preview-corner-radius, 0px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* SCROLLABLE MAIN CONTAINER (Post Image + Sheet Grabber + Comments) */}
      <div
        data-chat-scroll="true"
        className="w-full flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col touch-pan-y"
      >
        {/* Optional Collapsible Post Header Image (Scrolls up and collapses away naturally) */}
        {hasPostImage && (
          <div className="w-full p-2.5 shrink-0 transition-transform duration-200">
            <div className="w-full aspect-[4/5] max-h-[320px] rounded-2xl overflow-hidden shadow-md bg-neutral-900 border border-white/10 relative">
              <img
                src={postImage}
                alt="Post media"
                className="w-full h-full object-cover rounded-2xl block"
              />
            </div>
          </div>
        )}

        {/* BOTTOM SHEET HEADER & GRABBER BAR (Clean Centered Title, No Dropdown) */}
        <div className={`w-full pt-2 pb-2.5 px-4 shrink-0 flex flex-col items-center border-b ${dividerClass} sticky top-0 z-20 ${bgClass} bg-opacity-95 backdrop-blur-xs`}>
          {/* Drag Grabber Handle */}
          <div className={`w-9 h-1 rounded-full ${grabberClass} mb-2.5`} />

          {/* Clean Centered Header Title */}
          <div className="w-full flex items-center justify-center">
            <h2 className="text-[15px] font-bold tracking-tight text-center">
              {renderFormattedTextWithAppleEmojis(headerTitle || (isId ? 'Komentar' : 'Comments'))}
            </h2>
          </div>
        </div>

        {/* COMMENTS BODY CONTENT */}
        <div className="w-full flex-1 px-4 py-3 space-y-4">
          {/* Comment Items List */}
          {comments && comments.length > 0 ? (
            comments.map((comment, index) => {
              const hasReplies = comment.replies && comment.replies.length > 0;
              const isRepliesOpen = expandedReplies[comment.id] ?? (comment.showReplies ?? true);
              const displayUsername = comment.username?.trim() || 'username';
              const displayTimestamp = comment.timestamp?.trim() || '1h';
              const displayLikes = comment.likes !== undefined && comment.likes.trim() !== '' ? comment.likes : '12';

              return (
                <div key={comment.id || index} className="space-y-2">
                  {/* Main Comment Row */}
                  <div className="flex items-start space-x-3 group">
                    {/* Commenter Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-neutral-700 mt-0.5">
                      <img
                        src={comment.avatar || DEFAULT_AVATAR}
                        alt={displayUsername}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Comment Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] leading-snug">
                        <span className="font-bold mr-1.5 inline-flex items-center space-x-1">
                          <span>{renderFormattedTextWithAppleEmojis(displayUsername)}</span>
                          {comment.verified === 'ig-blue' && <InstagramVerifiedBadge className="w-3.5 h-3.5 inline-block ml-0.5" />}
                          <span className={`text-[11px] font-normal ${subtextClass} ml-1`}>
                            {displayTimestamp}
                          </span>
                          {comment.isAuthor && (
                            <span className={`text-[11px] font-normal ${subtextClass} ml-0.5`}>
                              • {isId ? 'Pembuat' : 'Author'}
                            </span>
                          )}
                          {comment.isPinned && (
                            <span className="inline-flex items-center text-neutral-400 text-[10px] ml-1">
                              <Pin className="w-3 h-3 rotate-45 text-neutral-400 fill-current mr-0.5" />
                              <span>{isId ? 'Disematkan' : 'Pinned'}</span>
                            </span>
                          )}
                        </span>
                        <div className="text-[13px] font-normal leading-relaxed break-words mt-0.5">
                          {renderFormattedText(comment.content?.trim() ? comment.content : 'This looks incredible! Keep it up 🙌')}
                        </div>
                      </div>

                      {/* Metadata & Actions (Reply, Translation) */}
                      <div className={`text-[11px] ${subtextClass} mt-1.5 flex items-center space-x-3 font-semibold`}>
                        <button type="button" className="cursor-pointer hover:text-white">
                          {isId ? 'Balas' : 'Reply'}
                        </button>
                        <button type="button" className="font-normal cursor-pointer hover:underline">
                          {isId ? 'Lihat terjemahan' : 'See translation'}
                        </button>
                      </div>
                    </div>

                    {/* Like Button (Heart on LEFT, Likes count on RIGHT) */}
                    <div className="shrink-0 flex items-center space-x-1.5 pt-0.5">
                      <button type="button" className="cursor-pointer transition-transform active:scale-125">
                        <InstagramHeartIcon filled={!!comment.isLiked} className="w-3.5 h-3.5" />
                      </button>
                      {displayLikes && displayLikes !== '0' && (
                        <span className={`text-[11px] font-medium ${subtextClass}`}>
                          {displayLikes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nested Replies Section */}
                  {hasReplies && (
                    <div className="pl-11 space-y-3 pt-1">
                      {/* View / Hide Replies Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleReplies(comment.id)}
                        className={`flex items-center space-x-2 text-[11px] font-semibold ${subtextClass} hover:text-white cursor-pointer`}
                      >
                        <div className={`w-6 h-[1px] ${grabberClass}`} />
                        <span>
                          {isRepliesOpen
                            ? (isId ? 'Sembunyikan balasan' : 'Hide replies')
                            : (isId ? `Lihat ${comment.replies!.length} balasan lainnya` : `View ${comment.replies!.length} more replies`)}
                        </span>
                      </button>

                      {/* Render Replies when open */}
                      {isRepliesOpen && (
                        <div className="space-y-3 pt-1">
                          {comment.replies!.map((reply, rIdx) => {
                            const replyUsername = reply.username?.trim() || 'username';
                            const replyTimestamp = reply.timestamp?.trim() || '1h';
                            const replyLikes = reply.likes !== undefined && reply.likes.trim() !== '' ? reply.likes : '12';

                            return (
                              <div key={reply.id || rIdx} className="flex items-start space-x-2.5">
                                {/* Reply Avatar */}
                                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-neutral-700 mt-0.5">
                                  <img
                                    src={reply.avatar || DEFAULT_AVATAR}
                                    alt={replyUsername}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Reply Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12.5px] leading-snug">
                                    <span className="font-bold mr-1.5 inline-flex items-center space-x-0.5">
                                      <span>{renderFormattedTextWithAppleEmojis(replyUsername)}</span>
                                      {reply.verified === 'ig-blue' && <InstagramVerifiedBadge className="w-3 h-3 inline-block ml-0.5" />}
                                      <span className={`text-[10.5px] font-normal ${subtextClass} ml-1`}>
                                        {replyTimestamp}
                                      </span>
                                      {reply.isAuthor && (
                                        <span className={`text-[10.5px] font-normal ${subtextClass} ml-0.5`}>
                                          • {isId ? 'Pembuat' : 'Author'}
                                        </span>
                                      )}
                                    </span>
                                    <div className="text-[12.5px] font-normal leading-relaxed break-words mt-0.5">
                                      {renderFormattedText(reply.content?.trim() ? reply.content : 'Thank you so much! ❤️')}
                                    </div>
                                  </div>

                                  <div className={`text-[10.5px] ${subtextClass} mt-1 flex items-center space-x-2.5 font-semibold`}>
                                    <button type="button" className="cursor-pointer hover:text-white">
                                      {isId ? 'Balas' : 'Reply'}
                                    </button>
                                    <button type="button" className="font-normal cursor-pointer hover:underline">
                                      {isId ? 'Lihat terjemahan' : 'See translation'}
                                    </button>
                                  </div>
                                </div>

                                {/* Reply Like (Heart on LEFT, Likes count on RIGHT) */}
                                <div className="shrink-0 flex items-center space-x-1.5 pt-0.5">
                                  <button type="button" className="cursor-pointer transition-transform active:scale-125">
                                    <InstagramHeartIcon filled={!!reply.isLiked} className="w-3 h-3" />
                                  </button>
                                  {replyLikes && replyLikes !== '0' && (
                                    <span className={`text-[10px] font-medium ${subtextClass}`}>
                                      {replyLikes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-neutral-500 text-xs">
              {isId ? 'Belum ada komentar. Jadilah yang pertama berkomentar!' : 'No comments yet. Be the first to comment!'}
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM QUICK EMOJI REACTION ROW & INPUT BAR */}
      <div className={`w-full shrink-0 border-t ${dividerClass} p-3 space-y-2.5 relative z-20 ${bgClass}`}>
        {/* Deretan Emoji Reaksi Cepat */}
        <div className="flex items-center justify-between px-1">
          {quickReactions.map((emoji, eIdx) => (
            <button
              key={eIdx}
              type="button"
              className="text-lg hover:scale-125 transition-transform cursor-pointer p-0.5"
            >
              {renderFormattedTextWithAppleEmojis(emoji)}
            </button>
          ))}
        </div>

        {/* Input Bar with User Avatar (Clean, no gallery/sticker icons) */}
        <div className="flex items-center space-x-2.5">
          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-neutral-700">
            <img
              src={userAvatar || DEFAULT_AVATAR}
              alt="You"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Input Box */}
          <div className={`flex-1 rounded-full ${inputBgClass} border px-3.5 py-2 flex items-center`}>
            <span className={`text-[13px] truncate ${subtextClass} font-normal`}>
              {renderFormattedTextWithAppleEmojis(inputPlaceholder || (isId ? 'Bergabung dengan percakapan...' : 'Add a comment...'))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
