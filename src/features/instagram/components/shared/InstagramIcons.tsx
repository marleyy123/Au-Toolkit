import React from 'react';

export const InstagramVerifiedBadge: React.FC<{ className?: string }> = ({ className = "w-[14px] h-[14px]" }) => (
  <svg aria-label="Terverifikasi" height="14" width="14" viewBox="0 0 40 40" className={`shrink-0 ${className}`}>
    <path fill="#0095F6" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Z" />
    <path fill="#ffffff" d="M17.413 26.685 10.578 19.755l2.244-2.258 4.587 4.581 9.18-9.18 2.254 2.287-11.43 11.5Z" />
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
