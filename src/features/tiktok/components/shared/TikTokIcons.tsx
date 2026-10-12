import React from 'react';

export const TikTokVerifiedBadge: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" aria-label="TikTok Verified" className={`shrink-0 inline-block align-middle ${className}`}>
    <circle cx="12" cy="12" r="11" fill="#20D5EC" />
    <path fill="#ffffff" d="M10.2 16.2L5.8 11.8l1.4-1.4 3 3 6.6-6.6 1.4 1.4z" />
  </svg>
);
