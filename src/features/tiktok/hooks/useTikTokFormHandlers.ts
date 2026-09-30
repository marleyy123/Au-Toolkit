import { Dispatch, SetStateAction, useCallback } from 'react';
import { TikTokFeedLiveData, TikTokFypData, TikTokProfileData } from '../../../types';

interface UseTikTokFormHandlersArgs {
  setTikTokProfileData: Dispatch<SetStateAction<TikTokProfileData>>;
  setTikTokFeedLiveData: Dispatch<SetStateAction<TikTokFeedLiveData>>;
  setTikTokFypData: Dispatch<SetStateAction<TikTokFypData>>;
  updateActiveFolderData: (tab: 'tiktok-profile' | 'tiktok-feed-live' | 'tiktok-fyp', updated: any) => void;
}

export const useTikTokFormHandlers = ({
  setTikTokProfileData,
  setTikTokFeedLiveData,
  setTikTokFypData,
  updateActiveFolderData,
}: UseTikTokFormHandlersArgs) => {
  const handleTikTokProfileDataChange = useCallback((updated: TikTokProfileData) => {
    setTikTokProfileData(updated);
    updateActiveFolderData('tiktok-profile', updated);
  }, [setTikTokProfileData, updateActiveFolderData]);

  const handleTikTokFeedLiveDataChange = useCallback((updated: TikTokFeedLiveData) => {
    setTikTokFeedLiveData(updated);
    updateActiveFolderData('tiktok-feed-live', updated);
  }, [setTikTokFeedLiveData, updateActiveFolderData]);

  const handleTikTokFypDataChange = useCallback((updated: TikTokFypData) => {
    setTikTokFypData(updated);
    updateActiveFolderData('tiktok-fyp', updated);
  }, [setTikTokFypData, updateActiveFolderData]);

  const handleToggleTikTokFypLike = useCallback(() => {
    setTikTokFypData((prev) => ({ ...prev, isLiked: !prev.isLiked }));
  }, [setTikTokFypData]);

  const handleToggleTikTokFypBookmark = useCallback(() => {
    setTikTokFypData((prev) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
  }, [setTikTokFypData]);

  const handleToggleTikTokFypFollow = useCallback(() => {
    setTikTokFypData((prev) => ({ ...prev, isFollowed: !prev.isFollowed }));
  }, [setTikTokFypData]);

  return {
    handleTikTokProfileDataChange,
    handleTikTokFeedLiveDataChange,
    handleTikTokFypDataChange,
    handleToggleTikTokFypLike,
    handleToggleTikTokFypBookmark,
    handleToggleTikTokFypFollow,
  };
};
