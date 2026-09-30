import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Mail, X } from 'lucide-react';
import { updateCurrentUserPassword } from '../../../firebase';

interface Props {
  isOpen: boolean;
  email: string;
  uiTheme: 'light' | 'dark';
  onClose: () => void;
  onRequireRecentLogin: () => void | Promise<void>;
}

const getPasswordErrorMessage = (error: unknown): { message: string; requiresRecentLogin: boolean } => {
  const code = String((error as { code?: string })?.code || '').trim();
  if (code === 'auth/requires-recent-login') {
    return {
      message: 'Demi keamanan, silakan login ulang sebelum mengubah password.',
      requiresRecentLogin: true,
    };
  }
  if (code === 'auth/weak-password') {
    return { message: 'Password terlalu lemah. Gunakan minimal 6 karakter.', requiresRecentLogin: false };
  }
  if (code === 'auth/network-request-failed') {
    return { message: 'Koneksi ke Firebase gagal. Periksa internet lalu coba lagi.', requiresRecentLogin: false };
  }
  if (code === 'auth/requires-authentication') {
    return { message: 'Sesi login tidak tersedia. Silakan login ulang.', requiresRecentLogin: true };
  }
  if (code === 'auth/too-many-requests') {
    return { message: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.', requiresRecentLogin: false };
  }
  return { message: 'Password belum dapat diubah. Silakan coba lagi.', requiresRecentLogin: false };
};

export const AccountPasswordModal: React.FC<Props> = ({
  isOpen,
  email,
  uiTheme,
  onClose,
  onRequireRecentLogin,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requiresRecentLogin, setRequiresRecentLogin] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setRequiresRecentLogin(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setRequiresRecentLogin(false);

    if (!newPassword) {
      setErrorMessage('Password baru wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password baru harus memiliki minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak sama dengan password baru.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCurrentUserPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password berhasil diubah.');
    } catch (error) {
      const mapped = getPasswordErrorMessage(error);
      setErrorMessage(mapped.message);
      setRequiresRecentLogin(mapped.requiresRecentLogin);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark = uiTheme === 'dark';
  const inputClass = `w-full rounded-xl border py-2.5 pl-10 pr-11 text-sm outline-none transition-all focus:ring-2 focus:ring-purple-500/20 ${
    isDark
      ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder-slate-500 focus:border-purple-500'
      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:bg-white'
  }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="account-password-title">
      <div className={`relative w-full max-w-md rounded-3xl border p-5 shadow-2xl sm:p-7 ${
        isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
      }`}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200" aria-label="Tutup panel password">
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-start gap-3 pr-9">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-900/60 dark:bg-purple-950/50 dark:text-purple-300">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 id="account-password-title" className="text-lg font-black">Password Akun</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Ubah password melalui Firebase Authentication.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account-password-email" className="mb-1.5 block text-xs font-bold">Email akun</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="account-password-email" type="email" value={email} readOnly className={`${inputClass} cursor-not-allowed opacity-75`} />
            </div>
          </div>

          <div>
            <label htmlFor="account-new-password" className="mb-1.5 block text-xs font-bold">New Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="account-new-password" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" className={inputClass} placeholder="Minimal 6 karakter" disabled={isSubmitting} />
              <button type="button" onClick={() => setShowNewPassword((visible) => !visible)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-purple-600" aria-label={showNewPassword ? 'Sembunyikan password baru' : 'Tampilkan password baru'}>
                {showNewPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="account-confirm-password" className="mb-1.5 block text-xs font-bold">Confirm New Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="account-confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className={inputClass} placeholder="Ulangi password baru" disabled={isSubmitting} />
              <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-purple-600" aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}>
                {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {requiresRecentLogin ? (
            <button type="button" onClick={() => void onRequireRecentLogin()} className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-700">
              Login Ulang dengan Aman
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              <span>{isSubmitting ? 'Mengubah Password...' : 'Ubah Password'}</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
