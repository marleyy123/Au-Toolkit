export type PlatformTab =
  | 'twitter'
  | 'instagram-feed'
  | 'instagram-feed-comments'
  | 'instagram-story'
  | 'instagram-story-reply'
  | 'instagram-story-viewers'
  | 'instagram-profile'
  | 'instagram-live'
  | 'instagram-notes'
  | 'instagram-activity'
  | 'instagram-dm-inbox'
  | 'instagram-dm'
  | 'whatsapp-chat'
  | 'whatsapp-status'
  | 'whatsapp-viewers'
  | 'whatsapp-call'
  | 'tiktok-profile'
  | 'tiktok-feed-live'
  | 'tiktok-fyp'
  | 'ios-lockscreen'
  | 'ios-notification'
  | 'push-notification'
  | 'notifications'
  | 'notes'
  | 'line-chat'
  | 'spotify-card';

export type PlatformGroup = 'x' | 'instagram' | 'whatsapp' | 'tiktok' | 'ios' | 'line' | 'notes' | 'notifications' | 'spotify';

export type VerifiedType = 'none' | 'blue' | 'gold' | 'gray' | 'ig-blue';

export type TwitterTheme = 'light' | 'dim' | 'dark';
export type InstagramTheme = 'light' | 'dark';

export interface ReplyItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: VerifiedType;
  content: string;
  timestamp: string;
  likes: string;
  isLiked?: boolean;
  replyingTo?: string;
  retweets?: string;
  isRetweeted?: boolean;
  bookmarks?: string;
  isBookmarked?: boolean;
}

export interface InstagramComment {
  id: string;
  username: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: string;
  isLiked?: boolean;
}

export interface InstagramReposter {
  id: string;
  avatar: string;
  username: string;
}

export interface TwitterPostData {
  name: string;
  handle: string;
  avatar: string;
  verified: VerifiedType;
  isLocked?: boolean;
  replyingTo?: string;
  content: string;
  mediaImages: string[];
  showPlayButton?: boolean;
  showQuoteTweet?: boolean;
  quoteTweetName?: string;
  quoteTweetHandle?: string;
  quoteTweetAvatar?: string;
  quoteTweetVerified?: VerifiedType;
  quoteTweetDate?: string;
  quoteTweetContent?: string;
  quoteTweetImages?: string[];
  quoteTweetShowPlayButton?: boolean;
  time: string;
  date: string;
  clientApp: string;
  retweets: string;
  quotes: string;
  likes: string;
  bookmarks: string;
  views: string;
  isLikedByMe: boolean;
  isRetweetedByMe: boolean;
  isBookmarkedByMe: boolean;
  isSavedByMe?: boolean;
  theme: TwitterTheme;
  showMetrics: boolean;
  replies: ReplyItem[];
}

export interface InstagramFeedData {
  username: string;
  avatar: string;
  hasStoryRing: boolean;
  location?: string;
  audioTrack?: string;
  showLocation?: boolean;
  locationText?: string;
  showMusic?: boolean;
  musicText?: string;
  subtitleMode?: 'none' | 'location' | 'music';
  verified: VerifiedType;
  isPrivate: boolean;
  mediaImages: string[];
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9';
  likesCount: string;
  likedByUsername?: string;
  caption: string;
  commentsCount: string;
  timestamp: string;
  isLikedByMe: boolean;
  isSavedByMe: boolean;
  theme: InstagramTheme;
  comments: InstagramComment[];
  showRepost?: boolean;
  repostCount?: string;
  showRepostCount?: boolean;
  showRepostBubbleNotes?: boolean;
  reposters?: InstagramReposter[];
}

export interface InstagramFeedCommentReply {
  id: string;
  username: string;
  avatar: string;
  verified?: VerifiedType;
  content: string;
  timestamp: string;
  likes: string;
  isLiked?: boolean;
  isAuthor?: boolean;
}

export interface InstagramFeedCommentItem {
  id: string;
  username: string;
  avatar: string;
  verified?: VerifiedType;
  content: string;
  timestamp: string;
  likes: string;
  isLiked?: boolean;
  isAuthor?: boolean;
  isPinned?: boolean;
  replies?: InstagramFeedCommentReply[];
  showReplies?: boolean;
}

export interface InstagramFeedCommentsData {
  theme: InstagramTheme;
  postImage?: string;
  showPostImage?: boolean;
  postAuthorUsername?: string;
  postAuthorAvatar?: string;
  postAuthorVerified?: VerifiedType;
  postCaption?: string;
  postTimeAgo?: string;
  showPostCaptionHeader?: boolean;
  userAvatar?: string;
  userUsername?: string;
  headerTitle?: string;
  sortFilter?: string;
  commentsCount?: string;
  comments: InstagramFeedCommentItem[];
  inputPlaceholder?: string;
  quickReactions?: string[];
  aspectRatio?: '9:16' | '4:5' | '1:1';
}

export interface InstagramStorySticker {
  id: string;
  type: 'text' | 'location' | 'music' | 'mention' | 'question' | 'poll';
  text?: string;
  subtext?: string;
  bgColor?: string;
  textColor?: string;
  positionX: number; // percentage 0-100
  positionY: number; // percentage 0-100
  fontSize?: number;
}

export interface InstagramStoryData {
  username: string;
  avatar: string;
  timeAgo: string;
  verified: VerifiedType;
  mediaImage: string;
  bgGradient: string;
  stickers: InstagramStorySticker[];
  showReplyBar: boolean;
  storyCount?: number;
  activeStoryIndex?: number;
  activeStoryProgress?: number; // percentage 0-100
  isCloseFriends?: boolean;
  musicTitle?: string;
  musicArtist?: string;
  showCommentOverlay?: boolean;
  commentOverlayText?: string;
  commentOverlayAvatars?: string[];
  commentOverlayBubbleColor?: 'dark' | 'light';
  theme: InstagramTheme;
  // Story Reply Mode fields
  isStoryReplyMode?: boolean;
  replyMessageText?: string;
  showQuickReactions?: boolean;
  showKeyboard?: boolean;
  keyboardTheme?: 'dark' | 'light';
  emojis?: string[];
}

export interface InstagramHighlight {
  id: string;
  title: string;
  image: string;
}

export interface InstagramGridPost {
  id: string;
  image: string;
  isPinned?: boolean;
  isCarousel?: boolean;
}

export interface InstagramProfileData {
  username: string;
  name: string;
  avatar: string;
  verified: VerifiedType;
  postsCount: string;
  followersCount: string;
  followingCount: string;
  bio: string;
  website: string;
  showThreadsBadge: boolean;
  threadsHandle?: string;
  showMusicBadge: boolean;
  musicTitle?: string;
  musicArtist?: string;
  showMutualFriends: boolean;
  mutualFriendsText?: string;
  mutualFriendsAvatars?: string[];
  followButtonText: string;
  messageButtonText: string;
  isFollowing: boolean;
  highlights: InstagramHighlight[];
  gridPosts: InstagramGridPost[];
  showReelsTab: boolean;
  theme: InstagramTheme;
}

export interface AUFolder {
  id: string;
  name: string;
  data: any;
  order?: number;
  updatedAt?: string;
  handle?: string;
  avatar?: string;
  verified?: VerifiedType;
  profileData?: any;
}

export interface CharacterPreset {
  id: string;
  name: string;
  order?: number;
  updatedAt?: string;
  handle?: string;
  avatar?: string;
  verified?: VerifiedType;
  profileData?: any;
  data?: any;
}

export interface InstagramLiveComment {
  id: string;
  type?: 'comment' | 'join';
  username: string;
  avatar?: string;
  content?: string;
}

export interface InstagramLiveData {
  username: string;
  avatar: string;
  verified: VerifiedType;
  viewerCount: string;
  mediaImage?: string;
  isAutoEmojiEnabled?: boolean;
  comments: InstagramLiveComment[];
  theme: InstagramTheme;
}

export interface InstagramNoteItem {
  id: string;
  text: string;
  songTitle?: string;
  artistName?: string;
  avatarUrl: string;
  username: string;
  isYourNote: boolean;
  isOnline: boolean;
  showLocationOff?: boolean;
}

export interface InstagramNotesData {
  theme: InstagramTheme;
  notes: InstagramNoteItem[];
  username?: string;
  avatar?: string;
  profileName?: string;
  profileUsername?: string;
}

export interface InstagramStoryReplyData {
  username?: string;
  avatarUrl?: string;
  timeAgo?: string;
  storyImageUrl?: string;
  storyImage?: string;
  backgroundImage?: string;
  bgImage?: string;
  subLabel?: string;
  messageText?: string;
  theme?: 'dark' | 'light';
  showKeyboard?: boolean;
  showQuickReactions?: boolean;
  emojis?: string[];
  timeString?: string;
  storySegmentsCount?: number;
  activeSegmentIndex?: number;
  activeSegmentProgress?: number;
}

export interface WhatsAppChatMessage {
  id: string;
  sender: 'incoming' | 'outgoing' | 'me' | 'other' | 'system';
  type?: 'text' | 'image' | 'sticker' | 'missed_voice_call' | 'missed_video_call' | 'date_divider' | 'divider' | 'unread_divider' | 'system' | 'recalled';
  text?: string;
  caption?: string;
  imageUrl?: string;
  imageUrls?: string[];
  photoWidth?: number;
  extraPhotosText?: string;
  stickerUrl?: string;
  time: string;
  isRead?: boolean;
  status?: 'sent' | 'delivered' | 'read' | 'recalled';
  isRecalled?: boolean;
  deletedForMe?: boolean;
  senderName?: string;
  senderColor?: string;
  showReplyQuote?: boolean;
  replyToMessageId?: string;
  replyToText?: string;
  replyToSender?: string;
  replyBarColor?: string;
  replySenderColor?: string;
  unreadDividerStyle?: 'pill' | 'banner';
  unreadDividerBgColor?: string;
  unreadDividerTextColor?: string;
  unreadDividerBorderColor?: string;
  unreadDividerGap?: number;
  unreadDividerPadding?: number;
  dateDividerGap?: number;
  systemAction?: 'blocked' | 'unblocked' | 'encrypted' | 'custom';
  systemGap?: number;
}

export interface WhatsAppChatData {
  contactName: string;
  contactAvatar: string;
  isGroupChat?: boolean;
  groupParticipants?: string;
  isOnline?: boolean;
  statusText?: string;
  dateDivider?: string;
  showUnreadDivider?: boolean;
  unreadDividerText?: string;
  unreadDividerStyle?: 'pill' | 'banner';
  unreadDividerBgColor?: string;
  unreadDividerTextColor?: string;
  unreadDividerBorderColor?: string;
  unreadDividerGap?: number;
  unreadDividerPadding?: number;
  showHeader?: boolean;
  showInputBar?: boolean;
  inputText?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
  deviceMode?: 'ios' | 'android';
  theme: 'light' | 'dark';
  chatWallpaper?: string;
  sameSenderGap?: number;
  differentSenderGap?: number;
  dateDividerGap?: number;
  bubbleRoundness?: number;
  bubbleWidthPercent?: number;
  messageFontSize?: number;
  useCustomColors?: boolean;
  activeThemePreset?: string;
  barBgColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  inputBgColor?: string;
  cameraBgColor?: string;
  cameraIconColor?: string;
  chatBgColor?: string;
  senderBubbleColor?: string;
  receiverBubbleColor?: string;
  mainTextColor?: string;
  secondaryTextColor?: string;
  timestampColor?: string;
  iconColor?: string;
  missedCallCircleBg?: string;
  showDoodlePattern?: boolean;
  messages: WhatsAppChatMessage[];
}

export interface WhatsAppStatusData {
  contactName: string;
  contactAvatar: string;
  timestamp: string; // e.g. "Today, 10:45"
  contentType: 'image' | 'text';
  mediaImage?: string;
  statusText?: string;
  textBgColor?: string;
  textColor?: string;
  textStatusFont?: string;
  fontStyle?: 'default' | 'inter' | 'montserrat' | 'poppins' | 'playfair' | 'cinzel' | 'caveat' | 'oswald' | 'serif' | 'sans' | 'script' | 'bold' | 'custom' | string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | '300' | '400' | '600' | '700' | '800' | string;
  customFontName?: string;
  customFontUrl?: string;
  fontSize?: number; // e.g. 24, 28
  lineHeight?: number; // e.g. 1.4
  captionText?: string;
  theme?: 'dark' | 'light';
  aspectRatio?: '9:16' | '4:5' | '1:1';
  progressSegmentsCount?: number;
  activeSegmentIndex?: number;
  activeSegmentProgress?: number;
  showReply?: boolean;
  showViewCount?: boolean;
  showReplyBar?: boolean;
  replyPlaceholder?: string;
  viewCount?: string;
}

export interface WhatsAppViewerItem {
  id: string;
  name: string;
  avatar: string;
  time: string; // e.g. "Today, 14:22"
  isLiked?: boolean; // WhatsApp green heart reaction badge (outlined)
  hasRing?: boolean; // WhatsApp green status ring around avatar
}

export interface WhatsAppViewersData {
  contactName?: string; // e.g. "My Status"
  contactAvatar?: string;
  timestamp?: string; // e.g. "2 dtk" or "Baru saja"
  contentType?: 'image' | 'text';
  mediaImage?: string;
  statusText?: string;
  textBgColor?: string;
  textColor?: string;
  fontStyle?: string;
  fontWeight?: string;
  customFontName?: string;
  customFontUrl?: string;
  fontSize?: number;
  lineHeight?: number;
  captionText?: string;
  viewCount: string; // e.g. "0" or "14"
  viewedByLabel?: string; // e.g. "Dilihat oleh"
  emptyStateText?: string; // e.g. "Belum ada tayangan"
  showInstagramIcon?: boolean;
  showAndroidNavBar?: boolean;
  progressSegmentsCount?: number;
  activeSegmentIndex?: number;
  activeSegmentProgress?: number;
  statusThumbnail?: string;
  statusTextSnippet?: string;
  viewers: WhatsAppViewerItem[];
  theme?: 'dark' | 'light';
  aspectRatio?: '9:16' | '4:5' | '1:1';
}

export interface WhatsAppCallData {
  contactName: string;
  contactAvatar: string;
  callDuration: string;
  callStatusText?: string;
  callWallpaper?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
  theme?: 'light' | 'dark';
  isSpeakerActive?: boolean;
  isMuted?: boolean;
  isVideoActive?: boolean;
}

export interface TikTokGridVideo {
  id: string;
  thumbnail: string;
  views: string;
  isPinned?: boolean;
}

export interface TikTokHighlight {
  id: string;
  image: string;
  title: string;
}

export interface TikTokProfileData {
  profileName: string;
  handle: string;
  avatarUrl: string;
  followingCount: string;
  followersCount: string;
  likesCount: string;
  bio: string;
  linkUrl: string;
  isVerified?: boolean;
  showOrders?: boolean;
  showQnA?: boolean;
  showStoryRing?: boolean;
  isFollowing?: boolean;
  showHighlights?: boolean;
  highlights?: TikTokHighlight[];
  activeTab?: 'grid' | 'shop' | 'repost' | 'private' | 'saved' | 'hidden';
  videos: TikTokGridVideo[];
  theme?: 'light' | 'dark';
}

export interface TikTokFeedLiveData {
  liveImage: string;
  avatarUrl: string;
  username: string;
  caption: string;
  isVerified?: boolean;
  locationText?: string;
  activeNavTab?: 'following' | 'foryou' | 'friends' | 'location' | 'stem' | 'live';
  unreadInboxCount?: string;
  theme?: 'dark' | 'light';
}

export interface TikTokFypData {
  mediaImage: string;
  avatarUrl: string;
  username: string;
  displayName?: string;
  isVerified?: boolean;
  postTime?: string;
  caption: string;
  soundName?: string;
  soundAuthor?: string;
  soundCover?: string;
  locationText?: string;
  activeNavTab?: 'following' | 'foryou' | 'friends' | 'location';
  
  // Engagement counts & states
  likesCount: string;
  isLiked?: boolean;
  commentsCount: string;
  bookmarksCount: string;
  isBookmarked?: boolean;
  sharesCount: string;
  isFollowed?: boolean;

  // Repost Status ("Memposting Ulang")
  showReposted?: boolean;
  repostedByText?: string;
  repostedByAvatar?: string;

  unreadInboxCount?: string;
  theme?: 'dark' | 'light';
}

export interface InstagramStoryViewerItem {
  id: string;
  username: string;
  avatar: string;
  likedStory?: boolean;
}

export interface InstagramStoryViewersData {
  storyImage: string;
  storyImages?: string[];
  activeSlideIndex?: number;
  viewerCount: string;
  viewers: InstagramStoryViewerItem[];
  theme?: 'dark' | 'light';
}

export type LockscreenAppType = 'whatsapp' | 'instagram' | 'twitter';

export interface LockscreenNotificationMessage {
  id: string;
  senderName: string;
  messageText: string;
  timeAgo?: string;
  avatarUrl?: string;
  appType?: LockscreenAppType;
}

export interface IOSLockscreenData {
  appType: LockscreenAppType;
  lockscreenTime: string;
  lockscreenDate: string;
  wallpaperImage?: string;
  showWallpaper?: boolean;
  theme?: 'dark' | 'light';
  groupHeaderTitle?: string;
  groupHeaderTime?: string;
  senderName: string;
  messageText: string;
  timeAgo: string;
  avatarUrl: string;
  secondaryMessageText?: string;
  showSecondaryMessage?: boolean;
  aspectRatio?: '9:16' | '4:5' | '1:1';
  notificationList?: LockscreenNotificationMessage[];
}

export type InstagramActivityNotificationType = 'follow' | 'follow_request' | 'mention' | 'like' | 'comment';

export interface InstagramActivityNotification {
  id: string;
  type: InstagramActivityNotificationType;
  username: string;
  avatarUrl: string;
  hasStory?: boolean;
  actionText: string;
  timestamp: string;
  section?: string;
  buttonText?: string;
  secondarySubtext?: string;
  isFollowing?: boolean;
  postThumbnail?: string;
}

export interface InstagramActivityData {
  theme?: 'dark' | 'light';
  aspectRatio?: '1:1' | '4:5' | '9:16';
  showFollowRequests?: boolean;
  followRequestsSubtext?: string;
  followRequestsAvatars?: string[];
  followRequestsUnread?: boolean;
  userAvatar?: string;
  notifications: InstagramActivityNotification[];
}

export type OutgoingColorPreset = 'blue-purple' | 'pink-orange' | 'solid-blue' | 'solid-gray' | 'custom';

export interface InstagramDMMessage {
  id: string;
  sender: 'incoming' | 'outgoing' | 'system';
  senderName?: string;
  senderColor?: string;
  text?: string;
  imageUrl?: string;
  photoStack?: string[];
  photoCount?: number;
  time?: string;
  isLiked?: boolean;
  reactionEmoji?: string;
  showSeen?: boolean;
  seenText?: string;
  showReplyQuote?: boolean;
  replyToMessageId?: string;
  replyToText?: string;
  replyToSender?: string;
  replyBarColor?: string;
  replySenderColor?: string;
  isStoryReply?: boolean;
  storyReplyImageUrl?: string;
  isSystemMessage?: boolean;
  isThemeChange?: boolean;
  themeName?: string;
  isRecalled?: boolean;
}

export interface InstagramDMData {
  username: string;
  name?: string;
  avatar: string;
  verified?: VerifiedType;
  isActiveNow?: boolean;
  activeStatusText?: string;
  theme?: InstagramTheme;
  activeThemePreset?: string;
  activeThemeName?: string;
  customWallpaper?: string;
  outgoingColorMode?: OutgoingColorPreset;
  customStartColor?: string;
  customEndColor?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
  isGroupChat?: boolean;
  groupMembers?: string;
  sameSenderGap?: number;
  differentSenderGap?: number;
  bubbleRoundness?: number;
  useCustomTheme?: boolean;
  customHeaderBg?: string;
  customHeaderTextColor?: string;
  customBgColor?: string;
  customIncomingBg?: string;
  customOutgoingBg?: string;
  customIconColor?: string;
  customCameraBg?: string;
  customCameraIconColor?: string;
  customTextColor?: string;
  customSecondaryTextColor?: string;
  customPillBg?: string;
  containerCornerStyle?: 'sharp' | 'rounded' | 'semi-rounded';
  showTimestamps?: boolean;
  showProfileCard?: boolean;
  showMessageRequestPrompt?: boolean;
  showSeenStatus?: boolean;
  seenText?: string;
  profileSubtitle?: string;
  followersCount?: string;
  postsCount?: string;
  isProfileSaved?: boolean;
  saveProfileBtnText?: string;
  bottomInputText?: string;
  messages: InstagramDMMessage[];
}

export type LineMessageType = 'text' | 'image' | 'sticker' | 'voice_call' | 'video_call' | 'missed_voice_call' | 'missed_video_call' | 'recalled';

export interface LineChatMessage {
  id: string;
  sender: 'incoming' | 'outgoing';
  type?: LineMessageType;
  text?: string;
  imageUrl?: string;
  stickerUrl?: string;
  time: string;
  isRead?: boolean;
  readText?: string;
  senderName?: string;
  senderAvatar?: string;
  bubbleColorOverride?: string;
  textColorOverride?: string;
  isRecalled?: boolean;
}

export type LineThemePreset =
  | 'classic-sky'
  | 'soft-sage'
  | 'yellow-green'
  | 'wine'
  | 'soft-red'
  | 'peach-cream'
  | 'pastel-pink'
  | 'pastel-purple'
  | 'pastel-blue'
  | 'blue-gutter'
  | 'dark'
  | 'custom';

export interface LineChatData {
  contactName: string;
  contactAvatar: string;
  timeBarTime: string;
  batteryLevel?: number;
  showStatusBar?: boolean;
  headerBgStyle?: 'light-gray' | 'glass' | 'wallpaper' | 'custom';
  headerCustomBgColor?: string;
  headerTextColor?: string;
  themePreset?: LineThemePreset | string;
  showPhoneIcon?: boolean;
  chatWallpaperType?: 'default-sky' | 'solid-color' | 'custom-image';
  chatWallpaperColor?: string;
  chatWallpaperUrl?: string;
  useCustomColors?: boolean;
  senderBubbleColor?: string;
  receiverBubbleColor?: string;
  senderTextColor?: string;
  receiverTextColor?: string;
  timestampColor?: string;
  actionIconsColor?: string;
  readTextLabel?: string;
  showReadStatus?: boolean;
  showHeader?: boolean;
  showInputBar?: boolean;
  inputText?: string;
  inputPlaceholder?: string;
  plusButtonColor?: string;
  bottomBarBgColor?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
  sameSenderGap?: number;
  differentSenderGap?: number;
  bubbleRoundness?: number;
  showAvatarOnEveryMessage?: boolean;
  isGroupChat?: boolean;
  groupParticipants?: string;
  messages: LineChatMessage[];
}

export type NotesTheme =
  | 'yellow-pad'
  | 'clean-white'
  | 'dark-oled'
  | 'cream-paper'
  | 'lavender'
  | 'sage-mint'
  | 'peach-blush'
  | 'grid-ruled'
  | 'custom';

export type NotesImageLayout = 'wrap-right' | 'wrap-left' | 'top' | 'bottom' | 'free';

export interface NotesImageItem {
  id: string;
  url: string;
  x: number; // Position X in px relative to 380px container
  y: number; // Position Y in px relative to container
  width: number; // Width in px (e.g. 60 - 360)
  height?: number; // Optional height in px
  rotation?: number; // Rotation in degrees (-45 to 45)
  hasOutline?: boolean; // Outline toggle
  outlineWidth?: number; // Outline thickness in px (1 - 24)
  outlineColor?: string; // Outline hex color
  borderRadius?: number; // Border radius in px (0 - 50)
  shadow?: boolean; // Drop shadow
  layout?: NotesImageLayout;
}

export interface NotesData {
  title: string;
  bodyText: string;
  folderName?: string;
  dateString?: string;
  theme: NotesTheme;
  customBgColor?: string;
  customTextColor?: string;
  customAccentColor?: string;
  fontStyle?: string;
  fontWeight?: string;
  customFontName?: string;
  customFontUrl?: string;
  fontSize?: number; // e.g. 15, 16, 17, 18
  lineHeight?: number; // e.g. 1.6
  textAlign?: 'left' | 'center' | 'right';
  showFolder?: boolean;
  showDate?: boolean;
  showWordCount?: boolean;
  showChecklistBulbs?: boolean;
  showIosHeader?: boolean;
  aspectRatio?: '9:16' | '4:5' | '1:1' | 'auto';
  paperTextureStyle?: 'plain' | 'ruled-lines' | 'grid-pattern' | 'yellow-lines';
  // Image handling & customization in Notes
  images?: NotesImageItem[];
  imageUrl?: string;
  imageX?: number;
  imageY?: number;
  imageWidth?: number;
  imageHeight?: number;
  imageHasOutline?: boolean;
  imageOutlineWidth?: number;
  imageOutlineColor?: string;
  imageBorderRadius?: number;
  imageRotation?: number;
  imageLayout?: NotesImageLayout;
  imageSpacing?: number;
}

export type NotificationAppPlatform = 'whatsapp' | 'instagram' | 'tiktok' | 'x' | 'line' | 'messages' | 'telegram';

export type NotificationThemePreset = 'glass-light' | 'glass-dark' | 'solid-white' | 'solid-dark' | 'custom';

export interface NotificationItem {
  id: string;
  appName?: string;
  platform: NotificationAppPlatform;
  avatarMode?: 'photo' | 'app-icon';
  iconPlatform?: NotificationAppPlatform;
  senderName: string;
  messageText: string;
  timestamp: string;
  avatarUrl: string;
}

export interface PushNotificationData {
  senderName: string;
  messageText: string;
  timestamp: string; // e.g. "now", "10:03", "2m ago"
  avatarUrl: string;
  platform: NotificationAppPlatform;
  appName?: string;
  showAppName?: boolean;
  avatarMode?: 'photo' | 'app-icon';
  iconPlatform?: NotificationAppPlatform;
  theme?: NotificationThemePreset;
  customBgColor?: string;
  customTextColor?: string;
  showAppIconBadge?: boolean;
  showTimestamp?: boolean;
  aspectRatio?: 'auto' | '1:1' | '4:5' | '9:16';
  bannerWidthPercent?: number; // e.g. 70 to 100%
  verticalOffset?: number; // Y-axis vertical position percentage e.g. 0 to 85%
  previewMode?: 'banner-only' | 'lockscreen-bg';
  wallpaperPreset?: 'gradient-purple' | 'ios-astronomy' | 'midnight-dark' | 'spring-flower' | 'sunset-dusk' | 'clean-transparent' | 'custom';
  customWallpaperUrl?: string;
  notificationStackCount?: 1 | 2 | 3;
  additionalNotifications?: NotificationItem[];
  fontStyle?: string;
  fontWeight?: string;
  customFontName?: string;
  customFontUrl?: string;
}

export interface InstagramDMInboxNote {
  id: string;
  username: string;
  avatar: string;
  noteText?: string;
  songTitle?: string;
  artistName?: string;
  isYourNote?: boolean;
  locationStatus?: string; // e.g. "Lokasi nonaktif"
  isOnline?: boolean;
}

export interface InstagramDMInboxConversation {
  id: string;
  username: string;
  name?: string;
  avatar: string;
  verified?: VerifiedType;
  lastMessageSnippet: string; // e.g. "Membalas catatan Anda: apa · 14 jam"
  timeAgo?: string;
  hasUnread?: boolean;
  isDraft?: boolean;
  draftText?: string;
  actionText?: string; // e.g. "Balas?"
  hasStoryRing?: boolean;
  showCameraIcon?: boolean;
}

export interface InstagramDMInboxData {
  theme: InstagramTheme; // 'dark' | 'light'
  accountUsername: string; // e.g. "l0lieeee_"
  searchPlaceholder?: string; // e.g. "Cari atau tanya Meta AI"
  requestsCountText?: string; // e.g. "Permintaan"
  showNotes: boolean;
  notes: InstagramDMInboxNote[];
  conversations: InstagramDMInboxConversation[];
  activeBottomTab?: 'home' | 'search' | 'direct' | 'reels' | 'profile';
  userAvatar?: string;
  aspectRatio?: '1:1' | '4:5' | '9:16';
}

// ==========================================
// Spotify Player Card Generator Types
// ==========================================
export type SpotifyCardStyle = 'classic' | 'minimal' | 'blur' | 'noise' | 'gradient' | 'compact';
export type SpotifyTheme = 'dark' | 'pink' | 'blue' | 'light' | 'amoled';

export interface SpotifyData {
  spotifyUrl: string;
  songTitle: string;
  artistName: string;
  albumName?: string;
  playlistContext?: string; // e.g. "PLAYING FROM PLAYLIST" or "PLAYING FROM ALBUM"
  coverUrl: string;
  
  // Progress & Duration
  currentTime: string; // e.g. "1:42"
  totalDuration: string; // e.g. "3:58"
  progressPercent: number; // 0 - 100

  // Playback States
  isPlaying: boolean;
  isLiked: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  volumePercent?: number; // 0 - 100, speaker volume level

  // Appearance & Styling
  style: SpotifyCardStyle;
  theme: SpotifyTheme;
  cardWidth: number; // e.g. 380
  accentColor?: string; // default Spotify green #1DB954
  aspectRatio?: 'auto' | '1:1' | '4:5' | '9:16';

  // Device & Extra details
  showDeviceBar: boolean;
  deviceName: string; // e.g. "AirPods Pro", "iPhone 15 Pro", "Spotify Connect"
  showLyricsPreview: boolean;
  lyricsSnippet?: string;
  showWatermark?: boolean;
  watermarkText?: string;
}

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}
