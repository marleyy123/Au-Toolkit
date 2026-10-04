import type { Dispatch, SetStateAction } from 'react';
import type { PlatformTab } from '../../../types';

type Setter<T = any> = Dispatch<SetStateAction<T>>;

type UseTabFormDataRegistryArgs = {
  activeTab: PlatformTab;
  twitterData: any;
  instagramFeedData: any;
  instagramStoryData: any;
  instagramStoryReplyData: any;
  instagramStoryViewersData: any;
  instagramProfileData: any;
  instagramLiveData: any;
  instagramNotesData: any;
  instagramActivityData: any;
  instagramDMData: any;
  instagramDMInboxData: any;
  instagramFeedCommentsData: any;
  whatsAppChatData: any;
  whatsAppCallData: any;
  whatsAppStatusData: any;
  whatsAppViewersData: any;
  tikTokProfileData: any;
  tikTokFeedLiveData: any;
  tikTokFypData: any;
  iosLockscreenData: any;
  lineChatData: any;
  notesData: any;
  pushNotificationData: any;
  spotifyData: any;
  setTwitterData: Setter;
  setInstagramFeedData: Setter;
  setInstagramStoryData: Setter;
  setInstagramStoryReplyData: Setter;
  setInstagramStoryViewersData: Setter;
  setInstagramProfileData: Setter;
  setInstagramLiveData: Setter;
  setInstagramNotesData: Setter;
  setInstagramActivityData: Setter;
  setInstagramDMData: Setter;
  setInstagramDMInboxData: Setter;
  setInstagramFeedCommentsData: Setter;
  setWhatsAppChatData: Setter;
  setWhatsAppCallData: Setter;
  setWhatsAppStatusData: Setter;
  setWhatsAppViewersData: Setter;
  setTikTokProfileData: Setter;
  setTikTokFeedLiveData: Setter;
  setTikTokFypData: Setter;
  setIosLockscreenData: Setter;
  setLineChatData: Setter;
  setNotesData: Setter;
  setPushNotificationData: Setter;
  setSpotifyData: Setter;
};

const clone = (data: any) => JSON.parse(JSON.stringify(data));

export function useTabFormDataRegistry(args: UseTabFormDataRegistryArgs) {
  const updateCurrentTabIdentity = (
    identity: { name?: string; handle?: string; avatar?: string; verified?: any },
    tab: PlatformTab
  ) => {
    const { name, handle, avatar, verified } = identity;

    if (tab === 'twitter') {
      args.setTwitterData((prev: any) => ({
        ...prev,
        name: name !== undefined ? name : prev.name,
        handle: handle !== undefined ? handle : prev.handle,
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? verified : prev.verified,
      }));
    } else if (tab === 'instagram-feed') {
      args.setInstagramFeedData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-story') {
      args.setInstagramStoryData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-story-reply') {
      args.setInstagramStoryReplyData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : prev.username,
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'instagram-story-viewers') {
      args.setInstagramStoryViewersData((prev: any) => ({
        ...prev,
        storyImage: avatar !== undefined && avatar ? avatar : prev.storyImage,
      }));
    } else if (tab === 'instagram-profile') {
      args.setInstagramProfileData((prev: any) => ({
        ...prev,
        name: name !== undefined ? name : prev.name,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-live') {
      args.setInstagramLiveData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'ig-blue') : prev.verified,
      }));
    } else if (tab === 'instagram-notes') {
      args.setInstagramNotesData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : prev.username,
        avatar: avatar !== undefined ? avatar : prev.avatar,
      }));
    } else if (tab === 'instagram-activity') {
      args.setInstagramActivityData((prev: any) => ({
        ...prev,
        userAvatar: avatar !== undefined ? avatar : prev.userAvatar,
      }));
    } else if (tab === 'instagram-dm') {
      args.setInstagramDMData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        name: name !== undefined ? name : prev.name,
        avatar: avatar !== undefined ? avatar : prev.avatar,
        verified: verified !== undefined ? (verified === 'none' ? 'none' : 'blue') : prev.verified,
      }));
    } else if (tab === 'instagram-dm-inbox') {
      args.setInstagramDMInboxData((prev: any) => ({
        ...prev,
        accountUsername: handle !== undefined ? handle : (name !== undefined ? name : prev.accountUsername),
        userAvatar: avatar !== undefined ? avatar : prev.userAvatar,
      }));
    } else if (tab === 'instagram-feed-comments') {
      args.setInstagramFeedCommentsData((prev: any) => ({
        ...prev,
        userUsername: handle !== undefined ? handle : (name !== undefined ? name : prev.userUsername),
        userAvatar: avatar !== undefined ? avatar : prev.userAvatar,
      }));
    } else if (tab === 'whatsapp-chat') {
      args.setWhatsAppChatData((prev: any) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    } else if (tab === 'whatsapp-call') {
      args.setWhatsAppCallData((prev: any) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    } else if (tab === 'whatsapp-status') {
      args.setWhatsAppStatusData((prev: any) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    } else if (tab === 'whatsapp-viewers') {
      args.setWhatsAppViewersData((prev: any) => ({
        ...prev,
        statusThumbnail: avatar !== undefined ? avatar : prev.statusThumbnail,
      }));
    } else if (tab === 'tiktok-profile') {
      args.setTikTokProfileData((prev: any) => ({
        ...prev,
        profileName: name !== undefined ? name : prev.profileName,
        handle: handle !== undefined ? handle : (name !== undefined ? name : prev.handle),
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'tiktok-feed-live') {
      args.setTikTokFeedLiveData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'tiktok-fyp') {
      args.setTikTokFypData((prev: any) => ({
        ...prev,
        username: handle !== undefined ? handle : (name !== undefined ? name : prev.username),
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'ios-lockscreen') {
      args.setIosLockscreenData((prev: any) => ({
        ...prev,
        senderName: name !== undefined ? name : prev.senderName,
        avatarUrl: avatar !== undefined ? avatar : prev.avatarUrl,
      }));
    } else if (tab === 'line-chat') {
      args.setLineChatData((prev: any) => ({
        ...prev,
        contactName: name !== undefined ? name : prev.contactName,
        contactAvatar: avatar !== undefined ? avatar : prev.contactAvatar,
      }));
    }
  };

  const getCurrentTabFormData = (tab: PlatformTab): any => {
    switch (tab) {
      case 'twitter': return args.twitterData;
      case 'instagram-feed': return args.instagramFeedData;
      case 'instagram-story': return args.instagramStoryData;
      case 'instagram-story-reply': return args.instagramStoryReplyData;
      case 'instagram-story-viewers': return args.instagramStoryViewersData;
      case 'instagram-profile': return args.instagramProfileData;
      case 'instagram-live': return args.instagramLiveData;
      case 'instagram-notes': return args.instagramNotesData;
      case 'instagram-activity': return args.instagramActivityData;
      case 'instagram-dm': return args.instagramDMData;
      case 'instagram-dm-inbox': return args.instagramDMInboxData;
      case 'instagram-feed-comments': return args.instagramFeedCommentsData;
      case 'whatsapp-chat': return args.whatsAppChatData;
      case 'whatsapp-call': return args.whatsAppCallData;
      case 'whatsapp-status': return args.whatsAppStatusData;
      case 'whatsapp-viewers': return args.whatsAppViewersData;
      case 'tiktok-profile': return args.tikTokProfileData;
      case 'tiktok-feed-live': return args.tikTokFeedLiveData;
      case 'tiktok-fyp': return args.tikTokFypData;
      case 'ios-lockscreen': return args.iosLockscreenData;
      case 'line-chat': return args.lineChatData;
      case 'notes': return args.notesData;
      case 'push-notification': return args.pushNotificationData;
      case 'spotify-card': return args.spotifyData;
      default: return args.twitterData;
    }
  };

  const loadTabFormData = (tab: PlatformTab, data: any) => {
    const cloned = clone(data);
    if (tab === 'twitter') args.setTwitterData(cloned);
    else if (tab === 'instagram-feed') args.setInstagramFeedData(cloned);
    else if (tab === 'instagram-story') args.setInstagramStoryData(cloned);
    else if (tab === 'instagram-story-reply') args.setInstagramStoryReplyData(cloned);
    else if (tab === 'instagram-story-viewers') args.setInstagramStoryViewersData(cloned);
    else if (tab === 'instagram-profile') args.setInstagramProfileData(cloned);
    else if (tab === 'instagram-live') args.setInstagramLiveData(cloned);
    else if (tab === 'instagram-notes') args.setInstagramNotesData(cloned);
    else if (tab === 'instagram-activity') args.setInstagramActivityData(cloned);
    else if (tab === 'instagram-dm') args.setInstagramDMData(cloned);
    else if (tab === 'instagram-dm-inbox') args.setInstagramDMInboxData(cloned);
    else if (tab === 'instagram-feed-comments') args.setInstagramFeedCommentsData(cloned);
    else if (tab === 'whatsapp-chat') args.setWhatsAppChatData(cloned);
    else if (tab === 'whatsapp-call') args.setWhatsAppCallData(cloned);
    else if (tab === 'whatsapp-status') args.setWhatsAppStatusData(cloned);
    else if (tab === 'whatsapp-viewers') args.setWhatsAppViewersData(cloned);
    else if (tab === 'tiktok-profile') args.setTikTokProfileData(cloned);
    else if (tab === 'tiktok-feed-live') args.setTikTokFeedLiveData(cloned);
    else if (tab === 'tiktok-fyp') args.setTikTokFypData(cloned);
    else if (tab === 'ios-lockscreen') args.setIosLockscreenData(cloned);
    else if (tab === 'line-chat') args.setLineChatData(cloned);
    else if (tab === 'notes') args.setNotesData(cloned);
    else if (tab === 'push-notification') args.setPushNotificationData(cloned);
    else if (tab === 'spotify-card') args.setSpotifyData(cloned);
  };

  const currentPreviewData = getCurrentTabFormData(args.activeTab);

  return {
    updateCurrentTabIdentity,
    getCurrentTabFormData,
    loadTabFormData,
    currentPreviewData,
  };
}
