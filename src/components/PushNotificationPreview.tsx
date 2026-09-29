import React from 'react';
import { PushNotificationData, NotificationAppPlatform } from '../types';
import { renderIosEmojis } from '../utils/emojiUtils';
import { getFontFamilyCss, getFontWeightNumber } from './FontSelectorDropdown';
import { useLanguage } from '../context/LanguageContext';
import { User } from 'lucide-react';

interface Props {
  data: PushNotificationData;
  previewRef?: React.RefObject<HTMLDivElement>;
  onChange?: (updated: PushNotificationData) => void;
}

export const PushNotificationPreview: React.FC<Props> = ({ data, previewRef }) => {
  const { language } = useLanguage();

  const {
    senderName = 'Alex',
    messageText = 'Hello',
    timestamp = 'now',
    avatarUrl = '',
    platform = 'whatsapp',
    appName,
    theme = 'glass-light',
    customBgColor,
    customTextColor,
    showAppIconBadge = true,
    showTimestamp = true,
    aspectRatio = 'auto',
    customWallpaperUrl,
    notificationStackCount = 1,
    additionalNotifications = [],
    fontStyle = 'default',
    fontWeight = 'normal',
    customFontName,
    customFontUrl,
  } = (data || {}) as any;

  // Platform metadata (App name label & Squircle Icon badge without outlines)
  const getPlatformMeta = (plat: NotificationAppPlatform): {
    defaultName: string;
    badgeBg: string;
    badgeStyle?: React.CSSProperties;
    icon: React.ReactNode;
  } => {
    switch (plat) {
      case 'whatsapp':
        return {
          defaultName: 'WHATSAPP',
          badgeBg: 'bg-[#25D366]',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2ZM12.04 20.15C10.55 20.15 9.09 19.75 7.82 18.99L7.52 18.81L4.41 19.63L5.24 16.6L5.04 16.29C4.21 14.97 3.77 13.46 3.77 11.91C3.77 7.36 7.48 3.64 12.04 3.64C16.6 3.64 20.31 7.35 20.31 11.91C20.31 16.47 16.6 20.15 12.04 20.15ZM16.57 14.39C16.32 14.27 15.1 13.67 14.87 13.58C14.65 13.5 14.48 13.46 14.32 13.7C14.16 13.95 13.69 14.5 13.55 14.67C13.4 14.83 13.26 14.85 13.01 14.73C12.76 14.6 11.97 14.34 11.03 13.51C10.3 12.86 9.8 12.06 9.66 11.81C9.52 11.56 9.64 11.43 9.77 11.3C9.88 11.19 10.02 11.01 10.14 10.87C10.26 10.73 10.3 10.63 10.39 10.46C10.47 10.29 10.43 10.15 10.37 10.03C10.31 9.9 9.82 8.7 9.61 8.21C9.41 7.72 9.21 7.79 9.06 7.78C8.92 7.78 8.75 7.78 8.59 7.78C8.42 7.78 8.16 7.84 7.93 8.09C7.7 8.34 7.06 8.94 7.06 10.16C7.06 11.38 7.95 12.56 8.07 12.72C8.19 12.89 9.81 15.39 12.3 16.46C12.89 16.71 13.35 16.87 13.71 16.98C14.31 17.17 14.85 17.14 15.28 17.08C15.76 17.01 16.77 16.47 16.98 15.88C17.19 15.29 17.19 14.79 17.13 14.68C17.07 14.58 16.82 14.52 16.57 14.39Z" />
            </svg>
          ),
        };
      case 'instagram':
        return {
          defaultName: 'INSTAGRAM',
          badgeBg: 'instagram-icon',
          badgeStyle: {
            background:
              'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
          },
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-none stroke-white stroke-[2.3]">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          ),
        };
      case 'tiktok':
        return {
          defaultName: 'TIKTOK',
          badgeBg: 'bg-black',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[16px] h-[16px] fill-white">
              <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.02 3.25-1.48 3.32-3.29.09-3.97.04-7.94.05-11.91.02-2.45.02-4.91.02-7.37z" />
            </svg>
          ),
        };
      case 'line':
        return {
          defaultName: 'LINE',
          badgeBg: 'bg-[#06C755]',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] fill-white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          ),
        };
      case 'x':
      default:
        return {
          defaultName: 'X',
          badgeBg: 'bg-black',
          icon: (
            <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          ),
        };
    }
  };

  // Theme styling for the floating banner
  const getBannerThemeClasses = () => {
    switch (theme) {
      case 'glass-dark':
        return {
          bg: 'bg-black/65 backdrop-blur-xl border border-white/15 text-white shadow-2xl shadow-black/40',
          appNameColor: 'text-white/60',
          timeColor: 'text-white/50',
          senderColor: 'text-white font-bold',
          messageColor: 'text-white/90',
        };
      case 'solid-white':
        return {
          bg: 'bg-white border border-slate-200/80 text-slate-900 shadow-xl shadow-slate-300/40',
          appNameColor: 'text-slate-400',
          timeColor: 'text-slate-400',
          senderColor: 'text-slate-900 font-bold',
          messageColor: 'text-slate-700',
        };
      case 'solid-dark':
        return {
          bg: 'bg-neutral-900 border border-neutral-800 text-white shadow-2xl shadow-black/50',
          appNameColor: 'text-neutral-400',
          timeColor: 'text-neutral-500',
          senderColor: 'text-white font-bold',
          messageColor: 'text-neutral-200',
        };
      case 'custom':
        return {
          bg: 'shadow-2xl backdrop-blur-md',
          appNameColor: 'opacity-65',
          timeColor: 'opacity-55',
          senderColor: 'font-bold',
          messageColor: 'opacity-90',
        };
      case 'glass-light':
      default:
        return {
          bg: 'bg-white/85 backdrop-blur-xl border border-white/50 text-slate-900 shadow-xl shadow-black/10',
          appNameColor: 'text-slate-500',
          timeColor: 'text-slate-400',
          senderColor: 'text-slate-900 font-bold',
          messageColor: 'text-slate-800',
        };
    }
  };

  const bannerTheme = getBannerThemeClasses();

  // Background styling
  const getBackgroundStyle = () => {
    if (customWallpaperUrl) {
      return {
        backgroundImage: `url(${customWallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    };
  };

  // Render a Single Push Notification Banner Card
  const renderBanner = (
    itemSender: string,
    itemMessage: string,
    itemTime: string,
    itemAvatar: string,
    itemPlat: NotificationAppPlatform,
    itemAppName?: string,
    keyIndex: number = 0,
    itemAvatarMode?: 'photo' | 'app-icon',
    itemIconPlatform?: NotificationAppPlatform
  ) => {
    const effectivePlatform = itemIconPlatform || itemPlat || platform || 'whatsapp';
    const meta = getPlatformMeta(effectivePlatform);
    const displayAppName = itemAppName !== undefined
      ? itemAppName
      : (keyIndex === 0 && appName !== undefined ? appName : meta.defaultName);
    const shouldShowAppName = data.showAppName !== false && Boolean(displayAppName?.trim());
    const useAppIcon = itemAvatarMode === 'app-icon' || (!itemAvatar && itemAvatarMode !== 'photo');

    return (
      <div
        key={keyIndex}
        className={`w-full p-3 sm:p-3.5 rounded-[22px] transition-all relative select-none flex items-center space-x-3 ${bannerTheme.bg}`}
        style={{
          backgroundColor: theme === 'custom' ? (customBgColor || '#FFFFFF') : undefined,
          color: theme === 'custom' ? (customTextColor || '#18181B') : undefined,
          fontFamily: getFontFamilyCss(fontStyle, customFontName, customFontUrl),
        }}
      >
        {/* Profile photo with badge, or the platform's full app icon */}
        <div className="relative shrink-0">
          {useAppIcon ? (
            <div
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${meta.badgeBg || ''} shadow-md`}
              style={meta.badgeStyle}
            >
              <div className="scale-125 [&>svg]:!w-[15px] [&>svg]:!h-[15px]">{meta.icon}</div>
            </div>
          ) : (
            <div className="relative">
              <div className={`w-10 h-10 rounded-full overflow-hidden relative ${theme === 'glass-dark' || theme === 'solid-dark' ? 'bg-slate-700' : 'bg-slate-300'} flex items-center justify-center shadow-xs`}>
                <User className={`w-5 h-5 ${theme === 'glass-dark' || theme === 'solid-dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                {itemAvatar?.trim() && (
                  <img
                    src={itemAvatar.trim()}
                    alt={itemSender}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              {showAppIconBadge && (
                <div className={`absolute -bottom-1 -right-1 w-[25px] h-[25px] rounded-[7.5px] flex items-center justify-center ${meta.badgeBg || ''} shadow-sm`} style={meta.badgeStyle}>
                  {meta.icon}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Content Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {shouldShowAppName ? (
            <>
              <div className="flex items-center justify-between leading-none mb-1">
                <span className={`text-[10px] font-extrabold tracking-wider uppercase truncate max-w-[170px] ${bannerTheme.appNameColor}`}>{displayAppName}</span>
                {showTimestamp && <span className={`text-[11px] font-medium ${bannerTheme.timeColor} shrink-0`}>{itemTime || 'now'}</span>}
              </div>
              <div className={`text-[13.5px] leading-tight truncate ${bannerTheme.senderColor}`} style={{ fontWeight: getFontWeightNumber(fontWeight) > 600 ? 800 : 700 }}>
                {renderIosEmojis(itemSender || 'Alex')}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className={`text-[13.5px] leading-tight truncate ${bannerTheme.senderColor}`} style={{ fontWeight: getFontWeightNumber(fontWeight) > 600 ? 800 : 700 }}>
                {renderIosEmojis(itemSender || 'Alex')}
              </div>
              {showTimestamp && <span className={`text-[11px] font-medium ${bannerTheme.timeColor} shrink-0 leading-none`}>{itemTime || 'now'}</span>}
            </div>
          )}

          {/* Notification Message Text */}
          <div
            className={`text-[13px] leading-snug mt-0.5 break-words select-text ${bannerTheme.messageColor}`}
            style={{
              fontWeight: getFontWeightNumber(fontWeight),
            }}
          >
            {renderIosEmojis(
              itemMessage || 'Hello'
            )}
          </div>
        </div>
      </div>
    );
  };

  // Outer Aspect Ratio Class - Flexible vertical positioning
  const getContainerAspect = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square flex flex-col items-center justify-start px-4 pb-4';
      case '4:5':
        return 'aspect-[4/5] flex flex-col items-center justify-start px-4 pb-4';
      case '9:16':
        return 'aspect-[9/16] flex flex-col items-center justify-start px-4 pb-4';
      case 'auto':
      default:
        return 'min-h-[140px] flex flex-col items-center justify-start px-4 py-4';
    }
  };

  const bannerWidth = data?.bannerWidthPercent || 94;
  const verticalOffset = data?.verticalOffset !== undefined
    ? data.verticalOffset
    : (aspectRatio === '9:16' ? 12 : aspectRatio === '4:5' ? 8 : aspectRatio === '1:1' ? 7 : 4);

  return (
    <div
      ref={previewRef}
      id="preview-target"
      className={`w-[380px] min-w-[380px] max-w-[380px] shrink-0 mx-auto overflow-hidden shadow-2xl relative select-none flex flex-col transition-all ${getContainerAspect()}`}
      style={{
        ...getBackgroundStyle(),
        borderRadius: 'var(--preview-corner-radius, 24px)',
      }}
    >
      {/* Custom Embedded Font */}
      {customFontUrl && customFontName && (
        <style>{`
          @font-face {
            font-family: '${customFontName}';
            src: url('${customFontUrl}');
          }
        `}</style>
      )}

      {/* Standalone Floating Notification Banner(s) with Customizable Width and Vertical Offset */}
      <div
        className="w-full flex flex-col space-y-2.5 mx-auto transition-all"
        style={{
          width: `${bannerWidth}%`,
          maxWidth: '100%',
          marginTop: `${verticalOffset}%`,
        }}
      >
        {renderBanner(senderName, messageText, timestamp, avatarUrl, platform, appName, 0, data.avatarMode, data.iconPlatform)}

        {/* Additional stacked notifications if requested */}
        {notificationStackCount >= 2 && (
          renderBanner(
            additionalNotifications[0]?.senderName || (platform === 'instagram' ? 'Sarah' : 'Dimas'),
            additionalNotifications[0]?.messageText || 'lagi dimana sekarang?',
            additionalNotifications[0]?.timestamp || '2m ago',
            additionalNotifications[0]?.avatarUrl || '',
            additionalNotifications[0]?.platform || platform,
            additionalNotifications[0]?.appName,
            1,
            additionalNotifications[0]?.avatarMode || data.avatarMode,
            additionalNotifications[0]?.iconPlatform || additionalNotifications[0]?.platform || data.iconPlatform || platform
          )
        )}

        {notificationStackCount >= 3 && (
          renderBanner(
            additionalNotifications[1]?.senderName || 'Jessica',
            additionalNotifications[1]?.messageText || 'Check this out! 🔥',
            additionalNotifications[1]?.timestamp || '5m ago',
            additionalNotifications[1]?.avatarUrl || '',
            additionalNotifications[1]?.platform || platform,
            additionalNotifications[1]?.appName,
            2,
            additionalNotifications[1]?.avatarMode || data.avatarMode,
            additionalNotifications[1]?.iconPlatform || additionalNotifications[1]?.platform || data.iconPlatform || platform
          )
        )}
      </div>
    </div>
  );
};
