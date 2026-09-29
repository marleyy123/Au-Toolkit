import React from 'react';
import { WhatsAppViewersData } from '../types';
import { renderIosEmojis } from '../utils/emojiUtils';
import { ChevronLeft, MoreVertical, EyeOff } from 'lucide-react';
import { getFontFamilyCss, getFontWeightNumber } from './FontSelectorDropdown';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  data: WhatsAppViewersData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (updated: WhatsAppViewersData) => void;
}

export const WhatsAppViewersPreview: React.FC<Props> = ({ data, previewRef, onChange }) => {
  const { language } = useLanguage();
  const {
    contactName = 'My Status',
    contactAvatar = '',
    timestamp = '2m ago',
    contentType = 'image',
    mediaImage = '',
    statusText = '',
    textBgColor = '#1B4D3E',
    textColor = '#FFFFFF',
    fontStyle = 'default',
    fontWeight = 'semibold',
    customFontName = '',
    customFontUrl = '',
    fontSize = 24,
    lineHeight = 1.35,
    captionText = '',
    viewCount,
    viewedByLabel,
    progressSegmentsCount = 1,
    activeSegmentIndex = 1,
    activeSegmentProgress = 60,
    viewers = [],
    theme = 'light',
    aspectRatio = '9:16',
  } = (data || {}) as any;

  const isDark = theme === 'dark';

  const handleToggleLike = (idx: number) => {
    if (!onChange) return;
    const currentViewers = viewers || [];
    const updatedViewers = [...currentViewers];
    const target = updatedViewers[idx];
    if (!target) return;
    const isCurrentlyLiked = Boolean(target.isLiked);
    updatedViewers[idx] = {
      ...target,
      isLiked: !isCurrentlyLiked,
    };
    onChange({
      ...data,
      viewers: updatedViewers,
    });
  };

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

  const getDimensionsStyle = (): React.CSSProperties => {
    switch (aspectRatio) {
      case '1:1':
        return { width: '380px', height: '380px', minHeight: '380px', maxHeight: '380px' };
      case '4:5':
        return { width: '380px', height: '475px', minHeight: '475px', maxHeight: '475px' };
      case '9:16':
      default:
        return { width: '380px', height: '675px', minHeight: '675px', maxHeight: '675px' };
    }
  };

  const parsedViewCount =
    viewCount !== undefined && viewCount !== ''
      ? viewCount
      : viewers && viewers.length > 0
      ? String(viewers.length)
      : '0';

  const isZeroViews = parsedViewCount === '0' || viewers.length === 0;

  const renderViewerTime = (timeStr?: string) => {
    // Light Mode: Day -> abu-abu (#667781), Time -> hitam pekat (#000000)
    // Dark Mode: Day -> abu-abu cerah (#8696A0), Time -> putih (#ffffff)
    const dayColorClass = isDark ? 'text-[#8696A0]' : 'text-[#667781]';
    const timeColorClass = isDark ? 'text-white' : 'text-black';

    if (!timeStr || timeStr.trim() === '') {
      return (
        <span className="text-[12px] font-normal tracking-tight select-none flex items-center space-x-1.5">
          <span className={`font-normal ${dayColorClass}`}>Today</span>
          <span className={`font-normal ${timeColorClass}`}>1.43 AM</span>
        </span>
      );
    }
    const trimmed = timeStr.trim();
    // Support formats like "hari ini 1.43 AM", "Today 1.43 AM", "Kemarin 12.44 AM", "12/09 10.15 AM"
    const match = trimmed.match(/^(.+?)\s+(\d{1,2}[:.]\d{2}(?:\s*(?:AM|PM|am|pm))?)$/i);
    if (match) {
      return (
        <span className="flex items-center space-x-1.5 text-[12px] font-normal tracking-tight select-none">
          <span className={`font-normal ${dayColorClass}`}>{match[1]}</span>
          <span className={`font-normal ${timeColorClass}`}>{match[2]}</span>
        </span>
      );
    }
    // Check if it is purely a time value like "1.43 AM" or "10:30"
    const isOnlyTime = /^(\d{1,2}[:.]\d{2}(?:\s*(?:AM|PM|am|pm))?)$/i.test(trimmed);
    return (
      <span className={`text-[12px] font-normal tracking-tight select-none ${isOnlyTime ? timeColorClass : dayColorClass}`}>
        {trimmed}
      </span>
    );
  };

  return (
    <div
      ref={previewRef}
      id="preview-target"
      className={`w-[380px] min-w-[380px] max-w-[380px] ${getAspectClass()} mx-auto overflow-hidden shadow-2xl relative select-none flex flex-col justify-between bg-black text-white shrink-0`}
      style={{
        ...getDimensionsStyle(),
        borderRadius: 'var(--preview-corner-radius, 0px)',
        fontFamily: '"Segoe UI", Roboto, -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
      }}
    >
      {/* Custom Embedded Font Style */}
      {customFontUrl && customFontName && (
        <style>{`
          @font-face {
            font-family: '${customFontName}';
            src: url('${customFontUrl}');
            font-display: swap;
          }
        `}</style>
      )}

      {/* Scoped CSS Rule to guarantee WhatsApp text status font is never overridden by global typography */}
      <style>{`
        .wa-status-text-target,
        .wa-status-text-target * {
          font-family: ${getFontFamilyCss(fontStyle, customFontName, customFontUrl)} !important;
          font-weight: ${getFontWeightNumber(fontWeight)} !important;
        }
      `}</style>

      {/* 1. BACKGROUND MEDIA / TEXT CONTENT */}
      <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black">
        {contentType === 'image' ? (
          mediaImage && mediaImage.trim() !== '' ? (
            <img
              src={mediaImage.trim()}
              alt="Status background"
              className="w-full h-full object-cover"
            />
          ) : (
            // Clean empty / blank background when photo mode is chosen without an uploaded image
            <div className="w-full h-full bg-black" />
          )
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-6 text-center wa-status-text-target"
            style={{
              backgroundColor: textBgColor || '#1B4D3E',
              color: textColor || '#FFFFFF',
              fontFamily: getFontFamilyCss(fontStyle, customFontName, customFontUrl),
              fontWeight: getFontWeightNumber(fontWeight),
            }}
          >
            <span
              className="leading-snug break-words max-w-xs select-none whitespace-pre-wrap transition-all wa-status-text-target"
              style={{
                fontFamily: getFontFamilyCss(fontStyle, customFontName, customFontUrl),
                fontSize: `${fontSize}px`,
                fontWeight: getFontWeightNumber(fontWeight),
                lineHeight: lineHeight,
                color: textColor || '#FFFFFF',
              }}
            >
              {renderIosEmojis(statusText || 'My Status')}
            </span>
          </div>
        )}

        {/* Top Vignette Gradient Overlay */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none" />

        {/* Bottom subtle shadow behind bottom sheet */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
      </div>

      {/* 2. TOP STATUS HEADER */}
      <div className="relative z-10 pt-3 px-3.5 flex flex-col space-y-2 shrink-0">
        {/* Progress Bar Segments */}
        <div className="flex items-center space-x-1.5 w-full">
          {Array.from({ length: Math.max(1, progressSegmentsCount || 1) }).map((_, idx) => {
            const segNum = idx + 1;
            const currentActive = activeSegmentIndex && activeSegmentIndex > 0 ? activeSegmentIndex : 1;
            const isActive = segNum === currentActive;
            const isPassed = segNum < currentActive;
            const activeWidth = `${Math.min(100, Math.max(0, activeSegmentProgress !== undefined ? activeSegmentProgress : 60))}%`;
            return (
              <div
                key={idx}
                className="h-[2.5px] flex-1 rounded-full overflow-hidden bg-white/35 backdrop-blur-xs"
              >
                <div
                  style={{
                    width: isPassed ? '100%' : isActive ? activeWidth : '0%',
                  }}
                  className="h-full bg-white transition-all duration-150"
                />
              </div>
            );
          })}
        </div>

        {/* Status Profile Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2.5">
            {/* Back Button */}
            <button type="button" className="text-white hover:opacity-80 transition-opacity p-0.5">
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Avatar without badge */}
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-slate-800 flex items-center justify-center">
                {contactAvatar && contactAvatar.trim() !== '' ? (
                  <img
                    src={contactAvatar.trim()}
                    alt={contactName || 'Contact'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Status Author & Time */}
            <div className="flex flex-col leading-tight">
              <span className="text-[14px] font-bold text-white tracking-tight drop-shadow-sm">
                {renderIosEmojis(contactName || 'My Status')}
              </span>
              <span className="text-[11.5px] text-white/80 font-normal mt-0.5 drop-shadow-xs">
                {timestamp || '2m ago'}
              </span>
            </div>
          </div>

          {/* More Options */}
          <button type="button" className="text-white/95 hover:opacity-80 transition-opacity p-1">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. MIDDLE AREA (Optional Caption) */}
      <div className="relative z-10 px-4 flex-1 min-h-0 overflow-hidden flex flex-col justify-end pb-2 pointer-events-none">
        {contentType === 'image' && captionText && (
          <div className="text-center text-white text-[14px] font-medium leading-snug px-3 py-1 self-center max-w-[90%] mb-1 select-none pointer-events-auto">
            {renderIosEmojis(captionText)}
          </div>
        )}
      </div>

      {/* 4. BOTTOM SHEET (Dynamic height adapting to viewers count, expanding upwards) */}
      <div
        className={`relative z-20 w-full rounded-t-2xl border-t shadow-2xl transition-all duration-300 ease-out flex flex-col max-h-[calc(100%-75px)] min-h-[140px] shrink-0 overflow-hidden ${
          isDark
            ? 'bg-[#121B22] border-white/5 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Subtle grab bar indicator */}
        <div className="pt-2 pb-0 flex justify-center shrink-0">
          <div className={`w-8 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-slate-300'}`} />
        </div>

        {/* Header Bottom Sheet */}
        <div className="px-5 pt-2 pb-1.5 flex items-center justify-between shrink-0">
          <h2 className="text-[15px] font-bold tracking-tight">
            {viewedByLabel !== undefined && viewedByLabel.trim() !== ''
              ? (viewedByLabel.includes('{count}') ? viewedByLabel.replace('{count}', parsedViewCount) : `${parsedViewCount} ${viewedByLabel}`)
              : `${parsedViewCount} views`}
          </h2>

          <div className="flex items-center space-x-2">
            {/* 3 dots menu button */}
            <button
              type="button"
              className={`p-1 transition-opacity hover:opacity-80 ${
                isDark ? 'text-white/90' : 'text-slate-700'
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Bottom Sheet: dynamic scrollable area */}
        <div className="px-5 pb-3 flex-auto min-h-0 overflow-y-auto no-scrollbar flex flex-col justify-start">
          {!isZeroViews && viewers && viewers.length > 0 ? (
            /* Viewers List with authentic WhatsApp list styling and horizontal dividers */
            <div className="flex flex-col py-0.5">
              {viewers.map((viewer, idx) => (
                <div
                  key={viewer.id || idx}
                  className="flex items-center space-x-3.5 w-full"
                >
                  {/* 1. Avatar Container with Status Ring & True Cut-Out Mask (Compact & Proportional) */}
                  <div className="relative shrink-0 w-9 h-9 flex items-center justify-center my-0.5">
                    <svg
                      className="w-9 h-9 overflow-visible shrink-0"
                      viewBox="0 0 44 44"
                    >
                      <defs>
                        {/* Circular clipping path for avatar */}
                        <clipPath id={`wa-avatar-clip-${viewer.id || idx}`}>
                          <circle cx="22" cy="22" r={viewer.hasRing ? "17" : "19.5"} />
                        </clipPath>

                        {/* True cut-out mask: creates a transparent hole cutting through both avatar and ring */}
                        {viewer.isLiked && (
                          <mask id={`wa-avatar-mask-${viewer.id || idx}`}>
                            {/* White rectangle = fully opaque / visible */}
                            <rect x="0" y="0" width="44" height="44" fill="white" />
                            {/* Black heart with stroke = 100% transparent cut-out hole */}
                            <g transform="translate(21.5, 21.5) scale(0.90)">
                              <path
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                fill="black"
                                stroke="black"
                                strokeWidth="3.6"
                                strokeLinejoin="round"
                                strokeLinecap="round"
                              />
                            </g>
                          </mask>
                        )}
                      </defs>

                      {/* Group masked by the cut-out hole (Avatar & Ring) */}
                      <g mask={viewer.isLiked ? `url(#wa-avatar-mask-${viewer.id || idx})` : undefined}>
                        {/* Status Ring if enabled */}
                        {viewer.hasRing && (
                          <circle
                            cx="22"
                            cy="22"
                            r="20"
                            fill="none"
                            stroke="#25D366"
                            strokeWidth="2.2"
                          />
                        )}

                        {/* Avatar Image or Authentic Default WhatsApp Silhouette */}
                        <g clipPath={`url(#wa-avatar-clip-${viewer.id || idx})`}>
                          {viewer.avatar && viewer.avatar.trim() !== '' ? (
                            <image
                              href={viewer.avatar.trim()}
                              x={viewer.hasRing ? "5" : "2.5"}
                              y={viewer.hasRing ? "5" : "2.5"}
                              width={viewer.hasRing ? "34" : "39"}
                              height={viewer.hasRing ? "34" : "39"}
                              preserveAspectRatio="xMidYMid slice"
                            />
                          ) : (
                            <>
                              {/* WhatsApp signature grey circle placeholder */}
                              <circle
                                cx="22"
                                cy="22"
                                r={viewer.hasRing ? "17" : "19.5"}
                                fill={isDark ? '#6C757D' : '#94a3b8'}
                              />
                              {/* White head */}
                              <circle
                                cx="22"
                                cy={viewer.hasRing ? "18" : "17.5"}
                                r={viewer.hasRing ? "5.5" : "6"}
                                fill="white"
                              />
                              {/* White shoulders curve */}
                              <path
                                d={viewer.hasRing
                                  ? "M13.5 33c0-4.2 3.8-7 8.5-7s8.5 2.8 8.5 7"
                                  : "M12.5 35c0-4.8 4.2-8 9.5-8s9.5 3.2 9.5 8"
                                }
                                fill="white"
                              />
                            </>
                          )}
                        </g>
                      </g>

                      {/* Solid Green Love Heart Reaction (Placed right inside the cutout hole, enlarged & prominent) */}
                      {viewer.isLiked && (
                        <g
                          transform="translate(21.5, 21.5) scale(0.90)"
                          className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleLike(idx);
                          }}
                        >
                          <path
                            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                            fill="#25D366"
                          />
                        </g>
                      )}
                    </svg>
                  </div>

                  {/* 2. Text Column with Horizontal Divider Line */}
                  <div
                    className={`flex-1 flex items-center justify-between py-2.5 min-w-0 pr-0.5 ${
                      isDark ? 'border-b border-[#202C33]' : 'border-b border-[#E9EDEF]'
                    }`}
                  >
                    <span
                      className={`text-[14px] font-normal truncate ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {renderIosEmojis(viewer.name && viewer.name.trim() !== '' ? viewer.name : 'Name')}
                    </span>

                    {/* Timestamp with Day + Time format */}
                    <div className="shrink-0 pl-3">
                      {renderViewerTime(viewer.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 select-none opacity-60">
              <EyeOff className="w-7 h-7 mb-2 text-slate-400" />
              <p className={`text-[13px] font-normal ${isDark ? 'text-[#8696A0]' : 'text-slate-500'}`}>
                {language === 'id' ? 'Belum ada yang melihat' : 'No views yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
