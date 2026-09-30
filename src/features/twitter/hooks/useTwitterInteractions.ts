import React from 'react';
import { TwitterPostData } from '../../../types';

export const useTwitterInteractions = (data: TwitterPostData, onChange?: (updated: TwitterPostData) => void) => {
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
    const nextLiked = !data.isLikedByMe;
    const nextLikes = toggleCount(data.likes, !!data.isLikedByMe);
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
    const nextRetweeted = !data.isRetweetedByMe;
    const nextRetweets = toggleCount(data.retweets, !!data.isRetweetedByMe);
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
    const isBookmarked = !!(data.isBookmarkedByMe || data.isSavedByMe);
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
    if (!data.replies || !data.replies[index]) return;
    const updatedReplies = [...data.replies];
    const target = updatedReplies[index];
    const nextLikes = toggleCount(target.likes, !!target.isLiked);
    updatedReplies[index] = {
      ...target,
      isLiked: !target.isLiked,
      likes: nextLikes,
    };
    if (onChange) {
      onChange({ ...data, replies: updatedReplies });
    }
  };

  const handleToggleReplyRetweet = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!data.replies || !data.replies[index]) return;
    const updatedReplies = [...data.replies];
    const target = updatedReplies[index];
    const nextRetweets = toggleCount(target.retweets, !!target.isRetweeted);
    updatedReplies[index] = {
      ...target,
      isRetweeted: !target.isRetweeted,
      retweets: nextRetweets,
    };
    if (onChange) {
      onChange({ ...data, replies: updatedReplies });
    }
  };

  const handleToggleReplyBookmark = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!data.replies || !data.replies[index]) return;
    const updatedReplies = [...data.replies];
    const target = updatedReplies[index];
    const nextBookmarks = toggleCount(target.bookmarks, !!target.isBookmarked);
    updatedReplies[index] = {
      ...target,
      isBookmarked: !target.isBookmarked,
      bookmarks: nextBookmarks,
    };
    if (onChange) {
      onChange({ ...data, replies: updatedReplies });
    }
  };

  return {
    handleToggleLike,
    handleToggleRetweet,
    handleToggleBookmark,
    handleToggleReplyLike,
    handleToggleReplyRetweet,
    handleToggleReplyBookmark
  };
};
