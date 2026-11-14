import React, { useState } from 'react';

export type CloudConnectionState =
  | 'synced'
  | 'syncing'
  | 'offline'
  | 'error'
  | 'connecting'
  | 'signed_out';

interface CloudSyncIndicatorProps {
  state: CloudConnectionState;
  lastSyncedTime: Date | null;
  isOpen: boolean;
  onClick: () => void;
  uiTheme: 'light' | 'dark';
  language: 'id' | 'en';
}

export const CloudSyncIndicator: React.FC<CloudSyncIndicatorProps> = ({
  state,
  lastSyncedTime,
  isOpen,
  onClick,
  uiTheme,
  language,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formattedTime = lastSyncedTime
    ? lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  // Derive localized status label and tooltip
  let statusText = 'Connected & Synced';
  let ariaLabel = 'Cloud status: Connected and synchronized';
  let dotBg = 'bg-[#22c55e]';
  let containerBg = uiTheme === 'dark'
    ? 'bg-emerald-950/30 border-emerald-800/50 hover:bg-emerald-900/40 text-emerald-400'
    : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70 text-emerald-700';

  if (state === 'syncing') {
    statusText = language === 'id' ? 'Sedang menyimpan...' : 'Syncing...';
    ariaLabel = 'Cloud status: Syncing data to cloud';
    dotBg = 'bg-[#22c55e]';
    containerBg = uiTheme === 'dark'
      ? 'bg-emerald-950/40 border-emerald-700/60 hover:bg-emerald-900/50 text-emerald-300'
      : 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 text-emerald-700';
  } else if (state === 'offline') {
    statusText = language === 'id' ? 'Mode Offline' : 'Offline';
    ariaLabel = 'Cloud status: Offline mode';
    dotBg = 'bg-slate-400';
    containerBg = uiTheme === 'dark'
      ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800/80 text-slate-300'
      : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-700';
  } else if (state === 'error') {
    statusText = language === 'id' ? 'Gagal Sinkronisasi' : 'Sync Error';
    ariaLabel = 'Cloud status: Synchronization error';
    dotBg = 'bg-red-500';
    containerBg = uiTheme === 'dark'
      ? 'bg-rose-950/40 border-rose-800/60 hover:bg-rose-900/50 text-rose-300'
      : 'bg-rose-50 border-rose-300 hover:bg-rose-100 text-rose-700';
  } else if (state === 'connecting') {
    statusText = language === 'id' ? 'Menghubungkan...' : 'Connecting...';
    ariaLabel = 'Cloud status: Connecting to cloud';
    dotBg = 'bg-sky-400';
    containerBg = uiTheme === 'dark'
      ? 'bg-sky-950/30 border-sky-800/50 hover:bg-sky-900/40 text-sky-300'
      : 'bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-700';
  } else if (state === 'signed_out') {
    statusText = language === 'id' ? 'Belum Masuk Akun' : 'Signed Out';
    ariaLabel = 'Cloud status: Signed out';
    dotBg = 'bg-slate-400';
    containerBg = uiTheme === 'dark'
      ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
      : 'bg-slate-100 border-slate-200 hover:bg-slate-200/70 text-slate-600';
  } else {
    // Synced / Connected state
    statusText = language === 'id'
      ? `Tersimpan & Terhubung${formattedTime ? ` (${formattedTime})` : ''}`
      : `Connected & Synced${formattedTime ? ` (${formattedTime})` : ''}`;
    ariaLabel = `Cloud status: Connected and synchronized${formattedTime ? `, last saved at ${formattedTime}` : ''}`;
  }

  return (
    <div
      className="relative flex items-center shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        type="button"
        id="cloud-sync-status-indicator"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={onClick}
        className={`h-8 w-8 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer shadow-xs shrink-0 select-none ${containerBg} ${
          isOpen
            ? (uiTheme === 'dark'
                ? 'ring-2 ring-purple-500/50 border-purple-500'
                : 'ring-2 ring-purple-400/40 border-purple-400')
            : ''
        }`}
      >
        <span className="relative flex h-3 w-3 items-center justify-center">
          {/* Subtle Glow / Ping for active sync or connected state */}
          {state === 'syncing' ? (
            <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-60 animate-ping" />
          ) : state === 'synced' ? (
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400/30 opacity-70" />
          ) : state === 'connecting' ? (
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-sky-400/30 opacity-70 animate-pulse" />
          ) : null}

          {/* Primary Circular Status Indicator */}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotBg} transition-colors duration-300 ${
              state === 'syncing' ? 'animate-pulse' : ''
            }`}
            style={state === 'synced' || state === 'syncing' ? { boxShadow: '0 0 7px rgba(34, 197, 94, 0.55)' } : undefined}
          />
        </span>
      </button>

      {/* Accessible Desktop Tooltip */}
      {isHovered && (
        <div
          role="tooltip"
          id="cloud-sync-tooltip"
          className="absolute right-0 top-full mt-2 hidden sm:flex items-center gap-1.5 whitespace-nowrap z-50 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-lg pointer-events-none transition-all duration-150 border bg-slate-900 text-slate-100 border-slate-700 dark:bg-slate-800 dark:border-slate-600"
        >
          <span className={`w-2 h-2 rounded-full ${dotBg} shrink-0`} />
          <span>{statusText}</span>
        </div>
      )}
    </div>
  );
};
