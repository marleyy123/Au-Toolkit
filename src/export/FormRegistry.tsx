import React from 'react';
import type { PlatformTab } from '../types';

import { TwitterForm } from '../features/twitter/components/TwitterForm';
import { InstagramFeedForm } from '../features/instagram/components/InstagramFeedForm';
import { InstagramStoryForm } from '../features/instagram/components/InstagramStoryForm';
import { InstagramStoryReplyForm } from '../features/instagram/components/InstagramStoryReplyForm';
import { InstagramStoryViewersForm } from '../features/instagram/components/InstagramStoryViewersForm';
import { InstagramProfileForm } from '../features/instagram/components/InstagramProfileForm';
import { InstagramLiveForm } from '../features/instagram/components/InstagramLiveForm';
import { InstagramNotesForm } from '../features/instagram/components/InstagramNotesForm';
import { InstagramActivityForm } from '../features/instagram/components/InstagramActivityForm';
import { InstagramDMForm } from '../features/instagram/components/InstagramDMForm';
import { InstagramDMInboxForm } from '../features/instagram/components/InstagramDMInboxForm';
import { InstagramFeedCommentsForm } from '../features/instagram/components/InstagramFeedCommentsForm';
import { WhatsAppChatForm } from '../features/whatsapp/components/WhatsAppChatForm';
import { WhatsAppCallForm } from '../features/whatsapp/components/WhatsAppCallForm';
import { WhatsAppStatusForm } from '../features/whatsapp/components/WhatsAppStatusForm';
import { WhatsAppViewersForm } from '../features/whatsapp/components/WhatsAppViewersForm';
import { TikTokProfileForm } from '../features/tiktok/components/TikTokProfileForm';
import { TikTokFeedLiveForm } from '../features/tiktok/components/TikTokFeedLiveForm';
import { TikTokFypForm } from '../features/tiktok/components/TikTokFypForm';
import { IOSLockscreenForm } from '../features/ios/components/IOSLockscreenForm';
import { LineChatForm } from '../features/line/components/LineChatForm';
import { NotesForm } from '../features/notes/components/NotesForm';
import { PushNotificationForm } from '../features/notifications/components/PushNotificationForm';
import { SpotifyPlayerForm } from '../features/spotify/components/SpotifyPlayerForm';

interface Props {
  activeTab: PlatformTab;
  data: any;
  onChange: (updated: any) => void;
  characters: any[];
  activeCharacterId?: string;
  onSaveCharacter: () => void;
  onSaveProfile?: () => void;
  onSelectCharacter: (char: any) => void;
  onDeleteCharacter?: (id: string) => void;
  onRenameCharacter?: (id: string, newName: string) => void;
}

export const FormRegistry: React.FC<Props> = ({ activeTab, ...rest }) => {
  const compKey = `${activeTab}-${rest.activeCharacterId || 'default'}`;
  
  switch (activeTab) {
    case 'twitter': return <TwitterForm key={compKey} {...rest} />;
    case 'instagram-feed': return <InstagramFeedForm key={compKey} {...rest} />;
    case 'instagram-story': return <InstagramStoryForm key={compKey} {...rest} />;
    case 'instagram-story-reply': return <InstagramStoryReplyForm key={compKey} {...rest} />;
    case 'instagram-story-viewers': return <InstagramStoryViewersForm key={compKey} {...rest} />;
    case 'instagram-profile': return <InstagramProfileForm key={compKey} {...rest} />;
    case 'instagram-live': return <InstagramLiveForm key={compKey} {...rest} />;
    case 'instagram-notes': return <InstagramNotesForm key={compKey} {...rest} />;
    case 'instagram-activity': return <InstagramActivityForm key={compKey} {...rest} />;
    case 'instagram-dm': return <InstagramDMForm key={compKey} {...rest} />;
    case 'instagram-dm-inbox': return <InstagramDMInboxForm key={compKey} {...rest} />;
    case 'instagram-feed-comments': return <InstagramFeedCommentsForm key={compKey} {...rest} />;
    case 'whatsapp-chat': return <WhatsAppChatForm key={compKey} {...rest} />;
    case 'whatsapp-call': return <WhatsAppCallForm key={compKey} {...rest} />;
    case 'whatsapp-status': return <WhatsAppStatusForm key={compKey} {...rest} />;
    case 'whatsapp-viewers': return <WhatsAppViewersForm key={compKey} {...rest} />;
    case 'tiktok-profile': return <TikTokProfileForm key={compKey} {...rest} />;
    case 'tiktok-feed-live': return <TikTokFeedLiveForm key={compKey} {...rest} />;
    case 'tiktok-fyp': return <TikTokFypForm key={compKey} {...rest} />;
    case 'ios-lockscreen': return <IOSLockscreenForm key={compKey} {...rest} />;
    case 'line-chat': return <LineChatForm key={compKey} {...rest} />;
    case 'notes': return <NotesForm key={compKey} {...rest} />;
    case 'push-notification': return <PushNotificationForm key={compKey} {...rest} />;
    case 'spotify-card': return <SpotifyPlayerForm key={compKey} {...rest} />;
    default: return null;
  }
};
