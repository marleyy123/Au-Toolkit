import React from 'react';
import { WhatsAppStatusData } from '../types';
import { DEFAULT_AVATAR } from '../data/defaultTemplates';
import { renderIosEmojis } from '../utils/emojiUtils';
import { ChevronUp, MoreVertical, ChevronLeft, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getFontFamilyCss, getFontWeightNumber } from './FontSelectorDropdown';

interface Props {
  data: WhatsAppStatusData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (updated: WhatsAppStatusData) => void;
}

export const WhatsAppStatusPreview: React.FC<Props> = ({ data, previewRef }) => {
  const { language } = useLanguage();
  const {
    contactName = '',
    contactAvatar = '',
    timestamp = 'Today, 10:45',
    contentType = 'text',
    mediaImage = '',
    statusText = '',
    textBgColor = '#1B4D3E',
    textColor = '#FFFFFF',
    fontStyle = 'default',
    fontWeight = 'semibold',
    customFontName = '',
    customFontUrl = '',
    fontSize = 26,
    lineHeight = 1.35,
    captionText = '',
    aspectRatio = '9:16',
    progressSegmentsCount = 3,
    activeSegmentIndex = 1,
    activeSegmentProgress = 60,
    showReply = true,
    showViewCount = true,
    viewCount = '12',
  } = (data || {}) as any;

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

  const resolvedAspectRatio = aspectRatio === '1:1' ? '1 / 1' : aspectRatio === '4:5' ? '4 / 5' : '9 / 16';

  const segments = Array.from({ length: Math.max(1, progressSegmentsCount || 3) }, (_, i) => i + 1);

  // Dedicated, isolated font state specifically for WhatsApp Text Status
  const textStatusFont = React.useMemo(() => {
    if (data?.textStatusFont && data.textStatusFont.trim() !== '') {
      return data.textStatusFont;
    }
    return getFontFamilyCss(fontStyle, customFontName, customFontUrl);
  }, [data?.textStatusFont, fontStyle, customFontName, customFontUrl]);

  const resolvedFontWeight = getFontWeightNumber(fontWeight);

  return (
    <div
      ref={previewRef}
      id="preview-target"
      className={`w-[380px] min-w-[380px] max-w-[380px] ${getAspectClass()} mx-auto overflow-hidden shadow-2xl relative select-none flex flex-col justify-between shrink-0 transition-all`}
      style={{
        aspectRatio: resolvedAspectRatio,
        borderRadius: 'var(--preview-corner-radius, 0px)',
        backgroundColor: contentType === 'text' ? (textBgColor || '#1B4D3E') : '#000000',
        fontFamily: '"SF UI Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
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

      {/* Scoped CSS Rule to guarantee WhatsApp text status font is completely isolated and never overridden */}
      <style>{`
        .wa-status-text-target,
        .wa-status-text-target * {
          font-family: ${textStatusFont} !important;
          font-weight: ${resolvedFontWeight} !important;
        }
      `}</style>

      {/* Media Image Status (Preserve original aspect ratio with natural black letterboxing) */}
      {contentType === 'image' && mediaImage && (
        <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black">
          <img
            src={mediaImage}
            alt="Status Media"
            className="w-full h-full object-contain select-none pointer-events-none"
          />
        </div>
      )}

      {/* TOP BAR / HEADER OVERLAY (Clean without dark shadow or gradient overlay) */}
      <div className="relative z-20 px-3 pt-3 pb-2 flex flex-col space-y-2 bg-transparent">
        {/* Progress Bar Segments */}
        <div className="flex items-center space-x-1.5 w-full">
          {segments.map((segNum) => {
            const isActive = segNum === activeSegmentIndex;
            const isCompleted = segNum < activeSegmentIndex;
            const activeWidth = `${Math.min(100, Math.max(0, activeSegmentProgress !== undefined ? activeSegmentProgress : 60))}%`;
            return (
              <div
                key={segNum}
                className="flex-1 h-[2.5px] bg-white/35 rounded-full overflow-hidden"
              >
                <div
                  style={{
                    width: isCompleted ? '100%' : isActive ? activeWidth : '0%',
                  }}
                  className="h-full bg-white transition-all duration-150"
                />
              </div>
            );
          })}
        </div>

        {/* Contact Info Row */}
        <div className="flex items-center justify-between pt-0.5 text-white">
          <div className="flex items-center space-x-2">
            {/* Back Button */}
            <button type="button" className="text-white hover:opacity-80 transition-opacity p-0.5">
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Avatar without green ring */}
            <div className="relative w-9 h-9 shrink-0">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-slate-800">
                <img
                  src={contactAvatar || DEFAULT_AVATAR}
                  alt={contactName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>

            {/* Name and Timestamp */}
            <div className="flex flex-col">
              <span className="text-[14.5px] font-bold tracking-tight leading-tight truncate max-w-[170px] drop-shadow-sm">
                {renderIosEmojis(contactName || (language === 'id' ? 'Nama' : 'Name'))}
              </span>
              <span className="text-[11.5px] text-white/85 font-normal leading-tight drop-shadow-xs">
                {((timestamp && timestamp.trim() !== '')
                  ? timestamp
                  : (language === 'id' ? 'Hari ini, 11.45' : 'Today, 11.45')
                ).replace(/:/g, '.')}
              </span>
            </div>
          </div>

          {/* Right Action Icons */}
          <button type="button" className="text-white hover:opacity-80 transition-opacity p-1">
            <MoreVertical className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </div>

      {/* CENTER STATUS CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {contentType === 'text' ? (
          <div
            data-custom-font="true"
            className="w-full max-w-[320px] break-words text-center flex items-center justify-center p-4 wa-status-text-target"
            style={{
              color: textColor || '#FFFFFF',
              fontFamily: textStatusFont,
              fontWeight: resolvedFontWeight,
            }}
          >
            <p
              data-custom-font="true"
              className="select-none whitespace-pre-wrap transition-all wa-status-text-target"
              style={{
                fontFamily: textStatusFont,
                fontSize: `${fontSize}px`,
                fontWeight: resolvedFontWeight,
                lineHeight: lineHeight,
                color: textColor || '#FFFFFF',
              }}
            >
              {renderIosEmojis(statusText || (language === 'id' ? 'Ketik status di sini...' : 'Type status message here...'))}
            </p>
          </div>
        ) : null}
      </div>

      {/* BOTTOM AREA / CAPTION & REPLY / VIEWERS BAR */}
      <div className="relative z-20 px-4 pb-4 pt-2 flex flex-col space-y-2">
        {/* Caption text for Image Status - strictly independent from statusText */}
        {contentType === 'image' && Boolean(captionText && captionText.trim() !== '') && (
          <div className="text-center text-white text-[15px] font-medium leading-snug px-3 py-1 select-none">
            {renderIosEmojis(captionText)}
          </div>
        )}

        {/* Clean Bold Horizontal Divider Line above Reply Button (only for media/image status, not shown for text status) */}
        {showReply !== false && contentType !== 'text' && (
          <div className="w-full flex justify-center pt-1 pb-0.5">
            <div className="w-[88%] h-[1.75px] bg-white/75 rounded-full shadow-xs" />
          </div>
        )}

        {/* Bottom Reply & Viewers Area */}
        <div className="flex flex-col items-center justify-center space-y-0.5 pb-0.5">
          {/* Swipe Up Arrow indicator + Reply text */}
          {showReply !== false && (
            <div className="flex flex-col items-center justify-center text-white text-center select-none">
              <ChevronUp className="w-6 h-6 text-white stroke-[2.2] -mb-0.5" />
              <span className="text-[13.5px] font-medium tracking-normal leading-tight">
                {language === 'id' ? 'Balas' : 'Reply'}
              </span>
            </div>
          )}
          
          {/* Eye Icon & Viewers Count */}
          {showViewCount !== false && (
            <div className="flex flex-col items-center justify-center text-white text-center select-none">
              {showReply === false && (
                <ChevronUp className="w-6 h-6 opacity-90 stroke-[2.2] mb-0.5" />
              )}
              <div className="flex items-center justify-center gap-1.5 text-white/95 text-xs font-semibold px-3 py-1 bg-black/40 backdrop-blur-xs rounded-full border border-white/15 shadow-xs mt-0.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{viewCount !== undefined && viewCount !== '' ? viewCount : '12'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
