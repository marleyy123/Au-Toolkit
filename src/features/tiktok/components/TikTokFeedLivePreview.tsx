import React from 'react';
import { TikTokFeedLiveData } from '../../../types';
import { renderFormattedTextWithAppleEmojis } from '../../../utils/emojiUtils';
import { TikTokVerifiedBadge } from './TikTokIcons';
import {
  Tv,
  Search,
  Home,
  ShoppingBag,
  Plus,
  MessageSquare,
  User,
} from 'lucide-react';

interface Props {
  data: TikTokFeedLiveData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
}

// Custom Repost Icon (Exact replica of vertical repost arrows icon)
const RepostIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3.5 6.5 6 4 8.5 6.5" />
    <path d="M6 4v13a3 3 0 0 0 3 3h4.5" />
    <polyline points="15.5 17.5 18 20 20.5 17.5" />
    <path d="M18 20V7a3 3 0 0 0-3-3h-4.5" />
  </svg>
);

// Animated Equalizer Bars Icon for "Tap to watch LIVE"
const SoundEqualizerIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-end space-x-0.5 h-4.5 ${className}`}>
    <span className="w-0.5 bg-white h-2.5 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-0.5 bg-white h-4.5 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-0.5 bg-white h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    <span className="w-0.5 bg-white h-3.5 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
  </div>
);

export const TikTokFeedLivePreview: React.FC<Props> = ({ data, previewRef }) => {
  const {
    liveImage = '',
    avatarUrl = '',
    username = '',
    caption = '',
    locationText = '',
    activeNavTab = 'foryou',
  } = (data || {}) as any;

  return (
    <div
      ref={previewRef}
      id="export-tiktok-feed-live"
      className="w-[380px] min-w-[380px] max-w-[380px] mx-auto p-0 bg-transparent shrink-0"
    >
      <div
        id="tiktok-feed-live-card"
        style={{
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className="w-full aspect-[9/16] min-h-[675px] relative overflow-hidden bg-neutral-950 text-white select-none font-sans flex flex-col justify-between"
      >
        {/* 1. Fullscreen Background Live Image */}
        {liveImage ? (
          <img
            src={liveImage}
            alt="TikTok LIVE broadcast"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-950 z-0 flex items-center justify-center text-white/20 text-xs font-normal">
            {/* Clean empty dark canvas without harsh shadow overlay */}
          </div>
        )}

        {/* 2. Top Feed Navigation Bar: Single Horizontal Row with Stacked LIVE Button on Far Left */}
        <div className="relative z-20 px-3 pt-3 pb-1 flex items-center justify-between text-white drop-shadow-md gap-1">
          {/* Left: Stacked LIVE Button with TV on top and LIVE text below */}
          <button
            type="button"
            className="flex flex-col items-center justify-center min-w-[36px] px-1 py-0.5 hover:opacity-85 transition-opacity cursor-pointer shrink-0"
            title="TikTok LIVE"
          >
            <Tv className="w-5 h-5 text-white stroke-[2.2]" />
            <span className="text-[9px] font-black tracking-wider uppercase leading-none mt-0.5">LIVE</span>
          </button>

          {/* Center Feed Tabs in One Continuous Horizontal Line without wrapping */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-3.5 text-[14px] sm:text-[15px] font-semibold text-white/70 drop-shadow-sm whitespace-nowrap overflow-x-auto no-scrollbar">
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'location'
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              {renderFormattedTextWithAppleEmojis(locationText || 'Sleman')}
            </span>
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'friends'
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              Friends
            </span>
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'following'
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              Following
            </span>
            <span
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                activeNavTab === 'foryou' || !activeNavTab
                  ? 'text-white font-bold border-b-2 border-white pb-0.5'
                  : 'hover:text-white'
              }`}
            >
              For You
            </span>
          </div>

          {/* Right: Search Icon */}
          <button
            type="button"
            className="p-1 text-white hover:opacity-80 transition-opacity cursor-pointer shrink-0"
            title="Search"
          >
            <Search className="w-5 h-5 drop-shadow-md stroke-[2.2]" />
          </button>
        </div>

        {/* Main Center Content Spacer & Live Call-to-Action */}
        <div className="relative z-20 flex-1 flex flex-col justify-end items-center pb-5">
          {/* 3. Live Call-to-Action (Center Bottom Button) */}
          <div className="bg-black/40 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full inline-flex items-center justify-center space-x-2 text-white font-bold shadow-xl tracking-wide transition-all cursor-pointer hover:bg-black/50 hover:scale-105 active:scale-95 w-fit whitespace-nowrap shrink-0">
            <SoundEqualizerIcon />
            <span className="text-sm sm:text-base whitespace-nowrap font-bold">Tap to watch LIVE</span>
          </div>
        </div>

        {/* 4. Bottom Info Area: LIVE Now badge, Broadcaster Username, and Live Caption */}
        <div className="relative z-20 px-4 pb-3 flex items-end justify-between space-x-3">
          <div className="flex-1 space-y-1.5 text-left">
            {/* Badges Row */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="bg-[#FE2C55] text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                LIVE now
              </span>
            </div>

            {/* Broadcaster Username */}
            <h2 className="text-base font-bold text-white drop-shadow-md leading-tight flex items-center gap-1">
              <span>{renderFormattedTextWithAppleEmojis(username || 'username')}</span>
              {data.isVerified && (
                <TikTokVerifiedBadge className="w-3.5 h-3.5" />
              )}
            </h2>

            {/* Caption */}
            <p className="text-sm sm:text-base font-normal text-white/95 leading-snug drop-shadow-md max-w-[290px]">
              {renderFormattedTextWithAppleEmojis(caption || 'Your text goes here')}
            </p>
          </div>
        </div>

        {/* 6. Bottom Navigation Bar */}
        <div className="relative z-20 h-14 bg-black/95 backdrop-blur-md border-t border-white/10 px-4 flex items-center justify-between text-white/70">
          {/* Home */}
          <div className="flex flex-col items-center justify-center cursor-pointer text-white">
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-0.5">Home</span>
          </div>

          {/* Shop */}
          <div className="flex flex-col items-center justify-center cursor-pointer hover:text-white transition-colors">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] font-medium mt-0.5">Shop</span>
          </div>

          {/* TikTok [+] Create Button */}
          <div className="relative flex items-center justify-center cursor-pointer hover:scale-105 transition-transform px-1">
            <div className="w-11 h-7 bg-white rounded-lg relative flex items-center justify-center shadow-md">
              {/* Cyan / Blue left accent */}
              <div className="absolute top-0 bottom-0 -left-1 w-3 bg-[#00f2fe] rounded-l-lg -z-10" />
              {/* Pink / Red right accent */}
              <div className="absolute top-0 bottom-0 -right-1 w-3 bg-[#FE2C55] rounded-r-lg -z-10" />
              <Plus className="w-5 h-5 text-black stroke-[3]" />
            </div>
          </div>

          {/* Inbox */}
          <div className="flex flex-col items-center justify-center cursor-pointer hover:text-white transition-colors">
            <MessageSquare className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] font-medium mt-0.5">Inbox</span>
          </div>

          {/* Profile */}
          <div className="flex flex-col items-center justify-center cursor-pointer hover:text-white transition-colors">
            <User className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] font-medium mt-0.5">Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};
