import React from 'react';
import { ShieldAlert, Lock, Calendar, Mail, ExternalLink, LogOut, CheckCircle2, Smartphone, Laptop } from 'lucide-react';
import { EntitlementCheckResult } from '../../../services/buyerEntitlementService';

interface AccessGuardProps {
  email: string;
  purchaseDate?: string;
  accessExpiresAt?: string;
  expirationDate?: string | null;
  statusAccount?: 'Active' | 'Expired' | 'Inactive';
  daysRemaining?: number | null;
  status?: EntitlementCheckResult['status'];
  customMessage?: string;
  onLogout: () => void;
  language?: 'en' | 'id';
}

export const AccessGuard: React.FC<AccessGuardProps> = ({
  email,
  purchaseDate,
  accessExpiresAt,
  expirationDate,
  statusAccount,
  daysRemaining,
  status = 'EXPIRED',
  customMessage,
  onLogout,
  language = 'id',
}) => {
  const displayExpiry = expirationDate || accessExpiresAt;
  const isDeviceMismatch = status === 'DEVICE_MISMATCH';
  const isOrderNotSuccess = status === 'ORDER_NOT_SUCCESS';
  const isInactive = statusAccount === 'Inactive';
  const isExpired = status === 'EXPIRED' || statusAccount === 'Expired';
  const displayStatus = statusAccount || (status === 'EXPIRED'
    ? 'Expired'
    : status === 'INACTIVE'
    ? 'Inactive'
    : (language === 'id' ? 'Belum terverifikasi' : 'Not verified'));

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100 animate-fadeIn">
        {/* Top Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800 shadow-xs">
            {isDeviceMismatch || isOrderNotSuccess ? (
              <ShieldAlert className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            ) : (
              <Lock className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {isDeviceMismatch
                ? (language === 'id' ? 'Perangkat ini tidak terdaftar untuk akun Anda.' : 'This device is not registered for your account.')
                : isOrderNotSuccess
                ? (language === 'id' ? 'Status Pesanan Lynk.id Belum Sukses' : 'Lynk.id Order Not Successful')
                : isInactive
                ? (language === 'id' ? 'Status Akun Tidak Aktif' : 'Account Status Inactive')
                : isExpired
                ? (language === 'id' ? 'Masa berlangganan AU Toolkit Anda telah habis.' : 'Your AU Toolkit subscription has expired.')
                : (language === 'id' ? 'Akses akun belum dapat diverifikasi.' : 'Account access could not be verified.')}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {customMessage || (
                isDeviceMismatch
                  ? (language === 'id'
                      ? 'Perangkat ini tidak terdaftar untuk akun Anda. Slot perangkat Anda telah terisi.'
                      : 'This device is not registered for your account.')
                  : isOrderNotSuccess
                  ? (language === 'id'
                      ? 'Pesanan Lynk.id Anda belum berstatus SUCCESS. Akses hanya diberikan setelah pembayaran diverifikasi sukses.'
                      : 'Your Lynk.id order has not reached SUCCESS status.')
                  : isInactive
                  ? (language === 'id'
                      ? 'Status akun Anda saat ini Inactive. Silakan hubungi administrator.'
                      : 'Your account status is currently Inactive. Please contact administrator.')
                  : isExpired
                  ? (language === 'id'
                      ? 'Masa berlangganan AU Toolkit Anda telah habis. Silakan perpanjang akses untuk melanjutkan.'
                      : 'Your AU Toolkit subscription period has expired.')
                  : (language === 'id' ? 'Data akses akun belum dapat diverifikasi. Silakan hubungi administrator.' : 'Account access could not be verified. Please contact the administrator.')
              )}
            </p>
          </div>
        </div>

        {/* Data Security Guarantee Notice */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-300 font-medium">
            <span className="font-bold block mb-0.5">
              {language === 'id' ? 'Data Tersimpan Anda Tetap Aman' : 'Your Saved Data Is Completely Safe'}
            </span>
            {language === 'id'
              ? 'Seluruh folder, pesan, foto, dan pengaturan Anda tetap tersimpan utuh di cloud. Tidak ada data yang dihapus.'
              : 'All your folders, messages, media, and settings remain securely preserved in the cloud. Nothing is deleted.'}
          </div>
        </div>

        {/* Account Details Box */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {language === 'id' ? 'Email Akun:' : 'Account Email:'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]" title={email}>
              {email}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              {language === 'id' ? 'Status Akun:' : 'Account Status:'}
            </span>
            <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
              statusAccount === 'Active'
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300'
            }`}>
              {displayStatus}
            </span>
          </div>

          {purchaseDate && (
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {language === 'id' ? 'Tanggal Pembelian:' : 'Purchase Date:'}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(purchaseDate)}</span>
            </div>
          )}

          {displayExpiry && (
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                {language === 'id' ? 'Expiration Date:' : 'Expiration Date:'}
              </span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{formatDate(displayExpiry)}</span>
            </div>
          )}

          {daysRemaining !== undefined && daysRemaining !== null && (
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {language === 'id' ? 'Sisa Hari:' : 'Days Remaining:'}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{daysRemaining} hari</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {!isDeviceMismatch && isExpired && (
            <a
              href="https://wa.me"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{language === 'id' ? 'Perpanjang Akses Sekarang' : 'Renew Access Now'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>{language === 'id' ? 'Ganti Akun / Keluar' : 'Switch Account / Log Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
