import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, RefreshCw, WifiOff, AlertCircle, LogOut } from 'lucide-react';

export type AuthLifecycleStage =
  | 'AUTH_LOADING'
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED'
  | 'CHECK_ACCESS'
  | 'LOAD_USER_DATA'
  | 'HYDRATE_DATA'
  | 'READY'
  | 'ACCESS_EXPIRED'
  | 'AUTH_ERROR';

interface AppLoadingScreenProps {
  stage: AuthLifecycleStage;
  language?: 'en' | 'id';
  errorMessage?: string | null;
  onRetry?: () => void;
  onBackToLogin?: () => void;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  stage,
  language = 'id',
  errorMessage,
  onRetry,
  onBackToLogin,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getStageInfo = () => {
    switch (stage) {
      case 'AUTH_LOADING':
        return {
          title: language === 'id' ? 'Memeriksa Akun...' : 'Checking Account...',
          desc: language === 'id' ? 'Memverifikasi status login Anda secara aman.' : 'Verifying your login session securely.',
          progress: 25,
        };
      case 'CHECK_ACCESS':
        return {
          title: language === 'id' ? 'Memverifikasi Hak Akses...' : 'Verifying Access...',
          desc: language === 'id' ? 'Memastikan masa aktif akun Anda valid.' : 'Checking your subscription and entitlement.',
          progress: 50,
        };
      case 'LOAD_USER_DATA':
        return {
          title: language === 'id' ? 'Memuat Workspace Anda...' : 'Loading Your Workspace...',
          desc: language === 'id' ? 'Mengambil data folder dan pengaturan Anda dari cloud.' : 'Fetching your folders and settings from the cloud.',
          progress: 75,
        };
      case 'HYDRATE_DATA':
        return {
          title: language === 'id' ? 'Menyinkronkan Data...' : 'Syncing Your Data...',
          desc: language === 'id' ? 'Menyiapkan editor dan tampilan data Anda.' : 'Preparing the editor and formatting your state.',
          progress: 90,
        };
      default:
        return {
          title: language === 'id' ? 'Memuat AU Toolkit...' : 'Loading AU Toolkit...',
          desc: language === 'id' ? 'Mohon tunggu sebentar...' : 'Please wait a moment...',
          progress: 40,
        };
    }
  };

  const info = getStageInfo();
  const isSlow = elapsedSeconds >= 7 || Boolean(errorMessage);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-900 text-white select-none">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-fadeIn">
        {/* Animated Brand Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/20">
            <Sparkles className="w-10 h-10 text-purple-400 fill-purple-400/20 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-purple-500/40">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
            {info.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs">
            {info.desc}
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="w-full p-3.5 bg-rose-950/70 border border-rose-600/40 rounded-2xl text-rose-200 text-xs text-left font-medium leading-relaxed flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${info.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>{language === 'id' ? 'Sinkronisasi' : 'Syncing'}</span>
            <span>{info.progress}%</span>
          </div>
        </div>

        {/* Slow Network / Timeout Safeguard Fallback Options */}
        {isSlow && (
          <div className="w-full pt-4 space-y-3 border-t border-slate-800 animate-fadeIn">
            {!errorMessage && (
              <div className="flex items-center justify-center gap-2 text-xs text-amber-300/90 font-medium">
                <WifiOff className="w-4 h-4 shrink-0" />
                <span>
                  {language === 'id'
                    ? 'Koneksi lambat. Mohon tunggu atau coba lagi.'
                    : 'Connection is taking longer than expected.'}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Coba Lagi' : 'Retry'}</span>
                </button>
              )}

              {onBackToLogin && (
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'id' ? 'Halaman Login' : 'Back to Login'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
