import { Dispatch, SetStateAction, useCallback } from 'react';
import {
  InstagramActivityData,
  InstagramDMData,
  InstagramDMInboxData,
  InstagramFeedCommentsData,
  InstagramFeedData,
  InstagramLiveData,
  InstagramNotesData,
  InstagramProfileData,
  InstagramStoryData,
  InstagramStoryReplyData,
  InstagramStoryViewersData,
} from '../../../types';

type InstagramTab =
  | 'instagram-feed'
  | 'instagram-story'
  | 'instagram-story-reply'
  | 'instagram-story-viewers'
  | 'instagram-profile'
  | 'instagram-live'
  | 'instagram-notes'
  | 'instagram-activity'
  | 'instagram-dm'
  | 'instagram-dm-inbox'
  | 'instagram-feed-comments';

interface UseInstagramFormHandlersArgs {
  setInstagramFeedData: Dispatch<SetStateAction<InstagramFeedData>>;
  setInstagramStoryData: Dispatch<SetStateAction<InstagramStoryData>>;
  setInstagramStoryReplyData: Dispatch<SetStateAction<InstagramStoryReplyData>>;
  setInstagramStoryViewersData: Dispatch<SetStateAction<InstagramStoryViewersData>>;
  setInstagramProfileData: Dispatch<SetStateAction<InstagramProfileData>>;
  setInstagramLiveData: Dispatch<SetStateAction<InstagramLiveData>>;
  setInstagramNotesData: Dispatch<SetStateAction<InstagramNotesData>>;
  setInstagramActivityData: Dispatch<SetStateAction<InstagramActivityData>>;
  setInstagramDMData: Dispatch<SetStateAction<InstagramDMData>>;
  setInstagramDMInboxData: Dispatch<SetStateAction<InstagramDMInboxData>>;
  setInstagramFeedCommentsData: Dispatch<SetStateAction<InstagramFeedCommentsData>>;
  updateActiveFolderData: (tab: InstagramTab, updated: any) => void;
}

export const useInstagramFormHandlers = ({
  setInstagramFeedData,
  setInstagramStoryData,
  setInstagramStoryReplyData,
  setInstagramStoryViewersData,
  setInstagramProfileData,
  setInstagramLiveData,
  setInstagramNotesData,
  setInstagramActivityData,
  setInstagramDMData,
  setInstagramDMInboxData,
  setInstagramFeedCommentsData,
  updateActiveFolderData,
}: UseInstagramFormHandlersArgs) => {
  const handleInstagramFeedDataChange = useCallback((updated: InstagramFeedData) => {
    setInstagramFeedData(updated);
    updateActiveFolderData('instagram-feed', updated);
  }, [setInstagramFeedData, updateActiveFolderData]);

  const handleInstagramStoryDataChange = useCallback((updated: InstagramStoryData) => {
    setInstagramStoryData(updated);
    updateActiveFolderData('instagram-story', updated);
  }, [setInstagramStoryData, updateActiveFolderData]);

  const handleInstagramStoryReplyDataChange = useCallback((updated: InstagramStoryReplyData) => {
    setInstagramStoryReplyData(updated);
    updateActiveFolderData('instagram-story-reply', updated);
  }, [setInstagramStoryReplyData, updateActiveFolderData]);

  const handleInstagramStoryViewersDataChange = useCallback((updated: InstagramStoryViewersData) => {
    setInstagramStoryViewersData(updated);
    updateActiveFolderData('instagram-story-viewers', updated);
  }, [setInstagramStoryViewersData, updateActiveFolderData]);

  const handleInstagramProfileDataChange = useCallback((updated: InstagramProfileData) => {
    setInstagramProfileData(updated);
    updateActiveFolderData('instagram-profile', updated);
  }, [setInstagramProfileData, updateActiveFolderData]);

  const handleInstagramLiveDataChange = useCallback((updated: InstagramLiveData) => {
    setInstagramLiveData(updated);
    updateActiveFolderData('instagram-live', updated);
  }, [setInstagramLiveData, updateActiveFolderData]);

  const handleInstagramNotesDataChange = useCallback((updated: InstagramNotesData) => {
    setInstagramNotesData(updated);
    updateActiveFolderData('instagram-notes', updated);
  }, [setInstagramNotesData, updateActiveFolderData]);

  const handleInstagramActivityDataChange = useCallback((updated: InstagramActivityData) => {
    setInstagramActivityData(updated);
    updateActiveFolderData('instagram-activity', updated);
  }, [setInstagramActivityData, updateActiveFolderData]);

  const handleInstagramDMDataChange = useCallback((updated: InstagramDMData) => {
    setInstagramDMData(updated);
    updateActiveFolderData('instagram-dm', updated);
  }, [setInstagramDMData, updateActiveFolderData]);

  const handleInstagramDMInboxDataChange = useCallback((updated: InstagramDMInboxData) => {
    setInstagramDMInboxData(updated);
    updateActiveFolderData('instagram-dm-inbox', updated);
  }, [setInstagramDMInboxData, updateActiveFolderData]);

  const handleInstagramFeedCommentsDataChange = useCallback((updated: InstagramFeedCommentsData) => {
    setInstagramFeedCommentsData(updated);
    updateActiveFolderData('instagram-feed-comments', updated);
  }, [setInstagramFeedCommentsData, updateActiveFolderData]);

  const handleUpdateInstagramDMMessageText = useCallback((id: string, newText: string) => {
    setInstagramDMData((prev) => {
      const updated = {
        ...prev,
        messages: (prev.messages || []).map((msg) =>
          msg.id === id ? { ...msg, text: newText } : msg
        ),
      };
      updateActiveFolderData('instagram-dm', updated);
      return updated;
    });
  }, [setInstagramDMData, updateActiveFolderData]);

  return {
    handleInstagramFeedDataChange,
    handleInstagramStoryDataChange,
    handleInstagramStoryReplyDataChange,
    handleInstagramStoryViewersDataChange,
    handleInstagramProfileDataChange,
    handleInstagramLiveDataChange,
    handleInstagramNotesDataChange,
    handleInstagramActivityDataChange,
    handleInstagramDMDataChange,
    handleInstagramDMInboxDataChange,
    handleInstagramFeedCommentsDataChange,
    handleUpdateInstagramDMMessageText,
  };
};
