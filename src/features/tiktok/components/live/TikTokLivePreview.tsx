import React, { useState, useEffect } from 'react';
import { TikTokLiveData, TikTokLiveProduct } from '../../../../types';
import { resolveLocalImageReference } from '../../../../utils/imageManager';
import { renderFormattedTextWithAppleEmojis } from '../../../../utils/emojiUtils';

import { EmptyAvatarPlaceholder, PlusHeartIcon, SmallHeartIcon, WaveHandIcon, CloseXIcon, BottomSmileyIcon, MultiGuestIcon, RoseGiftIcon, GiftBoxIcon, ShareArrowIcon, YellowShoppingBagIcon } from './TikTokLiveIcons';

interface Props {
  data: TikTokLiveData;
  previewRef?: React.RefObject<HTMLDivElement | null>;
  onChange?: (data: TikTokLiveData) => void;
}


export const TikTokLivePreview: React.FC<Props> = ({ data, previewRef, onChange }) => {
  const {
    liveMediaUrl = '',
    liveMediaType = 'image',
    avatarUrl = '',
    username = '',
    likeCount = '',
    joinButtonText = '',
    showJoinButton = true,
    viewerCount = '',
    viewers = [],
    showDailyRanking = true,
    dailyRankingText = '',
    rankingBadgeIcon = 'bag',
    showNewRound = true,
    newRoundText = '',
    comments = [],
    showFloatingHearts = true,
    floatingHeartsCount = 6,
    commentPlaceholder = '',
    showGuestButton = true,
    showRoseButton = true,
    showGiftButton = true,
    showShareButton = true,
    // TikTok Shop / Yellow Cart
    showYellowCart = false,
    cartItemCount = '6',
    showCartBadge = true,
    showProductCard = false,
    activeProductId,
    products = [],
  } = (data || {}) as TikTokLiveData;

  // State to toggle interactive TikTok LIVE Voucher / Discount popup bottom sheet
  const [localVoucherModal, setLocalVoucherModal] = useState(false);
  const [localVoucherClaimed, setLocalVoucherClaimed] = useState(false);
  const showVoucherModal = data.showVoucherModal ?? localVoucherModal;
  const voucherClaimed = data.voucherClaimed ?? localVoucherClaimed;
  const setShowVoucherModal = (value: boolean) => onChange ? onChange({ ...data, showVoucherModal: value }) : setLocalVoucherModal(value);
  const setVoucherClaimed = (value: boolean) => onChange ? onChange({ ...data, voucherClaimed: value }) : setLocalVoucherClaimed(value);
  const [localVideo, setLocalVideo] = useState({ source: '', url: '' });
  useEffect(() => {
    let cancelled = false;
    if (liveMediaType === 'video' && liveMediaUrl.startsWith('au-local-media://')) {
      void resolveLocalImageReference(liveMediaUrl).then(url => {
        if (!cancelled) setLocalVideo({ source: liveMediaUrl, url });
      }).catch(() => { if (!cancelled) setLocalVideo({ source: liveMediaUrl, url: '' }); });
    }
    return () => { cancelled = true; };
  }, [liveMediaUrl, liveMediaType]);
  const videoUrl = liveMediaUrl.startsWith('au-local-media://')
    ? (localVideo.source === liveMediaUrl ? localVideo.url : '') : liveMediaUrl;

  // Empty media uses a neutral placeholder.
  const isRealMedia = (url?: string) =>
    Boolean(url && typeof url === 'string' && url.trim().length > 0);

  const isVideoMedia =
    liveMediaType === 'video' ||
    (typeof liveMediaUrl === 'string' &&
      (liveMediaUrl.endsWith('.mp4') || liveMediaUrl.endsWith('.webm') || liveMediaUrl.startsWith('data:video/')));

  // Strictly enforce clean English and 'username' fallback for all visual elements
  const displayUsername = username?.trim() || 'username';
  const displayJoinButtonText = joinButtonText?.trim() || 'Join';
  
  // Daily Ranking & New Round - optional and deletable (only shown if enabled)
  const hasDailyRanking = showDailyRanking !== false;
  const displayDailyRanking =
    dailyRankingText === 'Daily Ranking'
      ? 'Daily Ranking'
      : dailyRankingText === 'Peringkat Belanja' || dailyRankingText === 'Shopping Ranking'
      ? 'Shopping Ranking'
      : dailyRankingText && dailyRankingText.trim() !== ''
      ? dailyRankingText
      : 'Shopping Ranking';

  const activeRankingIcon =
    rankingBadgeIcon || (displayDailyRanking === 'Daily Ranking' ? 'fire' : 'bag');

  const hasNewRound = Boolean(
    showNewRound !== false &&
    newRoundText &&
    newRoundText.trim() !== '' &&
    newRoundText !== 'Babak Baru'
  );
  const displayNewRound = newRoundText || '';

  const displayCommentPlaceholder = commentPlaceholder?.trim() || 'Add comment...';
  const displayLikes = (!likeCount || likeCount.trim() === '') ? '33.6K' : likeCount;
  const displayViewersCount = (!viewerCount || viewerCount.trim() === '') ? '12' : viewerCount;

  // Active product calculation for Live Shopping Product Card
  const defaultLiveProduct: TikTokLiveProduct = {
    id: 'prod-1',
    image: '',
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
    subtitle: '',
    hotBadge: '',
    buttonText: 'Buy',
  };
  const activeProduct =
    (products && products.length > 0)
      ? (products.find((p) => p.id === activeProductId) || products[0])
      : defaultLiveProduct;

  // Product content follows the saved form values.
  const cleanTitle = activeProduct?.title?.trim() || '';
  const cleanPrice = activeProduct?.price?.trim() || '';
  const cleanOriginalPrice = activeProduct?.originalPrice?.trim() || '';
  const cleanDiscount = activeProduct?.discount?.trim() || '';
  const cleanSubtitle = activeProduct?.subtitle?.trim() || '';
  const cleanHotBadge = activeProduct?.hotBadge?.trim() || '';
  const cleanButtonText = (activeProduct?.buttonText && activeProduct.buttonText.trim()) || 'Buy';

  // Discount percentage calculation or extraction (e.g. -17%) displayed next to original price
  const getDiscountPercentage = (): string => {
    // Only display if user explicitly provided a discount value in the discount input
    if (cleanDiscount) {
      const match = cleanDiscount.trim().match(/^-?(\d+(?:\.\d+)?)\s*%?(?:\s*off)?$/i);
      return match ? `-${match[1]}%` : '';
    }

    // Do NOT auto-calculate from originalPrice/price to prevent unwanted preview percentages (e.g. -63%)
    return '';
  };
  const discountPercentage = getDiscountPercentage();

  // Pre-configured variations for floating hearts (upward fluttering stream)
  const heartsCount = Math.max(0, Math.min(10, floatingHeartsCount ?? 6));
  const heartStyles = [
    { bottom: 0, right: 6, size: 'w-7.5 h-7.5', rotate: 'rotate-12', color: '#fe2c55', opacity: 'opacity-100' },
    { bottom: 24, right: 14, size: 'w-6 h-6', rotate: '-rotate-12', color: '#e91e63', opacity: 'opacity-95' },
    { bottom: 48, right: 4, size: 'w-7 h-7', rotate: 'rotate-6', color: '#ff1744', opacity: 'opacity-90' },
    { bottom: 74, right: 16, size: 'w-5.5 h-5.5', rotate: '-rotate-15', color: '#ff4081', opacity: 'opacity-85' },
    { bottom: 98, right: 6, size: 'w-6.5 h-6.5', rotate: 'rotate-15', color: '#f50057', opacity: 'opacity-80' },
    { bottom: 122, right: 15, size: 'w-5 h-5', rotate: '-rotate-6', color: '#ff5252', opacity: 'opacity-75' },
    { bottom: 146, right: 3, size: 'w-6 h-6', rotate: 'rotate-10', color: '#fe2c55', opacity: 'opacity-70' },
    { bottom: 168, right: 12, size: 'w-4.5 h-4.5', rotate: '-rotate-10', color: '#ff3366', opacity: 'opacity-65' },
    { bottom: 188, right: 7, size: 'w-5 h-5', rotate: 'rotate-12', color: '#e91e63', opacity: 'opacity-60' },
    { bottom: 206, right: 14, size: 'w-4 h-4', rotate: '-rotate-8', color: '#ff4081', opacity: 'opacity-55' },
  ];

  return (
    <div
      ref={previewRef}
      id="export-tiktok-live"
      data-tiktok-live-preview
      data-export-width="380"
      className="w-[380px] min-w-[380px] max-w-[380px] mx-auto p-0 bg-transparent shrink-0"
    >
      <div
        id="tiktok-live-card"
        style={{
          borderRadius: 'var(--preview-corner-radius, 0px)',
        }}
        className="w-full aspect-[9/16] min-h-[675px] max-h-[676px] relative overflow-hidden bg-neutral-950 text-white select-none font-sans flex flex-col justify-between"
      >
        {/* 1. Fullscreen Background Live Media (Image or Video) - Empty by default, no sample images */}
        {isRealMedia(liveMediaUrl) ? (
          isVideoMedia ? (
            <video
              src={videoUrl || undefined}
              data-live-media-source={liveMediaUrl}
              crossOrigin="anonymous"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <img
              src={liveMediaUrl}
              alt="LIVE broadcast"
              crossOrigin="anonymous"
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 z-0 flex items-center justify-center">
            <span className="text-white/30 text-xs font-medium">Upload LIVE Background Photo / Video</span>
          </div>
        )}

        {/* Subtle Top & Bottom Gradient Shadows for authentic readability */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none z-10" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none z-10" />

        {/* 2. Top Header Section: Profile on Left, Viewers & Close 'X' on Right */}
        <div className="relative z-20 pt-3 px-3 flex flex-col gap-1.5">
          {/* Top Row: Left Profile Pill & Right Viewers/Count/Close X aligned on center axis with Join button */}
          <div className="flex items-center justify-between gap-1.5">
            {/* Host Profile Pill */}
            <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md rounded-full pl-1 pr-1.5 py-1 shadow-md max-w-[215px]">
              {/* Host Avatar - clean empty silhouette if not uploaded */}
              {isRealMedia(avatarUrl) ? (
                <img
                  src={avatarUrl}
                  alt={displayUsername}
                  crossOrigin="anonymous"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <EmptyAvatarPlaceholder className="w-8 h-8" />
              )}

              {/* Username & Likes Info */}
              <div className="min-w-0 pr-1 flex flex-col justify-center">
                <span className="text-[12px] font-bold text-white truncate leading-tight block max-w-[85px]">
                  {displayUsername}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-white/85 font-medium leading-none mt-0.5">
                  <SmallHeartIcon className="w-2.5 h-2.5 text-white/90" filled={false} />
                  <span className="truncate">{displayLikes}</span>
                </div>
              </div>

              {/* "Join" / Host Follow Button */}
              {showJoinButton && (
                <button
                  type="button"
                  className="bg-white text-[#ff5722] hover:bg-white/95 transition-all rounded-full pl-1.5 pr-2.5 py-0.5 flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
                  title={displayJoinButtonText}
                >
                  <PlusHeartIcon className="w-3.5 h-3.5 text-[#ff5722]" />
                  <span className="text-[11px] font-extrabold tracking-tight leading-none text-[#ff5722]">
                    {displayJoinButtonText}
                  </span>
                </button>
              )}
            </div>

            {/* Top Right: Overlapping Viewers, Viewer Count (12), Close 'X' - centered with the Join button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Top Viewer Avatars (fully rounded circles and badges that are never cut off) */}
              {Array.isArray(viewers) && viewers.length > 0 && (
                <div className="flex items-center gap-1.5">
                  {viewers.slice(0, 5).map((v, idx) => (
                    <div key={v.id || idx} className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                      {/* Avatar circle with rounded-full & overflow-hidden (no dark outline) */}
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0">
                        {isRealMedia(v.avatar) ? (
                          <img
                            src={v.avatar}
                            alt="Viewer"
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <EmptyAvatarPlaceholder className="w-7 h-7" />
                        )}
                      </div>

                      {/* Rank Badge pill sitting at the bottom, perfectly formed and not cut off */}
                      {(() => {
                        const defaultBadge = idx === 0 ? '10+' : idx === 1 ? '7' : `${idx + 1}`;
                        const displayBadge = (v.badge && v.badge.trim() !== '') ? v.badge : defaultBadge;
                        return (
                          <span
                            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-black rounded-full min-w-[16px] h-3.5 px-1 flex items-center justify-center leading-none shadow-sm z-20 whitespace-nowrap ${
                              idx === 0
                                ? 'bg-amber-400 text-black'
                                : idx === 1
                                ? 'bg-cyan-500 text-white'
                                : idx === 2
                                ? 'bg-rose-500 text-white'
                                : idx === 3
                                ? 'bg-purple-600 text-white'
                                : 'bg-emerald-500 text-white'
                            }`}
                          >
                            {displayBadge}
                          </span>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}

              {/* Viewer Count Pill: Larger black translucent rounded pill with larger number */}
              <div className="bg-black/55 backdrop-blur-md text-white font-extrabold text-[13px] px-3.5 py-1 rounded-full min-w-[34px] text-center shadow-xs leading-none flex items-center justify-center">
                {displayViewersCount}
              </div>

              {/* Close 'X' Button */}
              <button
                type="button"
                className="p-1 text-white/95 hover:text-white drop-shadow-md cursor-pointer transition-opacity shrink-0 flex items-center justify-center"
                title="Close LIVE"
              >
                <CloseXIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Second Row: Badges underneath (Daily Ranking & New Round) - only rendered if active & has non-empty text */}
          {(hasDailyRanking || hasNewRound) && (
            <div className="flex items-center justify-between px-0.5">
              {/* Left: Ranking badge (e.g. 🔥 Daily Ranking or 🛍️ Shopping Ranking) */}
              {hasDailyRanking ? (
                <div className="bg-black/45 backdrop-blur-xs px-3.5 py-1 min-w-[125px] rounded text-white text-[11px] font-medium flex items-center justify-center gap-1.5 shadow-xs">
                  <span>
                    {activeRankingIcon === 'fire'
                      ? '🔥'
                      : activeRankingIcon === 'heart'
                      ? '❤️'
                      : activeRankingIcon === 'star'
                      ? '⭐'
                      : '🛍️'}
                  </span>
                  <span className="truncate">{displayDailyRanking}</span>
                </div>
              ) : (
                <div />
              )}

              {/* Right: New Round 🎆 - positioned on right under the close 'X' button */}
              {hasNewRound && (
                <div className="ml-auto bg-black/45 backdrop-blur-xs px-2.5 py-0.5 rounded text-white text-[11px] font-medium flex items-center gap-1 shadow-xs">
                  <span>{displayNewRound}</span>
                  <span>🎆</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Live Comments & Activity Feed (Bottom Left) - adjusts height when product card is visible */}
        <div
          className={`absolute ${showProductCard && activeProduct ? 'bottom-36 max-h-[160px]' : 'bottom-16 max-h-[220px]'} left-3 right-16 z-20 flex flex-col justify-end space-y-1.5 pointer-events-none overflow-hidden transition-all duration-200`}
        >
          {comments && comments.map((item, index) => {
            const commentUser = item.username?.trim() || 'username';

            if (item.type === 'join') {
              const joinText = (!item.content || item.content === 'sudah bergabung') ? 'joined' : item.content;
              return (
                <div
                  key={item.id || index}
                  className="flex items-center gap-1.5 text-xs text-white/95 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                >
                  <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                    <WaveHandIcon className="w-3 h-3" />
                  </div>
                  <span className="truncate">
                    <strong className="font-bold text-white">{commentUser}</strong>{' '}
                    <span className="text-white/90">{joinText}</span>
                  </span>
                </div>
              );
            }

            if (item.type === 'like') {
              const likeText = (!item.content || item.content === 'menyukai LIVE') ? 'liked the LIVE' : item.content;
              return (
                <div
                  key={item.id || index}
                  className="flex items-center gap-1.5 text-xs text-white/95 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                >
                  <div className="w-5 h-5 rounded-full bg-black/40 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                    <SmallHeartIcon className="w-3 h-3 text-white" filled={false} />
                  </div>
                  <span className="truncate">
                    <strong className="font-bold text-white">{commentUser}</strong>{' '}
                    <span className="text-white/90">{likeText}</span>
                  </span>
                </div>
              );
            }

            // Standard Live Chat Comment
            const commentContent = item.content || '';
            return (
              <div
                key={item.id || index}
                className="flex items-start gap-1.5 text-xs leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
              >
                {/* User Avatar - only real uploaded image, never sample/fake photos */}
                {isRealMedia(item.avatar) ? (
                  <img
                    src={item.avatar}
                    alt={commentUser}
                    crossOrigin="anonymous"
                    className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[9px] text-white/70 font-bold shrink-0 mt-0.5">
                    U
                  </div>
                )}

                {/* Badges + Username + Comment Text */}
                <div className="flex-1 break-words">
                  {/* Level Badge (e.g. ▲ 14) */}
                  {item.levelBadge && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[8.5px] font-black px-1.5 py-0.2 rounded-sm mr-1 leading-tight text-white shadow-xs ${
                        item.levelColor === 'orange'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                          : item.levelColor === 'purple'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                    >
                      <span>▲</span>
                      <span>{item.levelBadge}</span>
                    </span>
                  )}

                  {/* Sub Badge (e.g. Orange Heart 11) */}
                  {item.subBadge && (
                    <span className="inline-flex items-center bg-orange-500 text-white text-[8.5px] font-bold px-1 py-0.2 rounded-sm mr-1 leading-tight shadow-xs">
                      {item.subBadge}
                    </span>
                  )}

                  {/* Username */}
                  <span className="font-bold text-white/95 mr-1 inline">
                    {commentUser}
                  </span>

                  {/* Comment Text with Apple Emoji support */}
                  <span className="text-white font-normal inline">
                    {renderFormattedTextWithAppleEmojis(commentContent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Floating LIVE Reaction Hearts (Bottom Right - Stream of Fluttering Hearts) */}
        {showFloatingHearts !== false && heartsCount > 0 && (
          <div className="absolute bottom-16 right-3 z-20 w-12 h-64 pointer-events-none drop-shadow-md">
            {heartStyles.slice(0, heartsCount).map((h, i) => (
              <div
                key={i}
                style={{ bottom: `${h.bottom}px`, right: `${h.right}px` }}
                className={`absolute transform ${h.rotate} ${h.opacity} transition-all duration-300`}
              >
                <svg viewBox="0 0 24 24" className={h.size} fill={h.color}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* 4.5 LIVE Shopping Product Card Overlay (Horizontal floating card above bottom controls) */}
        {showProductCard && activeProduct && (
          <div className="absolute bottom-14 left-2.5 right-2.5 z-25 bg-white rounded-2xl p-2.5 shadow-2xl flex items-center gap-2.5 select-none text-neutral-900 border border-black/5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Left: Thumbnail with Hot badge */}
            <div className="relative w-18 h-18 shrink-0 rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center border border-neutral-200/60">
              {/* Hot badge - only rendered if user explicitly typed a hot badge */}
              {cleanHotBadge && (
                <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-black italic px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs z-10 leading-none">
                  <span className="not-italic">🔥</span>
                  <span>{cleanHotBadge}</span>
                </div>
              )}

              {/* Product Image */}
              {isRealMedia(activeProduct.image) ? (
                <img
                  src={activeProduct.image}
                  alt={cleanTitle || 'Product'}
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 text-orange-400 p-2 text-center">
                  <YellowShoppingBagIcon className="w-8 h-8 opacity-80" />
                </div>
              )}
            </div>

            {/* Center: Title, Discount Tag, Subtitle, Price */}
            <div className="flex-1 min-w-0 flex flex-col justify-center pr-1">
              {/* Product Title - only rendered if user typed it */}
              {cleanTitle && (
                <h4 className="text-[13px] sm:text-[13.5px] font-bold text-neutral-900 truncate leading-snug">
                  {cleanTitle}
                </h4>
              )}

              {/* Promo Tag - only rendered if user typed a non-percentage promotional badge */}
              {cleanDiscount && !cleanDiscount.match(/^\s*-?\d+(?:\.\d+)?%?(?:\s*off)?\s*$/i) && (
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  className="text-[10px] font-medium text-[#fe2c55] leading-none mt-0.5 text-left hover:underline cursor-pointer"
                  title="Lihat diskon & voucher"
                >
                  {cleanDiscount}
                </button>
              )}

              {/* Subtitle - only rendered if user typed it */}
              {cleanSubtitle && (
                <span className="text-[10px] font-medium text-amber-800/85 leading-tight mt-1 mb-1 block">
                  {cleanSubtitle}
                </span>
              )}

              {/* Price Row - only rendered if user typed price or original price */}
              {(cleanPrice || cleanOriginalPrice) && (
                <div className={`flex items-baseline gap-1.5 ${cleanSubtitle ? 'mt-1' : 'mt-1.5'}`}>
                  {cleanPrice && (
                    <span className="text-[14px] font-black text-neutral-950 leading-none">
                      {cleanPrice}
                    </span>
                  )}
                  {cleanOriginalPrice && (
                    <span className="text-[10.5px] font-normal text-neutral-400 line-through leading-none">
                      {cleanOriginalPrice}
                    </span>
                  )}
                  {discountPercentage && (
                    <button
                      type="button"
                      onClick={() => setShowVoucherModal(true)}
                      className="text-[10.5px] font-light text-[#fe2c55] leading-none hover:underline cursor-pointer transition-opacity active:opacity-75"
                      title="Lihat diskon & voucher"
                    >
                      {discountPercentage}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right: Buy Button */}
            <button
              type="button"
              className="bg-[#fe2c55] hover:bg-[#e0264b] active:scale-95 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xs shrink-0 cursor-pointer transition-all self-end mb-0.5"
            >
              {cleanButtonText}
            </button>

            {/* Top Right Close Button */}
            <button
              type="button"
              className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-400 hover:text-neutral-600 flex items-center justify-center cursor-pointer transition-colors"
              title="Close"
            >
              <CloseXIcon className="w-2.5 h-2.5 text-neutral-500" />
            </button>
          </div>
        )}

        {/* 5. Bottom Control & Input Bar */}
        <div className="relative z-20 pb-3 px-2.5 flex items-center gap-1.5">
          {/* Yellow Shopping Bag / Keranjang Kuning (Bottom-Left - Kotak Tumpul) */}
          {showYellowCart && (
            <div className="relative shrink-0 flex items-center justify-center">
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                title="TikTok Shop"
              >
                <YellowShoppingBagIcon className="w-7 h-7 drop-shadow-md" />
              </button>
              {showCartBadge !== false && (cartItemCount || '6') && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-white text-[#fe2c55] font-black text-[9px] flex items-center justify-center shadow-md border-0 leading-none z-10 pointer-events-none">
                  {cartItemCount || '6'}
                </span>
              )}
            </div>
          )}

          {/* Unified Comment Input Pill containing Emoji Smiley Button on the Right */}
          <div className="flex-1 bg-black/45 backdrop-blur-md rounded-full pl-3.5 pr-2 py-1.5 text-white/70 text-xs flex items-center justify-between shadow-xs">
            <span className="truncate">{displayCommentPlaceholder}</span>
            <button
              type="button"
              className="p-1 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0 rounded-full hover:bg-white/10"
              title="Emoji"
            >
              <BottomSmileyIcon className="w-5 h-5 text-white/90" />
            </button>
          </div>

          {/* Multi-Guest Button */}
          {showGuestButton !== false && (
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:bg-black/60 transition-colors"
              title="Multi-guest LIVE"
            >
              <MultiGuestIcon className="w-5 h-5" />
            </button>
          )}

          {/* Rose Gift Shortcut Button */}
          {showRoseButton !== false && (
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:bg-black/60 transition-colors"
              title="Rose Gift"
            >
              <RoseGiftIcon className="w-5.5 h-5.5" />
            </button>
          )}

          {/* Gift Box Button */}
          {showGiftButton !== false && (
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:bg-black/60 transition-colors"
              title="Gift"
            >
              <GiftBoxIcon className="w-5.5 h-5.5" />
            </button>
          )}

          {/* Share Button */}
          {showShareButton !== false && (
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-black/45 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-xs cursor-pointer hover:bg-black/60 transition-colors"
              title="Share"
            >
              <ShareArrowIcon className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
        {/* 6. Interactive TikTok LIVE Voucher & Coupon Bottom Sheet Modal */}
        {showVoucherModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            {/* Backdrop click to dismiss */}
            <div
              className="flex-1 w-full"
              onClick={() => setShowVoucherModal(false)}
            />

            {/* Bottom Sheet Card */}
            <div className="bg-white text-neutral-900 rounded-t-2xl p-4 shadow-2xl relative animate-in slide-in-from-bottom duration-200 border-t border-neutral-100 max-h-[82%] flex flex-col select-none">
              {/* Top drag pill & close button */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-black text-neutral-900">Kupon & Diskon Toko</span>
                  {discountPercentage && (
                    <span className="text-[10px] bg-red-50 text-[#fe2c55] font-bold px-1.5 py-0.5 rounded-full">
                      {discountPercentage}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
                  title="Tutup"
                >
                  <CloseXIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Product preview summary in voucher sheet */}
              <div className="py-2.5 flex items-center gap-2 border-b border-dashed border-neutral-200">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 flex items-center justify-center">
                  {isRealMedia(activeProduct?.image) ? (
                    <img
                      src={activeProduct.image}
                      alt={cleanTitle || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <YellowShoppingBagIcon className="w-5 h-5 text-amber-500 opacity-80" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-bold text-neutral-900 truncate">
                    {cleanTitle || 'Produk TikTok LIVE'}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    {cleanPrice && (
                      <span className="text-[12px] font-black text-neutral-900">{cleanPrice}</span>
                    )}
                    {cleanOriginalPrice && (
                      <span className="text-[9.5px] text-neutral-400 line-through">{cleanOriginalPrice}</span>
                    )}
                    {discountPercentage && (
                      <span className="text-[9.5px] font-light text-[#fe2c55]">
                        {discountPercentage}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Voucher Ticket Item */}
              <div className="mt-3 relative bg-gradient-to-r from-red-50/80 via-white to-red-50/40 border border-[#fe2c55]/30 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs overflow-hidden">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wide text-white bg-[#fe2c55] px-1.5 py-0.5 rounded leading-none">
                      Eksklusif LIVE
                    </span>
                    <span className="text-[11px] font-bold text-neutral-800">
                      Diskon {discountPercentage ? discountPercentage.replace('-', '') : '17%'}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-tight">
                    Min. belanja {cleanPrice ? `1x ${cleanPrice}` : 'Rp10.000'} • Berlaku selama siaran LIVE
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-1">
                    Berakhir dalam 24 jam
                  </div>
                </div>

                {/* Claim / Klaim Button */}
                <button
                  type="button"
                  onClick={() => setVoucherClaimed(!voucherClaimed)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all ${
                    voucherClaimed
                      ? 'bg-neutral-100 text-neutral-500 border border-neutral-300'
                      : 'bg-[#fe2c55] text-white hover:bg-[#e0264b] shadow-xs active:scale-95'
                  }`}
                >
                  {voucherClaimed ? 'Terklaim ✓' : 'Klaim'}
                </button>
              </div>

              {/* Bottom Apply Action */}
              <div className="mt-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors active:scale-98"
                >
                  Gunakan Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
