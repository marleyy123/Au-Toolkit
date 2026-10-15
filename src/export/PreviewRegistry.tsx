import React, { useLayoutEffect } from 'react';
import type { PlatformTab } from '../types';
import { TwitterPreview } from '../features/twitter/components/tweet/TwitterPreview';
import { InstagramFeedPreview } from '../features/instagram/components/feed/InstagramFeedPreview';
import { InstagramStoryPreview } from '../features/instagram/components/story/InstagramStoryPreview';
import { InstagramStoryReplyPreview } from '../features/instagram/components/storyReply/InstagramStoryReplyPreview';
import { InstagramStoryViewersPreview } from '../features/instagram/components/storyViewers/InstagramStoryViewersPreview';
import { InstagramProfilePreview } from '../features/instagram/components/profile/InstagramProfilePreview';
import { InstagramLivePreview } from '../features/instagram/components/live/InstagramLivePreview';
import { InstagramNotesPreview } from '../features/instagram/components/notes/InstagramNotesPreview';
import { InstagramActivityPreview } from '../features/instagram/components/activity/InstagramActivityPreview';
import { InstagramDMPreview } from '../features/instagram/components/dm/InstagramDMPreview';
import { InstagramDMInboxPreview } from '../features/instagram/components/dmInbox/InstagramDMInboxPreview';
import { InstagramFeedCommentsPreview } from '../features/instagram/components/feedComments/InstagramFeedCommentsPreview';
import { WhatsAppChatPreview } from '../features/whatsapp/components/whatsappChat/WhatsAppChatPreview';
import { WhatsAppCallPreview } from '../features/whatsapp/components/whatsappCall/WhatsAppCallPreview';
import { WhatsAppStatusPreview } from '../features/whatsapp/components/whatsappStatus/WhatsAppStatusPreview';
import { WhatsAppViewersPreview } from '../features/whatsapp/components/whatsappViewers/WhatsAppViewersPreview';
import { TikTokProfilePreview } from '../features/tiktok/components/profile/TikTokProfilePreview';
import { TikTokFeedLivePreview } from '../features/tiktok/components/feedLive/TikTokFeedLivePreview';
import { TikTokLivePreview } from '../features/tiktok/components/live/TikTokLivePreview';
import { TikTokFypPreview } from '../features/tiktok/components/fyp/TikTokFypPreview';
import { IOSLockscreenPreview } from '../features/ios/components/lockscreen/IOSLockscreenPreview';
import { LineChatPreview } from '../features/line/components/chat/LineChatPreview';
import { NotesPreview } from '../features/notes/components/notes/NotesPreview';
import { PushNotificationPreview } from '../features/notifications/components/pushNotification/PushNotificationPreview';
import { SpotifyPlayerPreview } from '../features/spotify/components/player/SpotifyPlayerPreview';
import { registerExportContext } from './exportContext';

export interface PreviewRegistryHandlers {
  onChange?: (value: any) => void;
  onUpdateMessageText?: (id: string, text: string) => void;
  onToggleLike?: () => void;
  onToggleBookmark?: () => void;
  onToggleFollow?: () => void;
}

interface PreviewRegistryProps {
  previewKey: PlatformTab;
  data: any;
  previewRef: React.RefObject<HTMLDivElement | null>;
  fontCss: string;
  handlers?: PreviewRegistryHandlers;
}

export function PreviewRegistry({
  previewKey,
  data,
  previewRef,
  fontCss,
  handlers = {},
}: PreviewRegistryProps) {
  useLayoutEffect(() => {
    if (previewRef.current) {
      registerExportContext(previewRef.current, { previewKey, data, fontCss });
    }
  }, [data, fontCss, previewKey, previewRef]);

  const shared = { data, previewRef: previewRef as any };
  switch (previewKey) {
    case 'twitter':
      return <TwitterPreview {...shared} onChange={handlers.onChange} />;
    case 'instagram-feed':
      return <InstagramFeedPreview {...shared} />;
    case 'instagram-story':
      return <InstagramStoryPreview {...shared} />;
    case 'instagram-story-reply':
      return <InstagramStoryReplyPreview ref={previewRef} data={data} onChange={handlers.onChange} />;
    case 'instagram-story-viewers':
      return <InstagramStoryViewersPreview {...shared} />;
    case 'instagram-profile':
      return <InstagramProfilePreview {...shared} />;
    case 'instagram-live':
      return <InstagramLivePreview {...shared} />;
    case 'instagram-notes':
      return <InstagramNotesPreview ref={previewRef as any} data={data} />;
    case 'instagram-activity':
      return <InstagramActivityPreview {...shared} />;
    case 'instagram-dm':
      return <InstagramDMPreview {...shared} onUpdateMessageText={handlers.onUpdateMessageText} onChange={handlers.onChange} />;
    case 'instagram-dm-inbox':
      return <InstagramDMInboxPreview {...shared} />;
    case 'instagram-feed-comments':
      return <InstagramFeedCommentsPreview {...shared} />;
    case 'whatsapp-chat':
      return <WhatsAppChatPreview {...shared} onUpdateMessageText={handlers.onUpdateMessageText} onChange={handlers.onChange} />;
    case 'whatsapp-call':
      return <WhatsAppCallPreview {...shared} onChange={handlers.onChange} />;
    case 'whatsapp-status':
      return <WhatsAppStatusPreview {...shared} onChange={handlers.onChange} />;
    case 'whatsapp-viewers':
      return <WhatsAppViewersPreview {...shared} onChange={handlers.onChange} />;
    case 'tiktok-profile':
      return <TikTokProfilePreview {...shared} onChange={handlers.onChange} />;
    case 'tiktok-feed-live':
      return <TikTokFeedLivePreview {...shared} />;
    case 'tiktok-live':
      return <TikTokLivePreview {...shared} onChange={handlers.onChange} />;
    case 'tiktok-fyp':
      return <TikTokFypPreview {...shared} onToggleLike={handlers.onToggleLike} onToggleBookmark={handlers.onToggleBookmark} onToggleFollow={handlers.onToggleFollow} />;
    case 'ios-lockscreen':
      return <IOSLockscreenPreview {...shared} onChange={handlers.onChange} />;
    case 'line-chat':
      return <LineChatPreview {...shared} onChange={handlers.onChange} onUpdateMessageText={handlers.onUpdateMessageText} />;
    case 'notes':
      return <NotesPreview {...shared} onChange={handlers.onChange} />;
    case 'push-notification':
      return <PushNotificationPreview {...shared} onChange={handlers.onChange} />;
    case 'spotify-card':
      return <SpotifyPlayerPreview {...shared} onChange={handlers.onChange} />;
    default:
      return null;
  }
}
