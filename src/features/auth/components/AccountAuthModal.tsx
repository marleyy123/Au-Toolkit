import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, AlertCircle, Sparkles, X, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser } from '../../../firebase';
import { detectDeviceSlot, getDeviceFriendlyLabel } from '../../../utils/deviceAuthService';
import { validateLoginAccess } from '../../../services/buyerEntitlementService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  uiTheme?: 'light' | 'dark';
}

export const AccountAuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  uiTheme = 'light',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setErrorMsg('Mohon masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Validate access with Google Apps Script API endpoint
    const access = await validateLoginAccess(cleanEmail);
    if (!access.allowed) {
      setErrorMsg(access.message);
      setIsLoading(false);
      return;
    }

    const slot = detectDeviceSlot();
    const deviceLabel = getDeviceFriendlyLabel(slot);

    try {
      if (mode === 'signin') {
        await signInWithEmail(cleanEmail, password);
      } else {
        await signUpWithEmail(cleanEmail, password, fullName.trim() || undefined);
      }
      try {
        localStorage.setItem('au_user_email', cleanEmail);
        localStorage.setItem('au_is_authenticated', 'true');
        localStorage.setItem('au_session_saved_at', String(Date.now()));
        localStorage.setItem('au_session_expires_at', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        localStorage.setItem('au_device_slot', slot);
        localStorage.setItem('au_device_label', deviceLabel);
      } catch {}
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.warn('Auth error:', err);
      setErrorMsg(err?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        const cleanEmail = user.email.trim().toLowerCase();

        // Validate access with Google Apps Script API endpoint
        const access = await validateLoginAccess(cleanEmail);
        if (!access.allowed) {
          setErrorMsg(access.message);
          try {
            await signOutUser();
          } catch {}
          setIsGoogleLoading(false);
          return;
        }

        const slot = detectDeviceSlot();
        const deviceLabel = getDeviceFriendlyLabel(slot);

        try {
          localStorage.setItem('au_user_email', cleanEmail);
          localStorage.setItem('au_is_authenticated', 'true');
          localStorage.setItem('au_session_saved_at', String(Date.now()));
          localStorage.setItem('au_session_expires_at', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
          localStorage.setItem('au_device_slot', slot);
          localStorage.setItem('au_device_label', deviceLabel);
        } catch {}
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.warn('Google auth error:', err);
      setErrorMsg('Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isDark = uiTheme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border transition-all relative ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black tracking-tight">
              {mode === 'signin' ? 'Sign in to AU Toolkit' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'signin'
                ? 'Sync your preset characters & folders automatically'
                : 'Get started with cloud backup and synced folders'}
            </p>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Create Account */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4 border border-slate-200/80 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 mb-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium leading-relaxed animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg focus:outline-none"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Navigation Toggle Link */}
        <div className="text-center pt-2">
          {mode === 'signin' ? (
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(null); }}
              className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-normal transition-colors cursor-pointer"
            >
              Don&apos;t have an account? <span className="font-medium text-purple-600 dark:text-purple-400 hover:underline">Create account</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMode('signin'); setErrorMsg(null); }}
              className="text-xs text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 font-normal transition-colors cursor-pointer"
            >
              Already have an account? <span className="font-medium text-purple-600 dark:text-purple-400 hover:underline">Sign in</span>
            </button>
          )}
        </div>

        {/* Minimalist Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className={`px-2 font-bold ${isDark ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Continue Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span>Connecting Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
