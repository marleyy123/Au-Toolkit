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
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="miter" className={className}>
    <path d="M10 17.5C5.5 17.5 2.5 14.6 2.5 10.5C2.5 6.4 5.5 3.5 9.5 3.5H14.5C18.5 3.5 21.5 6.4 21.5 10.5C21.5 14.6 18.5 17.5 14.4 17.5L10 21Z" />
  </svg>
);

export const TwitterRetweetIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <path d="m2 9 3-3 3 3" />
    <path d="M13 18H7a2 2 0 0 1-2-2V6" />
    <path d="m22 15-3 3-3-3" />
    <path d="M11 6h6a2 2 0 0 1 2 2v10" />
  </svg>
);

export const TwitterHeartIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? "1.1" : "1.75"} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 20.36C5.97 15.7 2.41 12.41 2.41 8.03C2.41 5.01 4.6 3.37 7.34 3.37C9.53 3.37 11.18 4.46 12 6.11C12.82 4.46 14.47 3.37 16.66 3.37C19.4 3.37 21.86 5.01 21.86 8.03C21.86 12.41 18.03 15.7 12 20.36Z" />
  </svg>
);

export const TwitterBookmarkIcon: React.FC<{ filled?: boolean; className?: string }> = ({ filled = false, className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinecap="butt" strokeLinejoin="miter" className={className}>
    <path d="M5.25 3.36H18.75V20.64L12 14.7L5.25 20.64Z" />
  </svg>
);

export const TwitterShareIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3v12" />
    <path d="m17 8-5-5-5 5" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  </svg>
);