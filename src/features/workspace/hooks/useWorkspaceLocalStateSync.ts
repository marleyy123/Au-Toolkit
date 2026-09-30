import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef } from 'react';
import {
  AUFolder,
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
  IOSLockscreenData,
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
import {
  INITIAL_INSTAGRAM_ACTIVITY_DATA,
  INITIAL_INSTAGRAM_DM_DATA,
  INITIAL_INSTAGRAM_DM_INBOX_DATA,
  INITIAL_INSTAGRAM_FEED_COMMENTS_DATA,
  INITIAL_INSTAGRAM_FEED_DATA,
  INITIAL_INSTAGRAM_LIVE_DATA,
  INITIAL_INSTAGRAM_NOTES_DATA,
  INITIAL_INSTAGRAM_PROFILE_DATA,
  INITIAL_INSTAGRAM_STORY_DATA,
  INITIAL_INSTAGRAM_STORY_REPLY_DATA,
  INITIAL_INSTAGRAM_STORY_VIEWERS_DATA,
  INITIAL_IOS_LOCKSCREEN_DATA,
  INITIAL_LINE_CHAT_DATA,
  INITIAL_NOTES_DATA,
  INITIAL_PUSH_NOTIFICATION_DATA,
  INITIAL_SPOTIFY_DATA,
  INITIAL_TIKTOK_FEED_LIVE_DATA,
  INITIAL_TIKTOK_FYP_DATA,
  INITIAL_TIKTOK_PROFILE_DATA,
  INITIAL_TWITTER_DATA,
  INITIAL_WHATSAPP_CALL_DATA,
  INITIAL_WHATSAPP_CHAT_DATA,
  INITIAL_WHATSAPP_STATUS_DATA,
  INITIAL_WHATSAPP_VIEWERS_DATA,
} from '../../../data/defaultTemplates';
import {
  ALL_PLATFORM_TABS,
  getFormStorageKey,
  getModuleFoldersKey,
  loadAllStoredActiveFolderIds,
  loadAllStoredModuleFolders,
  loadStoredFormState,
  markLocalWorkspaceUpdated,
} from '../workspaceStorage';

type Setter<T> = Dispatch<SetStateAction<T>>;

interface UseWorkspaceLocalStateSyncArgs {
  userAccountKey: string;
  activeTab: PlatformTab;
  moduleFolders: Record<string, AUFolder[]>;
  activeFolderIds: Record<string, string>;
  moduleFoldersRef: MutableRefObject<Record<string, AUFolder[]>>;
  activeFolderIdsRef: MutableRefObject<Record<string, string>>;
  triggerCloudWorkspaceSyncRef: MutableRefObject<() => void>;
  setModuleFolders: Setter<Record<string, AUFolder[]>>;
  setActiveFolderIds: Setter<Record<string, string>>;
  getCurrentTabFormData: (tab: PlatformTab) => any;
  loadTabFormData: (tab: PlatformTab, data: any) => void;
  setTwitterData: Setter<TwitterPostData>;
  setInstagramFeedData: Setter<InstagramFeedData>;
  setInstagramStoryData: Setter<InstagramStoryData>;
  setInstagramStoryReplyData: Setter<InstagramStoryReplyData>;
  setInstagramStoryViewersData: Setter<InstagramStoryViewersData>;
  setInstagramProfileData: Setter<InstagramProfileData>;
  setInstagramLiveData: Setter<InstagramLiveData>;
  setInstagramNotesData: Setter<InstagramNotesData>;
  setInstagramActivityData: Setter<InstagramActivityData>;
  setInstagramDMData: Setter<InstagramDMData>;
  setInstagramDMInboxData: Setter<InstagramDMInboxData>;
  setInstagramFeedCommentsData: Setter<InstagramFeedCommentsData>;
  setWhatsAppChatData: Setter<WhatsAppChatData>;
  setWhatsAppCallData: Setter<WhatsAppCallData>;
  setWhatsAppStatusData: Setter<WhatsAppStatusData>;
  setWhatsAppViewersData: Setter<WhatsAppViewersData>;
  setTikTokProfileData: Setter<TikTokProfileData>;
  setTikTokFeedLiveData: Setter<TikTokFeedLiveData>;
  setTikTokFypData: Setter<TikTokFypData>;
  setIosLockscreenData: Setter<IOSLockscreenData>;
  setLineChatData: Setter<LineChatData>;
  setNotesData: Setter<NotesData>;
  setPushNotificationData: Setter<PushNotificationData>;
  setSpotifyData: Setter<SpotifyData>;
}

export function useWorkspaceLocalStateSync({
  userAccountKey,
  activeTab,
  moduleFolders,
  activeFolderIds,
  moduleFoldersRef,
  activeFolderIdsRef,
  triggerCloudWorkspaceSyncRef,
  setModuleFolders,
  setActiveFolderIds,
  getCurrentTabFormData,
  loadTabFormData,
  setTwitterData,
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
  setWhatsAppChatData,
  setWhatsAppCallData,
  setWhatsAppStatusData,
  setWhatsAppViewersData,
  setTikTokProfileData,
  setTikTokFeedLiveData,
  setTikTokFypData,
  setIosLockscreenData,
  setLineChatData,
  setNotesData,
  setPushNotificationData,
  setSpotifyData,
}: UseWorkspaceLocalStateSyncArgs) {
  useEffect(() => {
    const loadForm = <T,>(tab: PlatformTab, defaultVal: T): T => {
      return loadStoredFormState(userAccountKey, tab, defaultVal);
    };

    const initialSpotify = loadForm('spotify-card', INITIAL_SPOTIFY_DATA);
    if (initialSpotify) {
      initialSpotify.style = 'blur';
      if (!['dark', 'pink', 'blue'].includes(initialSpotify.theme)) {
        initialSpotify.theme = 'dark';
      }
      if (initialSpotify.progressPercent === undefined) {
        initialSpotify.progressPercent = 51;
      }
      if (initialSpotify.volumePercent === undefined) {
        initialSpotify.volumePercent = 75;
      }
    }

    setTwitterData(loadForm('twitter', INITIAL_TWITTER_DATA));
    setInstagramFeedData(loadForm('instagram-feed', INITIAL_INSTAGRAM_FEED_DATA));
    setInstagramStoryData(loadForm('instagram-story', INITIAL_INSTAGRAM_STORY_DATA));
    setInstagramStoryReplyData(loadForm('instagram-story-reply', INITIAL_INSTAGRAM_STORY_REPLY_DATA));
    setInstagramStoryViewersData(loadForm('instagram-story-viewers', INITIAL_INSTAGRAM_STORY_VIEWERS_DATA));
    setInstagramProfileData(loadForm('instagram-profile', INITIAL_INSTAGRAM_PROFILE_DATA));
    setInstagramLiveData(loadForm('instagram-live', INITIAL_INSTAGRAM_LIVE_DATA));
    setInstagramNotesData(loadForm('instagram-notes', INITIAL_INSTAGRAM_NOTES_DATA));
    setInstagramActivityData(loadForm('instagram-activity', INITIAL_INSTAGRAM_ACTIVITY_DATA));
    setInstagramDMData(loadForm('instagram-dm', INITIAL_INSTAGRAM_DM_DATA));
    setInstagramDMInboxData(loadForm('instagram-dm-inbox', INITIAL_INSTAGRAM_DM_INBOX_DATA));
    setInstagramFeedCommentsData(loadForm('instagram-feed-comments', INITIAL_INSTAGRAM_FEED_COMMENTS_DATA));
    setWhatsAppChatData(loadForm('whatsapp-chat', INITIAL_WHATSAPP_CHAT_DATA));
    setWhatsAppCallData(loadForm('whatsapp-call', INITIAL_WHATSAPP_CALL_DATA));
    setWhatsAppStatusData(loadForm('whatsapp-status', INITIAL_WHATSAPP_STATUS_DATA));
    setWhatsAppViewersData(loadForm('whatsapp-viewers', INITIAL_WHATSAPP_VIEWERS_DATA));
    setTikTokProfileData(loadForm('tiktok-profile', INITIAL_TIKTOK_PROFILE_DATA));
    setTikTokFeedLiveData(loadForm('tiktok-feed-live', INITIAL_TIKTOK_FEED_LIVE_DATA));
    setTikTokFypData(loadForm('tiktok-fyp', INITIAL_TIKTOK_FYP_DATA));
    setIosLockscreenData(loadForm('ios-lockscreen', INITIAL_IOS_LOCKSCREEN_DATA));
    setLineChatData(loadForm('line-chat', INITIAL_LINE_CHAT_DATA));
    setNotesData(loadForm('notes', INITIAL_NOTES_DATA));
    setPushNotificationData(loadForm('push-notification', INITIAL_PUSH_NOTIFICATION_DATA));
    setSpotifyData(initialSpotify);

    const loadedFolders = loadAllStoredModuleFolders(userAccountKey, ALL_PLATFORM_TABS);
    const loadedActiveIds = loadAllStoredActiveFolderIds(userAccountKey, ALL_PLATFORM_TABS);

    setModuleFolders(loadedFolders);
    moduleFoldersRef.current = loadedFolders;
    setActiveFolderIds(loadedActiveIds);
    activeFolderIdsRef.current = loadedActiveIds;

    ALL_PLATFORM_TABS.forEach((tab) => {
      const tabFolders = loadedFolders[tab] || [];
      const tabFolderId = loadedActiveIds[tab] || tabFolders[0]?.id;
      const currentFolder = tabFolders.find((f) => f.id === tabFolderId) || tabFolders[0];
      if (currentFolder && currentFolder.data) {
        loadTabFormData(tab, currentFolder.data);
      }
    });
  }, [userAccountKey]);

  const previousTabRef = useRef<PlatformTab>(activeTab);
  useEffect(() => {
    const prevTab = previousTabRef.current;
    if (prevTab !== activeTab) {
      let didPersistPreviousTabChange = false;
      const prevFormData = getCurrentTabFormData(prevTab);
      if (prevFormData) {
        const clonedPrevData = JSON.parse(JSON.stringify(prevFormData));
        const prevActiveId = activeFolderIdsRef.current[prevTab] || activeFolderIds[prevTab] || 'folder-1';
        const list = moduleFoldersRef.current[prevTab] || moduleFolders[prevTab];
        if (list && list.length > 0) {
          const currentFolder = list.find((f) => f.id === prevActiveId) || list[0];
          const previousSerialized = JSON.stringify(currentFolder?.data || null);
          const nextSerialized = JSON.stringify(clonedPrevData);

          if (previousSerialized !== nextSerialized) {
            const updated = list.map((f) => (f.id === prevActiveId ? { ...f, data: clonedPrevData } : f));
            moduleFoldersRef.current[prevTab] = updated;
            try {
              localStorage.setItem(getModuleFoldersKey(userAccountKey, prevTab), JSON.stringify(updated));
              localStorage.setItem(getFormStorageKey(userAccountKey, prevTab), JSON.stringify(clonedPrevData));
              markLocalWorkspaceUpdated(userAccountKey);
            } catch {}
            setModuleFolders((prev) => ({ ...prev, [prevTab]: updated }));
            didPersistPreviousTabChange = true;
          }
        }
      }

      const tabFolders = moduleFoldersRef.current[activeTab] || moduleFolders[activeTab];
      if (tabFolders && tabFolders.length > 0) {
        const activeId = activeFolderIdsRef.current[activeTab] || activeFolderIds[activeTab] || tabFolders[0].id;
        const folder = tabFolders.find((f) => f.id === activeId) || tabFolders[0];
        if (folder && folder.data) {
          loadTabFormData(activeTab, folder.data);
        }
      }

      previousTabRef.current = activeTab;
      if (didPersistPreviousTabChange) {
        triggerCloudWorkspaceSyncRef.current?.();
      }
    }
  }, [activeTab, userAccountKey, moduleFolders, activeFolderIds]);
}
