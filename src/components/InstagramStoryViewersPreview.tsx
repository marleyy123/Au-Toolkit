import React, { useState, useEffect } from 'react';
import { InstagramStoryViewersData } from '../types';
import { renderFormattedTextWithAppleEmojis } from '../utils/emojiUtils';
import { useLanguage } from '../context/LanguageContext';
import {
  Settings,
  X,
  Users,
  MoreHorizontal,
  Camera,
} from 'lucide-react';

interface Props {
  data: InstagramStoryViewersData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

export const InstagramStoryViewersPreview: React.FC<Props> = ({ data, previewRef }) => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const {
    storyImage = '',
    viewerCount = '',
    viewers = [],
    theme = 'light',
    activeSlideIndex = 0,
  } = (data || {}) as any;

  const isDark = theme === 'dark';

  const defaultAvatar =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80';

  const effectiveCount = viewerCount || (viewers.length > 0 ? String(viewers.length) : '18');

  // Multi-story image list fallback
  const images =
    data?.storyImages && data.storyImages.length > 0
      ? data.storyImages
      : (storyImage ? [storyImage] : []);

  const [localActiveIndex, setLocalActiveIndex] = useState<number>(activeSlideIndex);

  useEffect(() => {
    if (data?.activeSlideIndex !== undefined) {
      setLocalActiveIndex(Math.min(data.activeSlideIndex, Math.max(0, images.length - 1)));
    }
  }, [data?.activeSlideIndex, images.length]);

  const currentIndex = Math.min(localActiveIndex, Math.max(0, images.length - 1));
  const currentActiveImage = images[currentIndex] || storyImage || '';

  const hasPrevious = currentIndex > 0;
  const previousImage = hasPrevious ? images[currentIndex - 1] : null;

  const hasNext = currentIndex + 1 < images.length;
  const nextImage = hasNext ? images[currentIndex + 1] : null;

  return (
    <div
      ref={previewRef}
      id="export-instagram-story-viewers"
      className="w-[380px] min-w-[380px] max-w-[380px] mx-auto p-0 bg-transparent shrink-0"
    >
      <div
        id="instagram-story-viewers-preview-card"
        style={{
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className={`w-full overflow-hidden border-0 ${
          isDark ? 'bg-[#262930]' : 'bg-slate-100'
        } font-sans select-none relative shadow-2xl min-h-[640px] flex flex-col`}
      >
        {/* 1. Top Section (Contrast background behind Story Thumbnails) */}
        <div className={`flex flex-col pt-4 pb-1 transition-colors ${
          isDark ? 'bg-[#262930] text-white' : 'bg-slate-100 text-slate-900'
        }`}>
          {/* Top Navigation Bar */}
          <div className="flex items-center justify-between px-5 pb-2">
            {/* Top Left: Settings Icon */}
            <button
              type="button"
              className={`p-1 hover:opacity-75 cursor-pointer ${isDark ? 'text-white' : 'text-slate-800'}`}
            >
              <Settings className="w-6 h-6 stroke-[1.8]" />
            </button>

            {/* Top Right: Close X icon */}
            <button
              type="button"
              className={`p-1 hover:opacity-75 cursor-pointer ${isDark ? 'text-white' : 'text-slate-800'}`}
            >
              <X className="w-6.5 h-6.5 stroke-[2]" />
            </button>
          </div>

          {/* 2. Dynamic Story Carousel Container with Active Center Card Centered */}
          <div className="relative w-full h-48 flex justify-center items-center pt-2 pb-3 px-3 overflow-hidden">
            {/* LEFT SLOT (Shown only when more than 1 slide exists, positioned to left of center) */}
            {images.length > 1 && (
              <div className="absolute right-[calc(50%+4rem)] flex items-center">
                {hasPrevious && previousImage && previousImage.trim() !== '' ? (
                  <div
                    onClick={() => setLocalActiveIndex(currentIndex - 1)}
                    className="w-20 h-32 rounded-2xl overflow-hidden bg-black text-white border-0 shadow-sm shrink-0 opacity-90 scale-95 hover:scale-100 transition-all cursor-pointer"
                  >
                    <img
                      src={previousImage.trim()}
                      alt="Previous Story"
                      className="w-full h-full object-cover"
                      style={{
                        imageRendering: '-webkit-optimize-contrast',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translate3d(0, 0, 0)',
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-32 rounded-2xl bg-black border-0 shadow-sm text-zinc-400 shrink-0 flex items-center justify-center scale-95">
                    <span className="text-[10px] font-medium opacity-60 text-white">Story</span>
                  </div>
                )}
              </div>
            )}

            {/* CENTER SLOT (Active Story - Main Focus, Centered in the middle, Solid Black Card) */}
            <div className="relative w-28 h-44 rounded-2xl overflow-hidden bg-black text-white border-0 shadow-md shrink-0 z-10 transition-all flex items-center justify-center">
              {currentActiveImage && currentActiveImage.trim() !== '' ? (
                <img
                  src={currentActiveImage.trim()}
                  alt="Active Story"
                  className="w-full h-full object-cover"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'translate3d(0, 0, 0)',
                  }}
                />
              ) : (
                <div className="w-full h-full bg-black text-white flex items-center justify-center">
                  <Camera className="w-8 h-8 opacity-80 text-white" />
                </div>
              )}
              {/* Viewer Count & 2-people silhouette icon at bottom center (No drop shadow) */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-1 text-white font-bold text-xs z-20 whitespace-nowrap">
                <Users className="w-3.5 h-3.5 fill-white text-white" />
                <span className="leading-none tracking-tight text-white">{effectiveCount}</span>
              </div>
            </div>

            {/* RIGHT SLOT (Next Story OR Add Story Camera, positioned neatly to the right of center) */}
            <div className="absolute left-[calc(50%+4rem)] flex items-center">
              {hasNext && nextImage && nextImage.trim() !== '' ? (
                <div
                  onClick={() => setLocalActiveIndex(currentIndex + 1)}
                  className="w-20 h-32 rounded-2xl overflow-hidden bg-black text-white border-0 shadow-sm shrink-0 opacity-90 scale-95 hover:scale-100 transition-all cursor-pointer"
                >
                  <img
                    src={nextImage.trim()}
                    alt="Next Story"
                    className="w-full h-full object-cover"
                    style={{
                      imageRendering: '-webkit-optimize-contrast',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'translate3d(0, 0, 0)',
                    }}
                  />
                </div>
              ) : (
                <div className="w-20 h-32 rounded-2xl bg-black border-0 shadow-sm text-white flex items-center justify-center shrink-0 scale-95 hover:scale-100 transition-all cursor-pointer">
                  <Camera className="w-7 h-7 stroke-[1.8] text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Bottom Sheet Section (Black in dark mode, White in light mode) */}
        <div className={`relative flex-1 flex flex-col transition-colors ${isDark ? 'bg-[#121212] text-white' : 'bg-white text-black'}`}>
          {/* Upward Pointer Triangle (Positioned absolute on top edge of bottom sheet) */}
          <div
            className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4.5 h-4.5 ${
              isDark ? 'bg-[#121212]' : 'bg-white'
            } rotate-45 rounded-xs z-20 pointer-events-none`}
          />

          {/* Header Row: Viewer Tab with Blue Bottom Border + Trash Bin Icon */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1 border-b border-gray-100/10">
            {/* Active Tab: Viewer count with blue bottom border */}
            <div className={`flex items-center space-x-1.5 border-b-2 border-blue-600 pb-2 px-0.5 -mb-px z-10 ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              <Users className={`w-5 h-5 ${isDark ? 'text-white fill-white' : 'text-black fill-black'}`} />
              <span className="text-sm font-bold">{effectiveCount}</span>
            </div>

            {/* Right Action: Clean Trash Bin Icon Only */}
            <button
              type="button"
              className={`p-1 pb-2 hover:opacity-70 transition-opacity cursor-pointer z-10 ${
                isDark ? 'text-white' : 'text-black'
              }`}
              title="Delete"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>

          {/* Title Section: "Who viewed this story" */}
          <div className="px-5 pt-4 pb-2 text-left">
            <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              {isId ? 'Dilihat oleh' : 'Who viewed this story'}
            </h2>
          </div>

          {/* Viewer List Section */}
          <div className="px-5 pb-6 space-y-4 flex-1 overflow-y-auto">
            {viewers && viewers.length > 0 ? (
              viewers.map((viewer, idx) => {
                return (
                  <div
                    key={viewer.id || `v-${idx}`}
                    className="flex items-center justify-between text-left group"
                  >
                    {/* Left: Circular Avatar with overlapping Like Heart Badge & Username */}
                    <div className="flex items-center space-x-3">
                      <div className="relative shrink-0">
                        {viewer.avatar && viewer.avatar.trim() !== '' ? (
                          <img
                            src={viewer.avatar.trim()}
                            alt={viewer.username || 'viewer'}
                            className={`w-11 h-11 rounded-full object-cover border shadow-2xs ${
                              isDark ? 'border-zinc-700/60' : 'border-gray-100'
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-full ${
                              isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700/60' : 'bg-gray-200 text-gray-500 border-gray-100'
                            } border flex items-center justify-center shrink-0`}
                          >
                            <svg className="w-6 h-6 fill-current opacity-70" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                          </div>
                        )}
                        {/* Overlapping Red Like Heart Badge at bottom-right corner of avatar */}
                        {viewer.likedStory && (
                          <div className={`absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center border shadow-xs ${
                            isDark ? 'bg-[#121212] border-[#121212]' : 'bg-white border-white'
                          }`}>
                            <svg className="w-3 h-3 fill-[#ED4956] text-[#ED4956]" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                          {renderFormattedTextWithAppleEmojis(viewer.username || 'user_1')}
                        </span>
                      </div>
                    </div>

                    {/* Right Action Icons: Horizontal Three Dots (...) FIRST, then Paper Plane (Send) */}
                    <div className={`flex items-center space-x-4 ${isDark ? 'text-white' : 'text-black'}`}>
                      <button
                        type="button"
                        className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
                        title="More options"
                      >
                        <MoreHorizontal className="w-5 h-5 stroke-[2]" />
                      </button>
                      <button
                        type="button"
                        className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
                        title="Send message"
                      >
                        {/* Custom rounded Paper Plane (Send) Icon */}
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={`py-8 text-center text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>
                No viewers yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


