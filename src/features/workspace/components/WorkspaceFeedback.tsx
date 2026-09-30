import React from 'react';
import { AlertTriangle, Check, Cloud, RefreshCw, Trash2, X } from 'lucide-react';
import { UiTheme } from '../../../context/ThemeContext';

type Language = 'id' | 'en';

export interface CloudToastState {
  show: boolean;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface WorkspaceFeedbackProps {
  uiTheme: UiTheme;
  language: Language;
  isResetConfirmOpen: boolean;
  isResetting: boolean;
  resetSuccessToast: boolean;
  cloudToast: CloudToastState;
  onCloseResetConfirm: () => void;
  onConfirmReset: () => void;
  onDismissCloudToast: () => void;
}

export const WorkspaceFeedback: React.FC<WorkspaceFeedbackProps> = ({
  uiTheme,
  language,
  isResetConfirmOpen,
  isResetting,
  resetSuccessToast,
  cloudToast,
  onCloseResetConfirm,
  onConfirmReset,
  onDismissCloudToast,
}) => (
  <>
    {isResetConfirmOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
          uiTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                {language === 'id' ? 'Konfirmasi Reset Total (Hard Reset)' : 'Confirm Hard Reset'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'id' ? 'Kembalikan aplikasi ke kondisi bersih awal' : 'Restore application to clean default state'}
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-5">
            {language === 'id' ? (
              <>
                Tindakan ini akan <strong>mengosongkan seluruh form input dan mereset folder ke Folder 1 bersih</strong> di seluruh modul (X/Twitter, seluruh fitur Instagram, WhatsApp, TikTok, LINE, Notes, dan Notification). Sesi login dan akun Anda tetap aman tanpa logout.
              </>
            ) : (
              <>
                This action will <strong>clear all form inputs and reset folders to clean Folder 1</strong> across all modules (X/Twitter, Instagram, WhatsApp, TikTok, LINE, Notes, and Notification). Your login session and account remain safe without logging out.
              </>
            )}
          </p>

          <div className="flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onCloseResetConfirm}
              disabled={isResetting}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                uiTheme === 'dark'
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirmReset}
              disabled={isResetting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === 'id' ? 'Mereset...' : 'Resetting...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Hapus & Reset Sekarang' : 'Erase & Reset Now'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {resetSuccessToast && (
      <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-purple-600 text-white shadow-xl text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
        <Check className="w-4 h-4 text-white" />
        <span>Hard Reset successful! All cached data and templates have been cleared.</span>
      </div>
    )}

    {cloudToast.show && (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 bg-slate-900/95 text-white border-slate-700">
        <Cloud className={`w-4 h-4 shrink-0 ${
          cloudToast.type === 'error' ? 'text-rose-400' : cloudToast.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'
        }`} />
        <span className="flex-1 leading-snug">{cloudToast.message}</span>
        <button
          type="button"
          onClick={onDismissCloudToast}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )}
  </>
);
