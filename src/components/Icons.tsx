import React from 'react';

export const VerifiedBadgeBlue: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" aria-label="Verified account" className={`shrink-0 ${className}`}>
    <path fill="#1d9bf0" d="M22.25 12c0-1.43-.88-2.67-2.19-3.19.46-1.39.02-2.93-1.09-3.99-1.07-1.07-2.61-1.51-4-1.06C14.45 2.45 13.22 1.5 11.79 1.5s-2.67.95-3.18 2.26c-1.39-.45-2.93-.01-4 1.06-1.11 1.06-1.55 2.6-1.09 3.99C2.21 9.33 1.33 10.57 1.33 12c0 1.43.88 2.67 2.19 3.19-.46 1.39-.02 2.93 1.09 3.99 1.07 1.07 2.61 1.51 4 1.06 1.02 1.31 2.25 2.26 3.68 2.26s2.66-.95 3.18-2.26c1.39.45 2.93.01 4-1.06 1.11-1.06 1.55-2.6 1.09-3.99 1.31-.52 2.19-1.76 2.19-3.19z" />
    <path fill="#ffffff" d="M10.45 15.65l-3.35-3.35 1.41-1.41 1.94 1.94 5.37-5.37 1.41 1.41-6.78 6.78z" />
  </svg>
);

export const VerifiedBadgeGold: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" aria-label="Verified organization" className={`shrink-0 ${className}`}>
    <path fill="#eab308" d="M20.38 8.57l-1.22-2.03-2.31-.55-.83-2.22-2.35.34-1.67-1.67-1.67 1.67-2.35-.34-.83 2.22-2.31.55-1.22 2.03 1.02 2.13-1.02 2.13 1.22 2.03 2.31.55.83 2.22 2.35-.34 1.67 1.67 1.67-1.67 2.35.34.83-2.22 2.31-.55 1.22-2.03-1.02-2.13 1.02-2.13z" />
    <path fill="#ffffff" d="M10.54 14.25l-3.29-3.29 1.41-1.41 1.88 1.88 5.29-5.29 1.41 1.41-6.7 6.7z" />
  </svg>
);

export const VerifiedBadgeGray: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" aria-label="Verified government or official" className={`shrink-0 ${className}`}>
    <path fill="#829aab" d="M22.25 12c0-1.43-.88-2.67-2.19-3.19.46-1.39.02-2.93-1.09-3.99-1.07-1.07-2.61-1.51-4-1.06C14.45 2.45 13.22 1.5 11.79 1.5s-2.67.95-3.18 2.26c-1.39-.45-2.93-.01-4 1.06-1.11 1.06-1.55 2.6-1.09 3.99C2.21 9.33 1.33 10.57 1.33 12c0 1.43.88 2.67 2.19 3.19-.46 1.39-.02 2.93 1.09 3.99 1.07 1.07 2.61 1.51 4 1.06 1.02 1.31 2.25 2.26 3.68 2.26s2.66-.95 3.18-2.26c1.39.45 2.93.01 4-1.06 1.11-1.06 1.55-2.6 1.09-3.99 1.31-.52 2.19-1.76 2.19-3.19z" />
    <path fill="#ffffff" d="M10.45 15.65l-3.35-3.35 1.41-1.41 1.94 1.94 5.37-5.37 1.41 1.41-6.78 6.78z" />
  </svg>
);

export const InstagramVerifiedBadge: React.FC<{ className?: string }> = ({ className = "w-[14px] h-[14px]" }) => (
  <svg aria-label="Terverifikasi" height="14" width="14" viewBox="0 0 40 40" className={`shrink-0 ${className}`}>
    <path fill="#0095F6" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Z" />
    <path fill="#ffffff" d="M17.413 26.685 10.578 19.755l2.244-2.258 4.587 4.581 9.18-9.18 2.254 2.287-11.43 11.5Z" />
  </svg>
);

export const TikTokVerifiedBadge: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" aria-label="TikTok Verified" className={`shrink-0 inline-block align-middle ${className}`}>
    <circle cx="12" cy="12" r="11" fill="#20D5EC" />
    <path fill="#ffffff" d="M10.2 16.2L5.8 11.8l1.4-1.4 3 3 6.6-6.6 1.4 1.4z" />
  </svg>
);

export const XLogo: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-current ${className}`}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const TwitterLockIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    clipRule="evenodd"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path d="M19.5 9.5H17.5V7C17.5 3.96 15.04 1.5 12 1.5C8.96 1.5 6.5 3.96 6.5 7V9.5H4.5C3.4 9.5 2.5 10.4 2.5 11.5V19.5C2.5 20.6 3.4 21.5 4.5 21.5H19.5C20.6 21.5 21.5 20.6 21.5 19.5V11.5C21.5 10.4 20.6 9.5 19.5 9.5ZM9 9.5V7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V9.5H9ZM12 12.5C10.9 12.5 10 13.4 10 14.5C10 15.28 10.44 15.95 11.08 16.28L10.8 18.1C10.72 18.6 11.1 19 11.6 19H12.4C12.9 19 13.28 18.6 13.2 18.1L12.92 16.28C13.56 15.95 14 15.28 14 14.5C14 13.4 13.1 12.5 12 12.5Z" />
  </svg>
);

export const TwitterReplyIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3.75c-4.97 0-9 3.694-9 8.25 0 2.16.98 4.12 2.58 5.53L4.25 20.25l3.62-1.08C9.28 19.66 10.6 20 12 20c4.97 0 9-3.694 9-8.25S16.97 3.75 12 3.75z" />
  </svg>
);

export const TwitterRetweetIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <polyline points="3.5 6.5 6 4 8.5 6.5" />
    <path d="M6 4v13a3 3 0 0 0 3 3h4.5" />
    <polyline points="15.5 17.5 18 20 20.5 17.5" />
    <path d="M18 20V7a3 3 0 0 0-3-3h-4.5" />
  </svg>
);

export const TwitterHeartIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={filled ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const TwitterBookmarkIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={filled ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3.75h12v16.5l-6-4.25-6 4.25V3.75z" />
  </svg>
);

export const TwitterShareIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 13.5v4A2 2 0 0 0 6.5 19.5h11a2 2 0 0 0 2-2v-4" />
    <path d="M12 15V4.5" />
    <path d="M7.5 8.5L12 4l4.5 4.5" />
  </svg>
);

export const TwitterViewsIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`fill-current ${className}`}>
    <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21v-5.5h2V21H4zM13.25 21V11h2v10h-2z" />
  </svg>
);

export const InstagramHeartIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={filled ? "0" : "2"} strokeLinecap="round" strokeLinejoin="round" className={`${filled ? 'text-[#ed4956]' : ''} ${className}`}>
    <path d="M16.792 3.904A4.989 4.989 0 0121.5 9.122c0 3.072-2.652 4.956-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.438-.283-1.791-1.509-4.303-3.752C5.152 14.078 2.5 12.194 2.5 9.122a4.989 4.989 0 014.708-5.218 4.21 4.21 0 013.675 1.941c.84 1.175.98 1.763 1.117 1.763s.278-.588 1.117-1.763a4.21 4.21 0 013.675-1.941z" />
  </svg>
);

export const InstagramCommentIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.656 17.008a9.993 9.993 0 10-3.59 3.615l4.133 1.126z" />
  </svg>
);

export const InstagramSendIcon: React.FC<{ className?: string; strokeWidth?: number }> = ({ className = "w-6 h-6", strokeWidth = 2 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="3" x2="9.218" y2="10.083" />
    <polygon points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" />
  </svg>
);

export const InstagramRepostIcon: React.FC<{
  className?: string;
  strokeWidth?: number | string;
  size?: number;
}> = ({
  className = "w-[23px] h-[23px]",
  size = 23,
  strokeWidth = 2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M 5.2 11.8 V 8.8 C 5.2 6.9 6.8 5.5 8.8 5.5 H 16.5 M 12.8 1.8 L 17.5 5.5 L 12.8 9.5"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M 18.8 12.2 V 15.2 C 18.8 17.1 17.2 18.5 15.2 18.5 H 7.5 M 11.2 22.2 L 6.5 18.5 L 11.2 14.5"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const InstagramGlossyRepostBadge: React.FC<{ className?: string }> = ({
  className = "w-[18px] h-[18px]",
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <radialGradient
        id="repostGlossyGrad"
        cx="36%"
        cy="28%"
        r="70%"
        fx="32%"
        fy="24%"
      >
        <stop offset="0%" stopColor="#C79BFF" />
        <stop offset="25%" stopColor="#A25BFF" />
        <stop offset="65%" stopColor="#8B45FB" />
        <stop offset="100%" stopColor="#6F19FA" />
      </radialGradient>
      <radialGradient id="repostSpecular" cx="34%" cy="22%" r="38%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
        <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="repostRimGlow" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
        <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
        <stop offset="85%" stopColor="#7E22CE" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="49" fill="url(#repostGlossyGrad)" />
    <circle cx="50" cy="50" r="49" fill="url(#repostRimGlow)" />
    <circle cx="50" cy="50" r="49" fill="url(#repostSpecular)" />
    <g
      transform="translate(50, 50) scale(0.78) translate(-50, -50)"
      stroke="#FDFDFD"
      strokeWidth="8.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M 29 48 L 29 41 C 29 33 35 28 44 28 H 64" />
      <path d="M 55 19 L 68 28 L 55 37" />
      <path d="M 71 52 L 71 59 C 71 67 65 72 56 72 H 36" />
      <path d="M 45 63 L 32 72 L 45 81" />
    </g>
  </svg>
);

export const InstagramBookmarkIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" className={`${filled ? 'fill-current' : 'fill-none stroke-current stroke-2'} ${className}`}>
    <polygon points="20 21 12 13.44 4 21 4 3 20 3 20 21" strokeLinejoin="round" />
  </svg>
);

export const LiveOptionsIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="1.25" fill="currentColor" />
    <circle cx="19" cy="12" r="1.25" fill="currentColor" />
    <circle cx="5" cy="12" r="1.25" fill="currentColor" />
  </svg>
);

export const LiveQuestionIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const LiveEyeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const PhoneStatusBar: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'light' }) => (
  <div className={`w-full flex items-center justify-between px-6 pt-3 pb-2 text-xs font-semibold select-none ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
    <span>9:41</span>
    <div className="flex items-center space-x-2">
      {/* Cellular */}
      <svg className="w-4 h-3 fill-current" viewBox="0 0 17 11">
        <rect x="0" y="7" width="3" height="4" rx="0.5" />
        <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
        <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
        <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
      </svg>
      {/* Wifi */}
      <svg className="w-4 h-3 fill-current" viewBox="0 0 16 12">
        <path d="M8 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-3.5-3.5a5 5 0 017 0l1.4-1.4a7 7 0 00-9.8 0l1.4 1.4zm-3-3a9 9 0 0113 0l1.4-1.4a11 11 0 00-15.8 0l1.4 1.4z" />
      </svg>
      {/* Battery */}
      <div className="w-6 h-3 border border-current rounded-sm p-[1px] relative flex items-center">
        <div className="h-full w-4/5 bg-current rounded-2xs" />
        <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] bg-current rounded-r-xs" />
      </div>
    </div>
  </div>
);
