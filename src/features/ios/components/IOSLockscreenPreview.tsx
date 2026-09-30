import React from 'react';
import {
  IOSLockscreenData,
  LockscreenAppType,
  LockscreenNotificationMessage,
} from '../../../types';
import { DEFAULT_AVATAR } from '../../../data/defaultTemplates';
import { X, ChevronUp } from 'lucide-react';
import { renderEmojiText } from '../../../utils/emojiUtils';


// ============================================================
// iOS STYLE FLASHLIGHT ICON
// ============================================================
const CustomFlashlightIcon = ({
  className = "w-6 h-6",
  isDark = true,
}: {
  className?: string;
  isDark?: boolean;
}) => {
  const cutoutColor = isDark ? '#1C1C1E' : '#F2F2F7';

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Main flashlight silhouette */}
      <path
        d="
          M7.15 3.1
          H16.85
          C17.55 3.1 18.1 3.65 18.1 4.35
          V7.05
          C18.1 8.05 17.65 8.75 16.9 9.4
          L15.75 10.4
          C15.35 10.75 15.15 11.25 15.15 11.8
          V18.55
          C15.15 19.85 14.25 20.9 13 20.9
          H11
          C9.75 20.9 8.85 19.85 8.85 18.55
          V11.8
          C8.85 11.25 8.65 10.75 8.25 10.4
          L7.1 9.4
          C6.35 8.75 5.9 8.05 5.9 7.05
          V4.35
          C5.9 3.65 6.45 3.1 7.15 3.1
          Z
        "
        fill="currentColor"
      />

      {/* Top lens separator */}
      <path
        d="M5.95 7.15H18.05"
        stroke={cutoutColor}
        strokeWidth="1.15"
        strokeLinecap="round"
      />

      {/* Center switch housing */}
      <rect
        x="10.05"
        y="11.35"
        width="3.9"
        height="6.2"
        rx="1.95"
        fill={cutoutColor}
      />

      {/* Switch button */}
      <circle
        cx="12"
        cy="15.75"
        r="0.82"
        fill="currentColor"
      />
    </svg>
  );
};


// ============================================================
// iOS STYLE CAMERA ICON
// ============================================================
const CustomCameraIcon = ({
  className = "w-6 h-6",
  isDark = true,
}: {
  className?: string;
  isDark?: boolean;
}) => {
  const cutoutColor = isDark ? '#1C1C1E' : '#F2F2F7';

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Main camera body */}
      <path
        d="
          M5.25 7.15
          H8.15
          L9.15 5.15
          C9.4 4.65 9.9 4.35 10.45 4.35
          H13.55
          C14.1 4.35 14.6 4.65 14.85 5.15
          L15.85 7.15
          H18.75
          C20.15 7.15 21.25 8.25 21.25 9.65
          V17.05
          C21.25 18.45 20.15 19.55 18.75 19.55
          H5.25
          C3.85 19.55 2.75 18.45 2.75 17.05
          V9.65
          C2.75 8.25 3.85 7.15 5.25 7.15
          Z
        "
        fill="currentColor"
      />

      {/* Camera lens cutout */}
      <circle
        cx="12"
        cy="13.35"
        r="3.35"
        fill={cutoutColor}
      />

      {/* Camera lens inner */}
      <circle
        cx="12"
        cy="13.35"
        r="1.95"
        fill="currentColor"
      />

      {/* Small camera indicator */}
      <circle
        cx="17.15"
        cy="10.15"
        r="0.72"
        fill={cutoutColor}
      />
    </svg>
  );
};


// ============================================================
// PROPS
// ============================================================
interface Props {
  data: IOSLockscreenData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (updated: IOSLockscreenData) => void;
}


// ============================================================
// WHATSAPP BADGE
// ============================================================
const WhatsAppBadge = () => (
  <div className="w-4.5 h-4.5 rounded-none bg-[#25D366] flex items-center justify-center text-white shadow-md border-[1.5px] border-[#1c1c1e] shrink-0">
    <svg
      className="w-2.5 h-2.5 fill-current"
      viewBox="0 0 24 24"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
    </svg>
  </div>
);


// ============================================================
// NOTIFICATION APP ICON
// ============================================================
const renderNotificationLeftIcon = (
  itemAppType: LockscreenAppType,
  avatarUrl?: string,
  senderName?: string,
  isDarkTheme: boolean = true
) => {

  // INSTAGRAM
  if (itemAppType === 'instagram') {
    return (
      <div className="w-10 h-10 rounded-none bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-md shrink-0">
        <svg
          className="w-6 h-6 stroke-current fill-none"
          viewBox="0 0 24 24"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="5"
            ry="5"
          />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line
            x1="17.5"
            y1="6.5"
            x2="17.51"
            y2="6.5"
          />
        </svg>
      </div>
    );
  }


  // X / TWITTER
  if (itemAppType === 'twitter') {
    return (
      <div
        className={`
          w-10 h-10 rounded-none bg-black
          border
          ${isDarkTheme ? 'border-white/20' : 'border-slate-800'}
          flex items-center justify-center
          text-white shadow-md shrink-0
        `}
      >
        <svg
          className="w-5 h-5 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    );
  }


  // WHATSAPP / DEFAULT
  return (
    <div className="relative shrink-0">

      <div
        className={`
          w-10 h-10 rounded-none overflow-hidden
          ${isDarkTheme
            ? 'bg-zinc-800'
            : 'bg-slate-200'
          }
        `}
      >
        <img
          src={(avatarUrl && avatarUrl.trim() !== '') ? avatarUrl : DEFAULT_AVATAR}
          alt={senderName || 'Sender Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
          }}
        />
      </div>

      <div className="absolute -bottom-1 -right-1 z-10">
        <WhatsAppBadge />
      </div>

    </div>
  );
};


// ============================================================
// LOCKSCREEN PREVIEW
// ============================================================
export const IOSLockscreenPreview: React.FC<Props> = ({
  data,
  previewRef
}) => {

  const {
    appType = 'whatsapp',
    lockscreenTime = '09:41',
    lockscreenDate = 'Sunday, December 8',
    wallpaperImage = '',
    showWallpaper = false,
    theme = 'light',
    groupHeaderTitle = 'Notification Center',
    senderName = 'Alex',
    messageText = "Are you free tonight? Let's catch up!",
    timeAgo = '2m ago',
    avatarUrl = '',
    secondaryMessageText = '',
    showSecondaryMessage = false,
    aspectRatio = '9:16',
    notificationList,
  } = (data || {}) as any;


  const isDark = theme === 'dark';


  // ==========================================================
  // ASPECT RATIO
  // ==========================================================
  const getAspectClass = () => {

    switch (aspectRatio) {

      case '1:1':
        return 'aspect-square';

      case '4:5':
        return 'aspect-[4/5]';

      case '9:16':
      default:
        return 'aspect-[9/16]';
    }
  };


  // ==========================================================
  // BUILD NOTIFICATION ARRAY
  // ==========================================================
  let notifications: LockscreenNotificationMessage[] = [];

  if (notificationList && notificationList.length > 0) {

    notifications = notificationList;

  } else {

    notifications.push({
      id: '1',
      appType: appType,
      senderName: senderName || 'Name',
      messageText:
        messageText ||
        "Read a message",
      timeAgo: timeAgo || 'now',
      avatarUrl: avatarUrl,
    });


    if (showSecondaryMessage && secondaryMessageText) {

      notifications.push({
        id: '2',
        appType: appType,
        senderName: senderName || 'Name',
        messageText: secondaryMessageText,
        timeAgo: '5m ago',
        avatarUrl: avatarUrl,
      });
    }
  }


  // ==========================================================
  // RENDER
  // ==========================================================
  return (
    <div
      ref={previewRef}
      id="preview-target"
      style={{
        borderRadius: 'var(--preview-corner-radius, 32px)',
      }}
      className={`
        relative
        w-[380px]
        min-w-[380px]
        max-w-[380px]
        shrink-0
        mx-auto
        ${isDark
          ? 'bg-[#1C1C1E] text-white'
          : 'bg-[#F2F2F7] text-slate-900'
        }
        flex
        flex-col
        justify-between
        overflow-hidden
        border
        ${isDark
          ? 'border-white/10'
          : 'border-black/10'
        }
        shadow-2xl
        select-none
        font-sans
        ${getAspectClass()}
      `}
    >

      {/* ======================================================
          1. WALLPAPER
      ====================================================== */}

      {showWallpaper !== false && wallpaperImage && wallpaperImage.trim() !== '' ? (

        <div className="absolute inset-0 z-0 overflow-hidden">

          <img
            src={wallpaperImage.trim()}
            alt="Lockscreen Wallpaper"
            className={`
              w-full
              h-full
              object-cover
              filter
              ${isDark
                ? 'brightness-[0.75]'
                : 'brightness-[0.95]'
              }
            `}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          <div
            className={`
              absolute inset-0
              ${isDark
                ? 'bg-black/20'
                : 'bg-white/10'
              }
            `}
          />

        </div>

      ) : (

        <div
          className={`
            absolute
            inset-0
            z-0
            ${isDark
              ? 'bg-[#1C1C1E]'
              : 'bg-[#F2F2F7]'
            }
          `}
        />

      )}


      {/* ======================================================
          2. LOCKSCREEN DATE + TIME
      ====================================================== */}

      <div className="relative z-10 pt-10 px-6 text-center flex flex-col items-center">

        <div
          className={`
            text-sm
            font-medium
            ${isDark
              ? 'text-white/90 drop-shadow-sm'
              : 'text-slate-800'
            }
            tracking-wide
            mb-1
          `}
        >
          {lockscreenDate || 'Sunday, December 8'}
        </div>


        <h1
          className={`
            text-7xl
            font-extralight
            tracking-tight
            ${isDark
              ? 'text-white drop-shadow-md'
              : 'text-slate-900'
            }
            my-0
            leading-none
          `}
        >
          {lockscreenTime || '09:41'}
        </h1>

      </div>


      {/* ======================================================
          3. NOTIFICATION CENTER
      ====================================================== */}

      <div
        className="
          relative
          z-10
          mt-auto
          px-4
          w-full
          max-w-sm
          mx-auto
          pb-3
          space-y-1.5
        "
      >

        {/* Notification Header */}

        <div
          className="
            flex
            items-center
            justify-between
            pt-2
            px-1
            mb-1
          "
        >

          <h2
            className={`
              text-lg
              sm:text-xl
              font-bold
              tracking-wide
              ${isDark
                ? 'text-white'
                : 'text-slate-900'
              }
            `}
          >
            {renderEmojiText(groupHeaderTitle || 'Notification Center')}
          </h2>


          <div className="flex items-center space-x-1.5">

            {/* SHOW LESS */}

            <button
              type="button"
              className={`
                text-xs
                px-2.5
                py-1
                rounded-full
                flex
                items-center
                space-x-1
                font-medium
                transition-colors
                ${isDark
                  ? 'bg-zinc-800/80 backdrop-blur-2xl border border-white/10 text-white/90 hover:bg-zinc-700'
                  : 'bg-white/80 backdrop-blur-2xl border border-black/10 text-slate-800 hover:bg-white shadow-xs'
                }
              `}
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show less</span>
            </button>


            {/* CLOSE */}

            <button
              type="button"
              className={`
                w-6
                h-6
                rounded-full
                flex
                items-center
                justify-center
                transition-colors
                ${isDark
                  ? 'bg-zinc-800/80 hover:bg-zinc-700 text-white/80'
                  : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                }
              `}
            >
              <X className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>


        {/* ====================================================
            STACKED NOTIFICATIONS
        ==================================================== */}

        <div
          className="
            space-y-1.5
            max-h-[320px]
            overflow-y-auto
            pr-0.5
            scrollbar-none
          "
        >

          {notifications.map((item) => {

            const itemApp =
              item.appType ||
              appType ||
              'whatsapp';

            return (

              <div
                key={item.id}
                className={`
                  flex
                  flex-row
                  items-center
                  space-x-3
                  rounded-none
                  p-2.5
                  sm:p-3
                  shadow-lg
                  transition-all
                  ${isDark
                    ? 'bg-black/40 backdrop-blur-2xl text-white'
                    : 'bg-white/65 backdrop-blur-2xl text-slate-900 shadow-sm'
                  }
                `}
              >

                {/* Avatar / App */}

                {renderNotificationLeftIcon(
                  itemApp,
                  item.avatarUrl || avatarUrl,
                  item.senderName,
                  isDark
                )}


                {/* Sender + Message */}

                <div
                  className="
                    flex-1
                    min-w-0
                    flex
                    flex-col
                    justify-center
                  "
                >

                  <span
                    className={`
                      text-sm
                      font-bold
                      truncate
                      leading-tight
                      ${isDark
                        ? 'text-white'
                        : 'text-slate-900'
                      }
                    `}
                  >
                    {renderEmojiText(item.senderName || 'Alex')}
                  </span>


                  <span
                    className={`
                      text-xs
                      font-normal
                      truncate
                      mt-0.5
                      leading-tight
                      ${isDark
                        ? 'text-white/85'
                        : 'text-slate-700'
                      }
                    `}
                  >
                    {renderEmojiText(item.messageText || 'Message...')}
                  </span>

                </div>


                {/* Timestamp */}

                <span
                  className={`
                    text-[11px]
                    font-normal
                    shrink-0
                    self-start
                    pt-0.5
                    ${isDark
                      ? 'text-white/60'
                      : 'text-slate-500'
                    }
                  `}
                >
                  {renderEmojiText(item.timeAgo || '2m ago')}
                </span>

              </div>
            );
          })}

        </div>

      </div>


      {/* ======================================================
          4. BOTTOM iOS CONTROLS
      ====================================================== */}

      <div
        className="
          relative
          z-10
          px-8
          pb-3
          pt-1
          flex
          flex-col
          items-center
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
            w-full
            mb-3
          "
        >

          {/* ==================================================
              FLASHLIGHT
          ================================================== */}

          <button
            type="button"
            className={`
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              shadow-lg
              active:scale-95
              transition-all
              ${isDark
                ? 'bg-black/35 backdrop-blur-2xl border border-white/15 text-white hover:bg-black/50'
                : 'bg-white/65 backdrop-blur-2xl border border-black/10 text-slate-800 hover:bg-white/85 shadow-sm'
              }
            `}
            title="Flashlight"
          >
            <CustomFlashlightIcon
              className="w-8 h-8"
              isDark={isDark}
            />
          </button>


          {/* ==================================================
              CAMERA
          ================================================== */}

          <button
            type="button"
            className={`
              w-12
              h-12
              rounded-full
              flex
              items-center
              justify-center
              shadow-lg
              active:scale-95
              transition-all
              ${isDark
                ? 'bg-black/35 backdrop-blur-2xl border border-white/15 text-white hover:bg-black/50'
                : 'bg-white/65 backdrop-blur-2xl border border-black/10 text-slate-800 hover:bg-white/85 shadow-sm'
              }
            `}
            title="Camera"
          >
            <CustomCameraIcon
              className="w-8 h-8"
              isDark={isDark}
            />
          </button>

        </div>


        {/* ====================================================
            iOS HOME INDICATOR
        ==================================================== */}

        <div
          className={`
            w-32
            h-1.5
            rounded-full
            mx-auto
            ${isDark
              ? 'bg-white'
              : 'bg-slate-800'
            }
          `}
        />

      </div>

    </div>
  );
};
