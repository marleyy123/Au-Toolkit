import React, { useLayoutEffect } from 'react';
import type { PlatformTab } from '../types';
import { TwitterPreview } from '../components/TwitterPreview';
import { InstagramFeedPreview } from '../components/InstagramFeedPreview';
import { InstagramStoryPreview } from '../components/InstagramStoryPreview';
import { InstagramStoryViewersPreview } from '../components/InstagramStoryViewersPreview';
import { InstagramProfilePreview } from '../components/InstagramProfilePreview';
import { InstagramLivePreview } from '../components/InstagramLivePreview';
import { InstagramNotesPreview } from '../components/InstagramNotesPreview';
import { InstagramActivityPreview } from '../components/InstagramActivityPreview';
import { InstagramDMPreview } from '../components/InstagramDMPreview';
import { InstagramDMInboxPreview } from '../components/InstagramDMInboxPreview';
import { InstagramFeedCommentsPreview } from '../components/InstagramFeedCommentsPreview';
import { WhatsAppChatPreview } from '../components/WhatsAppChatPreview';
import { WhatsAppCallPreview } from '../components/WhatsAppCallPreview';
import { WhatsAppStatusPreview } from '../components/WhatsAppStatusPreview';
import { WhatsAppViewersPreview } from '../components/WhatsAppViewersPreview';
import { TikTokProfilePreview } from '../components/TikTokProfilePreview';
import { TikTokFeedLivePreview } from '../components/TikTokFeedLivePreview';
import { TikTokFypPreview } from '../components/TikTokFypPreview';
import { IOSLockscreenPreview } from '../components/IOSLockscreenPreview';
import { LineChatPreview } from '../components/LineChatPreview';
import { NotesPreview } from '../components/NotesPreview';
import { PushNotificationPreview } from '../components/PushNotificationPreview';
import { SpotifyPlayerPreview } from '../components/SpotifyPlayerPreview';
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
    case 'instagram-story-reply':
      return <InstagramStoryPreview {...shared} />;
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
