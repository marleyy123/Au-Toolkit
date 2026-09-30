import { useCallback, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { AppLanguage } from '../../../context/LanguageContext';
import type { UiTheme } from '../../../context/ThemeContext';
import type {
  AUFolder,
  IOSLockscreenData,
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
  LineChatData,
  NotesData,
  PlatformTab,
  PushNotificationData,
  SpotifyData,
  TikTokFeedLiveData,
  TikTokFypData,
  TikTokProfileData,
  TwitterPostData,
  WhatsAppCallData,
  WhatsAppChatData,
  WhatsAppStatusData,
  WhatsAppViewersData,
} from '../../../types';
import { readPersistentUserAssets } from '../../../utils/userAssets';

type UseWorkspacePayloadArgs = {
  activeTab: PlatformTab;
  activeCategory: string;
  authUser: any;
  clientSessionId: string;
  moduleFolders: Record<string, AUFolder[]>;
  activeFolderIds: Record<string, string>;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  uiTheme: UiTheme;
  language: AppLanguage;
  globalFont: string;
  customFontName: string;
  cornerRadius: number;
  getCurrentTabFormData: (tab: PlatformTab) => any;
  twitterData: TwitterPostData;
  instagramFeedData: InstagramFeedData;
  instagramStoryData: InstagramStoryData;
  instagramStoryReplyData: InstagramStoryReplyData;
  instagramStoryViewersData: InstagramStoryViewersData;
  instagramProfileData: InstagramProfileData;
  instagramLiveData: InstagramLiveData;
  instagramNotesData: InstagramNotesData;
  instagramActivityData: InstagramActivityData;
  instagramDMData: InstagramDMData;
  instagramDMInboxData: InstagramDMInboxData;
  instagramFeedCommentsData: InstagramFeedCommentsData;
  whatsAppChatData: WhatsAppChatData;
  whatsAppCallData: WhatsAppCallData;
  whatsAppStatusData: WhatsAppStatusData;
  whatsAppViewersData: WhatsAppViewersData;
  tikTokProfileData: TikTokProfileData;
  tikTokFeedLiveData: TikTokFeedLiveData;
  tikTokFypData: TikTokFypData;
  iosLockscreenData: IOSLockscreenData;
  lineChatData: LineChatData;
  notesData: NotesData;
  pushNotificationData: PushNotificationData;
  spotifyData: SpotifyData;
};

export function useWorkspacePayload({
  activeTab,
  activeCategory,
  authUser,
  clientSessionId,
  moduleFolders,
  activeFolderIds,
  moduleFoldersRef,
  activeFolderIdsRef,
  uiTheme,
  language,
  globalFont,
  customFontName,
  cornerRadius,
  getCurrentTabFormData,
  twitterData,
  instagramFeedData,
  instagramStoryData,
  instagramStoryReplyData,
  instagramStoryViewersData,
  instagramProfileData,
  instagramLiveData,
  instagramNotesData,
  instagramActivityData,
  instagramDMData,
  instagramDMInboxData,
  instagramFeedCommentsData,
  whatsAppChatData,
  whatsAppCallData,
  whatsAppStatusData,
  whatsAppViewersData,
  tikTokProfileData,
  tikTokFeedLiveData,
  tikTokFypData,
  iosLockscreenData,
  lineChatData,
  notesData,
  pushNotificationData,
  spotifyData,
}: UseWorkspacePayloadArgs) {
  const gatherCompleteWorkspacePayload = useCallback(() => {
    const currentFormData = getCurrentTabFormData(activeTab);
    const allFormStates: Record<string, any> = {
      twitter: twitterData,
      'instagram-feed': instagramFeedData,
      'instagram-story': instagramStoryData,
      'instagram-story-reply': instagramStoryReplyData,
      'instagram-story-viewers': instagramStoryViewersData,
      'instagram-profile': instagramProfileData,
      'instagram-live': instagramLiveData,
      'instagram-notes': instagramNotesData,
      'instagram-activity': instagramActivityData,
      'instagram-dm': instagramDMData,
      'instagram-dm-inbox': instagramDMInboxData,
      'instagram-feed-comments': instagramFeedCommentsData,
      'whatsapp-chat': whatsAppChatData,
      'whatsapp-call': whatsAppCallData,
      'whatsapp-status': whatsAppStatusData,
      'whatsapp-viewers': whatsAppViewersData,
      'tiktok-profile': tikTokProfileData,
      'tiktok-feed-live': tikTokFeedLiveData,
      'tiktok-fyp': tikTokFypData,
      'ios-lockscreen': iosLockscreenData,
      'line-chat': lineChatData,
      notes: notesData,
      'push-notification': pushNotificationData,
      'spotify-card': spotifyData,
    };

    if (activeTab && currentFormData) {
      allFormStates[activeTab] = currentFormData;
    }

    const effectiveModuleFolders = moduleFoldersRef.current && Object.keys(moduleFoldersRef.current).length > 0
      ? moduleFoldersRef.current
      : moduleFolders;
    const effectiveActiveFolderIds = activeFolderIdsRef.current && Object.keys(activeFolderIdsRef.current).length > 0
      ? activeFolderIdsRef.current
      : activeFolderIds;

    return {
      userId: authUser?.uid || 'anonymous',
      userEmail: authUser?.email ? authUser.email.toLowerCase() : (authUser?.uid || ''),
      lastActiveTab: activeTab,
      lastActiveCategory: activeCategory,
      updatedBy: clientSessionId,
      formStates: allFormStates,
      moduleFolders: effectiveModuleFolders,
      activeFolderIds: effectiveActiveFolderIds,
      characters: effectiveModuleFolders,
      folderStates: effectiveModuleFolders,
      preferences: {
        uiTheme,
        language,
        globalFont,
        customFontName,
        cornerRadius,
      },
      userAssets: readPersistentUserAssets(authUser?.uid, authUser?.email),
      updatedAt: new Date().toISOString(),
    };
  }, [
    activeTab,
    activeCategory,
    moduleFolders,
    activeFolderIds,
    uiTheme,
    language,
    globalFont,
    customFontName,
    cornerRadius,
    authUser?.email,
    authUser?.uid,
    twitterData,
    instagramFeedData,
    instagramStoryData,
    instagramStoryReplyData,
    instagramStoryViewersData,
    instagramProfileData,
    instagramLiveData,
    instagramNotesData,
    instagramActivityData,
    instagramDMData,
    instagramDMInboxData,
    instagramFeedCommentsData,
    whatsAppChatData,
    whatsAppCallData,
    whatsAppStatusData,
    whatsAppViewersData,
    tikTokProfileData,
    tikTokFeedLiveData,
    tikTokFypData,
    iosLockscreenData,
    lineChatData,
    notesData,
    pushNotificationData,
    spotifyData,
  ]);

  const gatherCompleteWorkspacePayloadRef = useRef(gatherCompleteWorkspacePayload);
  gatherCompleteWorkspacePayloadRef.current = gatherCompleteWorkspacePayload;

  return { gatherCompleteWorkspacePayload, gatherCompleteWorkspacePayloadRef };
}
