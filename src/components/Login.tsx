import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  LockKeyhole,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  signInWithGoogle,
  signInWithEmail,
  setStoredAuthUser,
  signOutUser,
  requestPasswordReset,
} from '../firebase';
import { checkBuyerEntitlement, normalizeEmail, EntitlementCheckResult } from '../services/buyerEntitlementService';

interface LoginProps {
  onLoginSuccess: (email: string, user: any, entitlement?: EntitlementCheckResult) => void;
  onAccessExpired?: (email: string, entitlement: EntitlementCheckResult) => void;
  initialErrorMessage?: string | null;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onAccessExpired,
  initialErrorMessage,
}) => {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('au_user_email') || '';
    } catch {
      return '';
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage || null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialErrorMessage) {
      setErrorMessage(initialErrorMessage);
    }
  }, [initialErrorMessage]);

  const validateEntitlementStatus = async (
    targetEmail: string,
    entitlement: EntitlementCheckResult
  ): Promise<boolean> => {
    if (entitlement.status === 'APPS_SCRIPT_UNAVAILABLE') {
      setErrorMessage('Server verifikasi spreadsheet sedang tidak dapat dijangkau. Silakan coba lagi.');
      return false;
    }

    if (entitlement.status === 'INVALID_API_RESPONSE') {
      setErrorMessage('Format respon dari server akses tidak valid. Silakan coba lagi.');
      return false;
    }

    if (entitlement.status === 'BACKEND_ERROR') {
      setErrorMessage(entitlement.message || 'Koneksi ke server sedang bermasalah. Silakan coba lagi.');
      return false;
    }

    if (entitlement.status === 'CORS_ORIGIN_BLOCKED') {
      setErrorMessage(entitlement.message || 'Preview ini tidak diizinkan mengakses server verifikasi buyer.');
      return false;
    }

    if (entitlement.status === 'AUTH_REQUIRED' || entitlement.status === 'INVALID_FIREBASE_TOKEN') {
      setErrorMessage('Silakan masukkan alamat email pembelian Anda yang terdaftar.');
      return false;
    }

    if (entitlement.status === 'NOT_REGISTERED' || !entitlement.isRegisteredBuyer) {
      try {
        await signOutUser();
      } catch {}
      setErrorMessage('Email ini tidak ditemukan dalam data pembelian.');
      return false;
    }

    if (entitlement.status === 'ORDER_NOT_SUCCESS') {
      try {
        await signOutUser();
      } catch {}
      setErrorMessage(
        entitlement.message || 'Status pesanan Lynk.id belum berstatus SUCCESS.'
      );
      return false;
    }

    if (entitlement.status === 'INVALID_PURCHASE_DATA') {
      try {
        await signOutUser();
      } catch {}
      setErrorMessage(
        entitlement.message || 'Data tanggal pembelian tidak valid atau kosong di sheet order.'
      );
      return false;
    }

    if (entitlement.status === 'INACTIVE' || entitlement.statusAccount === 'Inactive') {
      try {
        await signOutUser();
      } catch {}
      setErrorMessage(
        entitlement.message ||
          'Status akun Anda tidak aktif (Inactive). Akses terkunci. Silakan hubungi administrator.'
      );
      return false;
    }

    if (entitlement.status === 'EXPIRED' || entitlement.statusAccount === 'Expired') {
      try {
        await signOutUser();
      } catch {}
      if (onAccessExpired) {
        onAccessExpired(targetEmail, entitlement);
      } else {
        setErrorMessage('Masa berlangganan Anda telah habis.');
      }
      return false;
    }

    if (entitlement.status === 'DEVICE_MISMATCH') {
      try {
        await signOutUser();
      } catch {}
      setErrorMessage('Perangkat ini tidak terdaftar.');
      return false;
    }

    return true;
  };

  // 1. User enters Buyer Email
  // 2. Backend checks Google Spreadsheet entitlement
  // 3. If entitlement is valid, authenticate the existing Email/Password user
  // 4. Firebase Auth email must match the Buyer Email
  // 5. If emails match, use firebaseUser.uid for that user's Firestore workspace
  // 6. Load the user's existing workspace
  // 7. If emails do not match, sign out and return EMAIL_ACCOUNT_MISMATCH
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email pembelian Anda yang terdaftar.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format email tidak valid. Mohon masukkan email yang benar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      // 2. Backend checks Google Spreadsheet entitlement
      const entitlement = await checkBuyerEntitlement(cleanEmail);
      const isAllowed = await validateEntitlementStatus(cleanEmail, entitlement);
      if (!isAllowed) {
        setIsLoading(false);
        return;
      }

      if (!password) {
        setIsLoading(false);
        setErrorMessage('Masukkan password Firebase untuk akun ini.');
        return;
      }

      let currentUser;
      try {
        currentUser = await signInWithEmail(cleanEmail, password);
      } catch (authError: any) {
        setIsLoading(false);
        const code = String(authError?.code || '').trim();
        setErrorMessage(
          code
            ? `Login Email/Password gagal (${code}). Periksa email dan password Anda.`
            : 'Login Email/Password gagal. Periksa email dan password Anda.'
        );
        return;
      }

      // Firebase Auth email must match the verified buyer email.
      const verifiedFirebaseEmail = normalizeEmail(currentUser.email || '');
      if (verifiedFirebaseEmail !== cleanEmail) {
        await signOutUser();
        setIsLoading(false);
        setErrorMessage(
          `Email akun Firebase (${verifiedFirebaseEmail}) tidak cocok dengan email pembelian (${cleanEmail}) [EMAIL_ACCOUNT_MISMATCH].`
        );
        return;
      }

      // 5. If emails match, use firebaseUser.uid for that user's Firestore workspace
      const finalUser = {
        uid: currentUser.uid,
        email: cleanEmail,
        displayName: currentUser.displayName || cleanEmail.split('@')[0],
        photoURL: currentUser.photoURL || null,
      };

      try {
        localStorage.setItem('au_user_email', cleanEmail);
        localStorage.setItem('au_is_authenticated', 'true');
        localStorage.setItem('au_session_saved_at', String(Date.now()));
        localStorage.setItem('au_session_expires_at', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        localStorage.setItem('au_buyer_purchase_date', entitlement.purchaseDate || '2026-09-01');
        localStorage.setItem('au_buyer_access_expires_at', entitlement.accessExpiresAt || entitlement.expirationDate || '');
        localStorage.setItem('au_buyer_expiration_date', entitlement.expirationDate || '');
        localStorage.setItem('au_buyer_status_account', entitlement.statusAccount || 'Active');
      } catch {}

      setStoredAuthUser(finalUser);
      setIsLoading(false);

      // 6. Load the user's existing workspace
      onLoginSuccess(cleanEmail, finalUser, entitlement);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Terjadi kesalahan saat memverifikasi akun. Silakan coba lagi.');
    }
  };

  // Direct Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const user = await signInWithGoogle();
      if (!user || !user.email) {
        setIsGoogleLoading(false);
        return;
      }

      const cleanGoogleEmail = normalizeEmail(user.email);
      const cleanInputEmail = normalizeEmail(email);

      if (cleanInputEmail && cleanInputEmail !== cleanGoogleEmail) {
        await signOutUser();
        setIsGoogleLoading(false);
        setErrorMessage(
          `Email akun Google (${cleanGoogleEmail}) tidak cocok dengan email pembelian (${cleanInputEmail}) [EMAIL_ACCOUNT_MISMATCH]. Silakan gunakan akun Google ${cleanInputEmail}.`
        );
        return;
      }

      setEmail(cleanGoogleEmail);

      const entitlement = await checkBuyerEntitlement(cleanGoogleEmail);
      const isAllowed = await validateEntitlementStatus(cleanGoogleEmail, entitlement);
      if (!isAllowed) {
        setIsGoogleLoading(false);
        return;
      }

      const finalUser = {
        uid: user.uid,
        email: cleanGoogleEmail,
        displayName: user.displayName || cleanGoogleEmail.split('@')[0],
        photoURL: user.photoURL || null,
      };

      try {
        localStorage.setItem('au_user_email', cleanGoogleEmail);
        localStorage.setItem('au_is_authenticated', 'true');
        localStorage.setItem('au_session_saved_at', String(Date.now()));
        localStorage.setItem('au_session_expires_at', String(Date.now() + 30 * 24 * 60 * 60 * 1000));
        localStorage.setItem('au_buyer_purchase_date', entitlement.purchaseDate || '2026-09-01');
        localStorage.setItem('au_buyer_access_expires_at', entitlement.accessExpiresAt || entitlement.expirationDate || '');
        localStorage.setItem('au_buyer_expiration_date', entitlement.expirationDate || '');
        localStorage.setItem('au_buyer_status_account', entitlement.statusAccount || 'Active');
      } catch {}

      setStoredAuthUser(finalUser);
      setIsGoogleLoading(false);

      onLoginSuccess(cleanGoogleEmail, finalUser, entitlement);
    } catch (err: unknown) {
      const code = String((err as any)?.code || 'auth/unknown').trim();
      const message = String((err as any)?.message || 'Google Sign-In gagal.').trim();
      console.error('Google sign-in error:', { code, message });
      setErrorMessage(`Google Sign-In gagal (${code}): ${message}`);
    } finally {
      // Every popup, verification, timeout, and workspace transition path must
      // release the Google loading state.
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = normalizeEmail(email);
    setErrorMessage(null);
    setInfoMessage(null);

    if (!cleanEmail) {
      setErrorMessage('Masukkan email akun terlebih dahulu untuk menerima link reset password.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Format email tidak valid. Mohon masukkan email yang benar.');
      return;
    }

    setIsResetLoading(true);
    try {
      await requestPasswordReset(cleanEmail);
      setInfoMessage('Link reset password telah dikirim ke email kamu.');
    } catch (error: unknown) {
      const code = String((error as { code?: string })?.code || '').trim();
      if (code === 'auth/invalid-email') {
        setErrorMessage('Format email tidak valid. Mohon masukkan email yang benar.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMessage('Terlalu banyak permintaan reset. Tunggu sebentar lalu coba lagi.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMessage('Koneksi ke Firebase gagal. Periksa internet lalu coba lagi.');
      } else {
        setErrorMessage('Email reset password belum dapat dikirim. Silakan coba lagi.');
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-slate-100/95 text-slate-800 flex items-start sm:items-center justify-center px-3 py-5 sm:p-6 select-none">
      <div className="my-auto w-full max-w-md min-w-0 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-xl shadow-slate-200/60 space-y-5 sm:space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs">
            <LockKeyhole className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
              AU Toolkit
            </h1>
          </div>
        </div>

        {/* Authentication method tabs; handlers and backend flow remain unchanged. */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Metode masuk">
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'google'}
            onClick={() => {
              setAuthMode('google');
              setErrorMessage(null);
            }}
            className={`min-h-11 rounded-xl px-2 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              authMode === 'google'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Google
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={authMode === 'email'}
            onClick={() => {
              setAuthMode('email');
              setErrorMessage(null);
            }}
            className={`min-h-11 rounded-xl px-2 py-2.5 text-xs font-bold transition-all cursor-pointer ${
              authMode === 'email'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Email &amp; Password
          </button>
        </div>

        {/* Info Notification Alert */}
        {infoMessage && (
          <div className="flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold leading-relaxed animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{infoMessage}</div>
          </div>
        )}

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold leading-relaxed animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Email Login Form */}
        <form
          onSubmit={authMode === 'email' ? handleEmailLogin : (event) => {
            event.preventDefault();
            void handleGoogleSignIn();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="buyer-email-input"
              className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-purple-600" />
              Email Pembeli Terdaftar
            </label>
            <div className="relative">
              <input
                id="buyer-email-input"
                type="email"
                required={authMode === 'email'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                  if (infoMessage) setInfoMessage(null);
                }}
                placeholder="namaemail@gmail.com"
                disabled={isLoading || isGoogleLoading}
                autoFocus
                autoComplete="email"
                className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/15 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 font-medium outline-none transition-all disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Gunakan email yang Anda gunakan saat membeli akses AU Toolkit.
            </p>
          </div>

          {authMode === 'email' && (
            <div className="space-y-1.5">
              <label
                htmlFor="firebase-password-input"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <LockKeyhole className="w-3.5 h-3.5 text-purple-600" />
                Password
              </label>
              <div className="relative">
                <input
                  id="firebase-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Masukkan password akun"
                  disabled={isLoading || isGoogleLoading || isResetLoading}
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-500/15 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 font-medium outline-none transition-all disabled:opacity-50"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-purple-600" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                <button type="button" onClick={() => void handleForgotPassword()} disabled={isLoading || isGoogleLoading || isResetLoading} className="text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50">
                  {isResetLoading ? 'Mengirim link reset...' : 'Lupa password?'}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading || isResetLoading || (authMode === 'email' && (!email.trim() || !password))}
            className="w-full min-h-12 py-3.5 px-4 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memverifikasi Hak Akses...</span>
              </>
            ) : isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memeriksa Akun Google...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{authMode === 'email' ? 'Masuk dengan Email & Password' : 'Masuk dengan Google'}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold tracking-wider">
              ATAU MASUK LANGSUNG
            </span>
          </div>
        </div>

        {/* Alternate authentication method */}
        <button
          type="button"
          onClick={() => {
            setAuthMode(authMode === 'google' ? 'email' : 'google');
            setErrorMessage(null);
          }}
          disabled={isGoogleLoading || isLoading}
          className="w-full min-h-11 py-2.5 px-4 rounded-xl font-bold text-xs bg-white border border-slate-300/80 hover:bg-slate-50 active:bg-slate-100 text-slate-700 shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
        >
          {authMode === 'google' ? (
            <>
              <LockKeyhole className="w-4 h-4 text-purple-600" />
              <span>Masuk dengan Email &amp; Password</span>
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
              <span>Masuk dengan Google</span>
            </>
          )}
        </button>

        {/* Multi-Device Cloud Sync Notice */}
        <div className="pt-2 text-center border-t border-slate-100">
          <p className="text-[11.5px] font-medium text-slate-500 leading-relaxed">
            Data workspace Anda disinkronkan secara otomatis antar HP & Laptop.
          </p>
        </div>
      </div>
    </div>
  );
};
