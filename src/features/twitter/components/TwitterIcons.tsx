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
