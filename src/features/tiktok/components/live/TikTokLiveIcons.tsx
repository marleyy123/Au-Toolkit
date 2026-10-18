import React from 'react';

// Clean Empty Avatar Placeholder (no fake photos, subtle SVG icon, no black outline)
export const EmptyAvatarPlaceholder: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <div className={`rounded-full bg-white/15 flex items-center justify-center text-white/60 shrink-0 ${className}`}>
    <svg viewBox="0 0 24 24" className="w-1/2 h-1/2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  </div>
);

// 1. TikTok LIVE Top Plus/Heart Badge Icon for "Join" Button
export const PlusHeartIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="#ff5722" stroke="none" />
    <path d="M12 7v10M7 12h10" stroke="#ffffff" strokeWidth="2.8" />
  </svg>
);

// 2. White Heart Outline Icon for "Liked the LIVE" activity & Like stats
export const SmallHeartIcon: React.FC<{ className?: string; filled?: boolean }> = ({ className = 'w-3 h-3', filled = false }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill={filled ? '#ffffff' : 'none'} stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// 3. Waving Hand Icon for "Joined" activity
export const WaveHandIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v3" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
);

// 4. Close 'X' Icon (Crisp TikTok LIVE Top Right Close)
export const CloseXIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// 5. Authentic Emoji Smiley Icon for Bottom Input Bar
export const BottomSmileyIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
  </svg>
);

// 6. Authentic Dual-User Multi-Guest Icon (Cyan & Magenta TikTok LIVE silhouette)
export const MultiGuestIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none">
    {/* Left user: Cyan */}
    <circle cx="8.5" cy="8.5" r="3.2" fill="#00f2fe" />
    <path d="M3.5 19c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5v1H3.5v-1z" fill="#00f2fe" />
    {/* Right user: Hot Pink */}
    <circle cx="15.5" cy="8.5" r="3.2" fill="#fe2c55" />
    <path d="M10.5 19c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5v1H10.5v-1z" fill="#fe2c55" opacity="0.9" />
  </svg>
);

// 7. Authentic TikTok LIVE True Red Rose Gift Icon (Realistic blooming flower with distinct layered curving petals and leaves - NOT a circle)
export const RoseGiftIcon: React.FC<{ className?: string }> = ({ className = 'w-5.5 h-5.5' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none">
    {/* Rose Stem with natural curved stalk */}
    <path
      d="M11.8 13.5c-.3 2.6-.9 5.2-1.5 7.5"
      stroke="#059669"
      strokeWidth="1.8"
      strokeLinecap="round"
    />

    {/* Left Leaf with vein */}
    <path
      d="M11 16.8c-2.4-.2-4.2-1.3-4.8-3.2 2-.3 3.8.8 4.8 3.2z"
      fill="#10b981"
    />
    <path
      d="M7.8 14.8c1.3.4 2.4 1.2 3.2 2"
      stroke="#047857"
      strokeWidth="0.6"
      strokeLinecap="round"
    />

    {/* Right Leaf with vein */}
    <path
      d="M11.6 15.2c2.4-.3 4.2-1.4 4.8-3.3-2-.3-3.8.8-4.8 3.3z"
      fill="#34d399"
    />
    <path
      d="M14.8 13.2c-1.3.4-2.4 1.2-3.2 2"
      stroke="#059669"
      strokeWidth="0.6"
      strokeLinecap="round"
    />

    {/* Green Calyx / Sepals under petal base */}
    <path
      d="M9 12.2c.8.8 2 1.2 3 1.2s2.2-.4 3-1.2c-.3 1.4-1.2 2.2-3 2.2s-2.7-.8-3-2.2z"
      fill="#047857"
    />
    <path
      d="M7.6 11.5c.8.5 1.5.3 2 .1-.4 1.2-1.2 1.6-2 1.2.2-.5.1-.9 0-1.3z"
      fill="#059669"
    />
    <path
      d="M16.4 11.5c-.8.5-1.5.3-2 .1.4 1.2 1.2 1.6 2 1.2-.2-.5-.1-.9 0-1.3z"
      fill="#059669"
    />

    {/* Organic Blooming Rose Petals (Curved petal scallops forming true rose shape, never a circle) */}
    {/* Deep shadow base between folds */}
    <path
      d="M7.2 9.5c-.8-1.5-.4-3.5 1-4.5 1-.7 2.2-.6 3.2 0 1.2-.7 2.6-.7 3.6 0 1.4 1 1.8 3 1 4.5-1 1.8-2.6 2.8-4.1 2.8-1.5 0-3.1-1-4.7-2.8z"
      fill="#9f1239"
    />

    {/* Lower Left Outer Petal - rounded petal curve */}
    <path
      d="M6.5 9c-.2-1.5.5-3 1.8-3.8 1.1-.7 2.5-.5 3.5.3-1.2.2-2.3 1-2.8 2.2-.5 1.2-.4 2.4.2 3.4-1.6-.5-2.6-1.3-2.7-2.1z"
      fill="#be123c"
    />

    {/* Lower Right Outer Petal - rounded petal curve */}
    <path
      d="M17.5 9c.2-1.5-.5-3-1.8-3.8-1.1-.7-2.5-.5-3.5.3 1.2.2 2.3 1 2.8 2.2.5 1.2.4 2.4-.2 3.4 1.6-.5 2.6-1.3 2.7-2.1z"
      fill="#e11d48"
    />

    {/* Bottom Center Outer Petal Cup */}
    <path
      d="M8.5 9.8c.8 1.8 2.1 2.5 3.5 2.5s2.7-.7 3.5-2.5c-1 .8-2.2 1.2-3.5 1.2s-2.5-.4-3.5-1.2z"
      fill="#e11d48"
    />

    {/* Left Intermediate Petal Layer (Curling inward with rounded scallop) */}
    <path
      d="M7.8 7.2c.4-1.4 1.6-2.4 3-2.5 1 .6 1.8 1.6 1.8 2.8 0 1.2-.8 2.2-2 2.4-1.2.2-2.4-.6-2.8-1.7-.1-.3-.1-.7 0-1z"
      fill="#f43f5e"
    />

    {/* Right Intermediate Petal Layer (Curling over and wrapping around) */}
    <path
      d="M16.2 7.2c-.4-1.4-1.6-2.4-3-2.5-1 .6-1.8 1.6-1.8 2.8 0 1.2.8 2.2 2 2.4 1.2.2 2.4-.6 2.8-1.7.1-.3.1-.7 0-1z"
      fill="#fb7185"
    />

    {/* Center Left Petal Flap with rounded edge */}
    <path
      d="M9.2 6.5c.3-.9 1.1-1.6 2.1-1.7.9.4 1.5 1.2 1.5 2.1 0 .9-.6 1.7-1.5 1.8-.9.1-1.8-.4-2.1-1.2v-1z"
      fill="#f43f5e"
    />

    {/* Center Right Overlapping Petal Flap */}
    <path
      d="M14.8 6.5c-.3-.9-1.1-1.6-2.1-1.7-.9.4-1.5 1.2-1.5 2.1 0 .9.6 1.7 1.5 1.8.9.1 1.8-.4 2.1-1.2v-1z"
      fill="#fb7185"
    />

    {/* Inner Spiral Rose Center (Tightly curled bud with layered round petal swirls) */}
    <path
      d="M10.2 5.5c.4-.9 1.2-1.4 2.1-1.3 1 .1 1.8.8 1.9 1.8-.5-.4-1.2-.6-1.9-.5-.8.1-1.5.7-1.7 1.5-.2-.5-.3-1-.4-1.5z"
      fill="#e11d48"
    />

    {/* Rosebud core highlight curl */}
    <path
      d="M11 4.9c.3-.5.8-.8 1.3-.8.6 0 1.1.4 1.2 1-.3-.2-.7-.3-1.1-.3-.5 0-.9.2-1.2.6-.1-.2-.2-.3-.2-.5z"
      fill="#fecdd3"
    />

    {/* Delicate petal rim highlights */}
    <path
      d="M8.2 6.8c.8-.8 1.8-1 2.8-.7"
      stroke="#ffe4e6"
      strokeWidth="0.6"
      strokeLinecap="round"
      opacity="0.9"
    />
    <path
      d="M15.8 6.8c-.8-.8-1.8-1-2.8-.7"
      stroke="#fff1f2"
      strokeWidth="0.6"
      strokeLinecap="round"
      opacity="0.9"
    />
    <path
      d="M9.8 10.2c1.4.9 2.8.9 4.4 0"
      stroke="#fda4af"
      strokeWidth="0.6"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

// 8. Authentic TikTok LIVE Gift Box Icon (Noticeably larger prominent lid with puffy ribbon bow)
export const GiftBoxIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`}>
    {/* Box Body */}
    <rect x="4.5" y="10" width="15" height="11" rx="1.5" fill="#fe2c55" />
    {/* Box Body Ribbon - Vertical */}
    <rect x="10.8" y="10" width="2.4" height="11" fill="#ffffff" opacity="0.95" />
    {/* Box Body Ribbon - Horizontal */}
    <rect x="4.5" y="14.5" width="15" height="2" fill="#ffffff" opacity="0.95" />
    {/* Prominent Larger Box Lid (wider and taller than box body) */}
    <rect x="3" y="6.5" width="18" height="4.2" rx="1.8" fill="#ff3366" />
    <rect x="10.5" y="6.5" width="3" height="4.2" fill="#ffffff" opacity="0.95" />
    {/* Top Ribbon Bow Loops */}
    <path d="M8.5 6.5c-2-2.5-3.5-.8-1.5 1.5 1.2 1.2 3.5.5 3.5.5s-.8-2-2-2z" fill="#ffffff" />
    <path d="M15.5 6.5c2-2.5 3.5-.8 1.5 1.5-1.2 1.2-3.5.5-3.5.5s.8-2 2-2z" fill="#ffffff" />
    <circle cx="12" cy="6.5" r="1.2" fill="#ffebee" />
  </svg>
);

// 9. Authentic TikTok LIVE Curved Share Arrow Icon (Fluid curved arrow)
export const ShareArrowIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="currentColor">
    <path d="M14.6 3.2a1 1 0 0 0-1.6.8v3.2C7.3 7.8 3.5 11.5 2.2 17.5a1 1 0 0 0 1.7.9c2.5-2.2 5.5-3.4 9.1-3.4v3.2a1 1 0 0 0 1.6.8l7.5-6.5a1 1 0 0 0 0-1.6l-7.5-6.7z" />
  </svg>
);

// 10. Authentic TikTok Shop Yellow Shopping Bag Icon (Keranjang Kuning - Kotak Tumpul / Squircle)
export const YellowShoppingBagIcon: React.FC<{ className?: string }> = ({ className = 'w-7.5 h-7.5' }) => (
  <svg viewBox="0 0 28 28" className={`shrink-0 ${className}`} fill="none">
    <defs>
      <linearGradient id="yellowCartBagSqGrad" x1="14" y1="6" x2="14" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffb300" />
        <stop offset="0.6" stopColor="#ffa000" />
        <stop offset="1" stopColor="#f57c00" />
      </linearGradient>
      <linearGradient id="yellowHandleSqGrad" x1="14" y1="1" x2="14" y2="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Dual Arched Handles looping over top */}
    <path
      d="M9.5 7V4.2c0-1.8 1.4-3.2 3.2-3.2h2.6c1.8 0 3.2 1.4 3.2 3.2V7"
      stroke="url(#yellowHandleSqGrad)"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M10.5 7V4.5c0-1.2 1-2.2 2.2-2.2h2.6c1.2 0 2.2 1 2.2 2.2V7"
      stroke="#fef08a"
      strokeWidth="1"
      strokeLinecap="round"
      opacity="0.85"
    />
    {/* Main Square Body with Rounded Corners (Kotak Tumpul) */}
    <rect
      x="3.2"
      y="6.8"
      width="21.6"
      height="19.4"
      rx="5.2"
      fill="url(#yellowCartBagSqGrad)"
    />
    {/* Top Rim Collar Fold - perfectly fitted inside the rounded squircle top rim */}
    <path
      d="M3.6 10.6C4.4 8.5 6.2 7 8.4 7h11.2c2.2 0 4 1.5 4.8 3.6H3.6z"
      fill="#ffffff"
      fillOpacity="0.32"
    />
    {/* Subtle bag center emblem */}
    <rect
      x="11.5"
      y="13"
      width="5"
      height="4"
      rx="1.2"
      fill="#ffffff"
      fillOpacity="0.25"
    />
  </svg>
);
