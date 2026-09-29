import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export type SyncState = 'synced' | 'saving' | 'offline' | 'error' | 'connecting';

interface SyncStatusBadgeProps {
  state: SyncState;
  lastSyncedAt?: Date | null;
  onRetry?: () => void;
  language?: 'en' | 'id';
  isDark?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  state,
  lastSyncedAt,
  onRetry,
  language = 'id',
  isDark = true,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Dynamic status visual styling and tooltip text
  const getStatusDetails = () => {
    switch (state) {
      case 'synced':
        return {
          dotClass: 'bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.6)]',
          title: language === 'id' ? 'Tersimpan & Terhubung' : 'Connected & Synced',
          subtitle: lastSyncedAt
            ? `${language === 'id' ? 'Terakhir disimpan jam' : 'Last saved at'} ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : undefined,
          ariaLabel: 'Connected and synchronized',
        };
      case 'saving':
        return {
          // Subtle pulse animation as requested
          dotClass: 'bg-[#22c55e] animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.7)]',
          title: language === 'id' ? 'Menyimpan...' : 'Syncing...',
          subtitle: language === 'id' ? 'Menyinkronkan ke cloud' : 'Syncing changes to cloud',
          ariaLabel: 'Syncing to cloud',
        };
      case 'offline':
        return {
          dotClass: 'bg-slate-400 dark:bg-slate-500 shadow-none',
          title: language === 'id' ? 'Offline' : 'Offline',
          subtitle: language === 'id' ? 'Tersimpan aman di browser' : 'Saved locally in browser',
          ariaLabel: 'Offline mode',
        };
      case 'error':
        return {
          dotClass: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]',
          title: language === 'id' ? 'Gagal Sinkronisasi' : 'Sync Error',
          subtitle: onRetry
            ? (language === 'id' ? 'Klik untuk mencoba lagi' : 'Click to retry synchronization')
            : undefined,
          ariaLabel: 'Synchronization error',
        };
      case 'connecting':
      default:
        return {
          dotClass: 'bg-[#22c55e] opacity-80 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.4)]',
          title: language === 'id' ? 'Menghubungkan...' : 'Connecting...',
          subtitle: undefined,
          ariaLabel: 'Connecting to service',
        };
    }
  };

  const status = getStatusDetails();

  const handleClick = (e: React.MouseEvent) => {
    if (state === 'error' && onRetry) {
      e.stopPropagation();
      onRetry();
    } else {
      setShowTooltip((prev) => !prev);
    }
  };

  return (
    <div
      className="relative flex items-center shrink-0"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      {/* Minimalist dot indicator button */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={status.ariaLabel}
        className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full hover:bg-slate-500/15 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-hidden"
        title={status.subtitle ? `${status.title} (${status.subtitle})` : status.title}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${status.dotClass}`}
          role="status"
        />
      </button>

      {/* Floating Tooltip - only shows on hover or tap, does NOT shift header layout */}
      {showTooltip && (
        <div
          role="tooltip"
          className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-xl border select-none pointer-events-none animate-fadeIn ${
            isDark
              ? 'bg-slate-900/95 text-slate-100 border-slate-700/80 shadow-black/40'
              : 'bg-white/95 text-slate-800 border-slate-200 shadow-slate-300/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${status.dotClass}`} />
            <div className="flex flex-col text-left">
              <span className="font-semibold leading-tight">{status.title}</span>
              {status.subtitle && (
                <span className="text-[10px] opacity-75 leading-tight mt-0.5">
                  {status.subtitle}
                </span>
              )}
            </div>
            {state === 'error' && onRetry && (
              <RefreshCw className="w-3 h-3 text-red-400 shrink-0 ml-1 animate-spin" />
            )}
          </div>
          {/* Subtle arrow pointing to dot */}
          <div
            className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 border-t border-l ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          />
        </div>
      )}
    </div>
  );
};

