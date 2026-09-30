import { useState } from 'react';
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
  IOSLockscreenData,
  LineChatData,
  NotesData,
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
import { loadStoredFormState } from '../workspaceStorage';

export function useGeneratorFormStates(userAccountKey: string) {
  const [twitterData, setTwitterData] = useState<TwitterPostData>(() => loadStoredFormState(userAccountKey, 'twitter', INITIAL_TWITTER_DATA));
  const [instagramFeedData, setInstagramFeedData] = useState<InstagramFeedData>(() => loadStoredFormState(userAccountKey, 'instagram-feed', INITIAL_INSTAGRAM_FEED_DATA));
  const [instagramStoryData, setInstagramStoryData] = useState<InstagramStoryData>(() => loadStoredFormState(userAccountKey, 'instagram-story', INITIAL_INSTAGRAM_STORY_DATA));
  const [instagramProfileData, setInstagramProfileData] = useState<InstagramProfileData>(() => loadStoredFormState(userAccountKey, 'instagram-profile', INITIAL_INSTAGRAM_PROFILE_DATA));
  const [instagramLiveData, setInstagramLiveData] = useState<InstagramLiveData>(() => loadStoredFormState(userAccountKey, 'instagram-live', INITIAL_INSTAGRAM_LIVE_DATA));
  const [instagramNotesData, setInstagramNotesData] = useState<InstagramNotesData>(() => loadStoredFormState(userAccountKey, 'instagram-notes', INITIAL_INSTAGRAM_NOTES_DATA));
  const [instagramActivityData, setInstagramActivityData] = useState<InstagramActivityData>(() => loadStoredFormState(userAccountKey, 'instagram-activity', INITIAL_INSTAGRAM_ACTIVITY_DATA));
  const [instagramDMData, setInstagramDMData] = useState<InstagramDMData>(() => loadStoredFormState(userAccountKey, 'instagram-dm', INITIAL_INSTAGRAM_DM_DATA));
  const [instagramDMInboxData, setInstagramDMInboxData] = useState<InstagramDMInboxData>(() => loadStoredFormState(userAccountKey, 'instagram-dm-inbox', INITIAL_INSTAGRAM_DM_INBOX_DATA));
  const [instagramFeedCommentsData, setInstagramFeedCommentsData] = useState<InstagramFeedCommentsData>(() => loadStoredFormState(userAccountKey, 'instagram-feed-comments', INITIAL_INSTAGRAM_FEED_COMMENTS_DATA));
  const [instagramStoryReplyData, setInstagramStoryReplyData] = useState<InstagramStoryReplyData>(() => loadStoredFormState(userAccountKey, 'instagram-story-reply', INITIAL_INSTAGRAM_STORY_REPLY_DATA));
  const [instagramStoryViewersData, setInstagramStoryViewersData] = useState<InstagramStoryViewersData>(() => loadStoredFormState(userAccountKey, 'instagram-story-viewers', INITIAL_INSTAGRAM_STORY_VIEWERS_DATA));
  const [whatsAppChatData, setWhatsAppChatData] = useState<WhatsAppChatData>(() => loadStoredFormState(userAccountKey, 'whatsapp-chat', INITIAL_WHATSAPP_CHAT_DATA));
  const [whatsAppCallData, setWhatsAppCallData] = useState<WhatsAppCallData>(() => loadStoredFormState(userAccountKey, 'whatsapp-call', INITIAL_WHATSAPP_CALL_DATA));
  const [whatsAppStatusData, setWhatsAppStatusData] = useState<WhatsAppStatusData>(() => loadStoredFormState(userAccountKey, 'whatsapp-status', INITIAL_WHATSAPP_STATUS_DATA));
  const [whatsAppViewersData, setWhatsAppViewersData] = useState<WhatsAppViewersData>(() => loadStoredFormState(userAccountKey, 'whatsapp-viewers', INITIAL_WHATSAPP_VIEWERS_DATA));
  const [tikTokProfileData, setTikTokProfileData] = useState<TikTokProfileData>(() => loadStoredFormState(userAccountKey, 'tiktok-profile', INITIAL_TIKTOK_PROFILE_DATA));
  const [tikTokFeedLiveData, setTikTokFeedLiveData] = useState<TikTokFeedLiveData>(() => loadStoredFormState(userAccountKey, 'tiktok-feed-live', INITIAL_TIKTOK_FEED_LIVE_DATA));
  const [tikTokFypData, setTikTokFypData] = useState<TikTokFypData>(() => loadStoredFormState(userAccountKey, 'tiktok-fyp', INITIAL_TIKTOK_FYP_DATA));
  const [iosLockscreenData, setIosLockscreenData] = useState<IOSLockscreenData>(() => loadStoredFormState(userAccountKey, 'ios-lockscreen', INITIAL_IOS_LOCKSCREEN_DATA));
  const [lineChatData, setLineChatData] = useState<LineChatData>(() => loadStoredFormState(userAccountKey, 'line-chat', INITIAL_LINE_CHAT_DATA));
  const [notesData, setNotesData] = useState<NotesData>(() => loadStoredFormState(userAccountKey, 'notes', INITIAL_NOTES_DATA));
  const [pushNotificationData, setPushNotificationData] = useState<PushNotificationData>(() => loadStoredFormState(userAccountKey, 'push-notification', INITIAL_PUSH_NOTIFICATION_DATA));
  const [spotifyData, setSpotifyData] = useState<SpotifyData>(() => loadStoredFormState(userAccountKey, 'spotify-card', INITIAL_SPOTIFY_DATA));

  return {
    twitterData,
    instagramFeedData,
    instagramStoryData,
    instagramProfileData,
    instagramLiveData,
    instagramNotesData,
    instagramActivityData,
    instagramDMData,
    instagramDMInboxData,
    instagramFeedCommentsData,
    instagramStoryReplyData,
    instagramStoryViewersData,
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
    setTwitterData,
    setInstagramFeedData,
    setInstagramStoryData,
    setInstagramProfileData,
    setInstagramLiveData,
    setInstagramNotesData,
    setInstagramActivityData,
    setInstagramDMData,
    setInstagramDMInboxData,
    setInstagramFeedCommentsData,
    setInstagramStoryReplyData,
    setInstagramStoryViewersData,
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
  };
}
