import { useEffect, useId, useRef, useState } from 'react';
import { Check, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import type { PlanQuote, Quote } from '../../hooks/useRegionalPricing';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';
import { landingLinks } from '../../data/landingContent';
import { auth, onAuthUserChanged, signInWithGoogle, signOutUser, getStoredAuthUser } from '../../../../firebase';

type Order = {
  orderId: string;
  statusToken: string;
  snapToken: string;
  clientKey: string;
  production: boolean;
  amount: number;
  planId?: string;
  accessDays?: number;
};

type Snap = {
  pay: (
    token: string,
    callbacks: {
      onSuccess: () => void;
      onPending: () => void;
      onError: () => void;
      onClose: () => void;
    }
  ) => void;
};

const STORAGE = 'au-midtrans-order';

function savedOrder(storage: string, planId: string): Order | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(storage) || 'null');
    return typeof data?.production === 'boolean' &&
      (data.planId === planId || (!data.planId && planId === 'monthly')) &&
      /^au_(?:sb|live)_[a-f0-9]{32}$/.test(data.orderId) &&
      /^[a-f0-9]{64}$/.test(data.statusToken) &&
      typeof data.snapToken === 'string' &&
      /^Mid-client-[A-Za-z0-9_-]+$/.test(data.clientKey || '')
      ? data
      : null;
  } catch {
    return null;
  }
}

async function api(body: object) {
  const response = await fetch('/api/midtrans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.reason || 'PAYMENT_SERVICE_UNAVAILABLE');
  return data;
}

function loadSnap(clientKey: string, production: boolean): Promise<Snap> {
  return new Promise((resolve, reject) => {
    const target = window as Window & { snap?: Snap };
    const existing = document.getElementById('au-midtrans-snap') as HTMLScriptElement | null;
    if (existing?.dataset.clientKey === clientKey && existing.dataset.production === String(production) && target.snap) {
      return resolve(target.snap);
    }
    existing?.remove();
    const script = document.createElement('script');
    script.id = 'au-midtrans-snap';
    script.src = `https://app${production ? '' : '.sandbox'}.midtrans.com/snap/snap.js`;
    script.dataset.clientKey = clientKey;
    script.dataset.production = String(production);
    const timeout = window.setTimeout(() => {
      script.remove();
      reject(new Error('SNAP_LOAD_FAILED'));
    }, 15000);
    script.onload = () => {
      clearTimeout(timeout);
      target.snap ? resolve(target.snap) : reject(new Error('SNAP_LOAD_FAILED'));
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error('SNAP_LOAD_FAILED'));
    };
    document.head.appendChild(script);
  });
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="18" height="18">
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
  );
}

export function MidtransCheckout({ quote, plan }: { quote: Quote; plan: PlanQuote }) {
  const { copy } = useLandingLanguage();
  const titleId = useId();
  const storage = plan.id === 'monthly' ? STORAGE : `${STORAGE}-${plan.id}`;
  const dialog = useRef<HTMLDialogElement>(null);
  const [order, setOrder] = useState<Order | null>(() => savedOrder(storage, plan.id));
  const [currentUser, setCurrentUser] = useState<any>(() => auth.currentUser || getStoredAuthUser());
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [paid, setPaid] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = onAuthUserChanged((user) => {
      if (!mounted.current) return;
      setCurrentUser(user);
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  const explain = (reason: string) =>
    ({
      MIDTRANS_KEYS_REQUIRED: copy('Key Midtrans belum sesuai. Hubungi admin.', 'Midtrans keys need to be configured by the administrator.'),
      MIDTRANS_AUTH_FAILED: copy('API Midtrans menolak key. Periksa key dan mode environment di dashboard Midtrans.', 'Midtrans rejected the key. Check the key and environment mode in the Midtrans dashboard.'),
      FIRESTORE_ACCESS_REQUIRED: copy('Backend akses staging belum siap. Hubungi admin.', 'The staging access backend is not ready. Contact the administrator.'),
      FIREBASE_ADMIN_CONFIG_REQUIRED: copy('Konfigurasi server akses staging belum lengkap.', 'The staging access server configuration is incomplete.'),
      CHECKOUT_RATE_LIMIT: copy('Tunggu 30 detik sebelum membuat pembayaran baru.', 'Wait 30 seconds before starting another payment.'),
      REGION_UNAVAILABLE: copy('Region belum terdeteksi. Muat ulang lalu coba lagi.', 'Region unavailable. Reload and try again.'),
      SNAP_LOAD_FAILED: copy('Halaman pembayaran gagal dimuat. Coba lanjutkan pembayaran.', 'Payment page could not load. Try resuming the payment.'),
    }[reason] || copy('Pembayaran belum dapat diproses. Coba lagi atau hubungi bantuan.', 'Unable to process the payment. Try again or contact support.'));

  async function check(current = order) {
    if (!current) return;
    setBusy(true);
    try {
      const result = await api({ action: 'status', orderId: current.orderId, statusToken: current.statusToken });
      if (!mounted.current) return;
      if (result.status === 'paid') {
        setPaid(true);
        try {
          sessionStorage.removeItem(storage);
        } catch {}
        setMessage(
          result.accessActivated === true
            ? copy(
                'Pembayaran terverifikasi. Akses akun Anda sekarang aktif!',
                'Payment verified. Your account access is now active!'
              )
            : copy(
                'Pembayaran terverifikasi, tetapi akses akun belum aktif. Hubungi admin dengan nomor transaksi ini.',
                'Payment verified, but account access is inactive. Contact the administrator with this order number.'
              )
        );
      } else if (result.status === 'pending') {
        setMessage(copy('Belum ada pembayaran terverifikasi. Selesaikan pembayaran lalu periksa lagi.', 'No verified payment yet. Complete the payment, then check again.'));
      } else {
        setMessage(copy('Transaksi berakhir: ', 'Transaction ended: ') + result.status);
      }
    } catch (e) {
      if (mounted.current) setMessage(explain((e as Error).message));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function pay(current: Order) {
    const snap = await loadSnap(current.clientKey, current.production);
    if (!mounted.current) return;
    dialog.current?.close();
    const reopen = () => {
      if (mounted.current) dialog.current?.showModal();
    };
    snap.pay(current.snapToken, {
      onSuccess: () => {
        reopen();
        void check(current);
      },
      onPending: () => {
        reopen();
        void check(current);
      },
      onError: () => {
        reopen();
        setMessage(copy('Pembayaran gagal. Periksa status atau coba kembali.', 'Payment failed. Check the status or try again.'));
      },
      onClose: () => {
        reopen();
        setMessage(copy('Pembayaran belum selesai. Kamu bisa melanjutkan atau memeriksa status.', 'Payment is unfinished. You can resume or check its status.'));
      },
    });
  }

  async function handleGoogleLogin() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const loggedUser = await signInWithGoogle();
      if (!mounted.current) return;
      if (loggedUser) {
        setCurrentUser(loggedUser);
      }
    } catch (err: any) {
      if (mounted.current) {
        setAuthError(copy('Gagal masuk dengan Google. Silakan coba lagi.', 'Failed to sign in with Google. Please try again.'));
      }
    } finally {
      if (mounted.current) setAuthBusy(false);
    }
  }

  async function handleSwitchAccount() {
    setBusy(true);
    try {
      await signOutUser();
      if (!mounted.current) return;
      setCurrentUser(null);
      setOrder(null);
      try {
        sessionStorage.removeItem(storage);
      } catch {}
    } catch {} finally {
      if (mounted.current) setBusy(false);
    }
  }

  async function start() {
    if (!currentUser?.email) {
      setAuthError(copy('Silakan masuk dengan akun Google terlebih dahulu.', 'Please sign in with your Google account first.'));
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const current: Order =
        order ||
        (await api({
          action: 'create',
          planId: plan.id,
          email: currentUser.email,
          uid: currentUser.uid || undefined,
        }));
      if (!mounted.current) return;
      if (typeof current.production !== 'boolean' || !/^Mid-client-[A-Za-z0-9_-]+$/.test(current.clientKey || '') || !current.snapToken) {
        throw new Error('MIDTRANS_KEYS_REQUIRED');
      }
      setOrder(current);
      try {
        sessionStorage.setItem(storage, JSON.stringify({ ...current, planId: plan.id }));
      } catch {}
      await pay(current);
    } catch (e) {
      if (mounted.current) setMessage(explain((e as Error).message));
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <>
      <button className="landing-button landing-button-primary" type="button" onClick={() => dialog.current?.showModal()}>
        {copy('Bayar melalui Midtrans', 'Pay with Midtrans')}
      </button>

      <dialog
        ref={dialog}
        className="landing-payment-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (busy || authBusy) event.preventDefault();
        }}
      >
        <h2 id={titleId}>
          {copy(
            order?.production ?? quote.production ? 'Pembayaran Midtrans' : 'Pembayaran sandbox',
            order?.production ?? quote.production ? 'Midtrans payment' : 'Sandbox payment'
          )}
        </h2>

        <p>
          {copy(
            order?.production ?? quote.production
              ? 'Pembayaran diproses langsung oleh Midtrans. Semua metode yang aktif di akun tersedia pada langkah berikutnya.'
              : 'Simulasi pembayaran tanpa uang sungguhan. Semua metode yang aktif di akun Midtrans tersedia pada langkah berikutnya.',
            order?.production ?? quote.production
              ? 'Payment is processed by Midtrans. Every active payment method in the account is available in the next step.'
              : 'Test payments without real money. Every active Midtrans payment method is available in the next step.'
          )}
        </p>

        <p>
          {copy(`Akses ${order?.accessDays ?? plan.accessDays} hari · `, `${order?.accessDays ?? plan.accessDays} days access · `)}
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order?.amount ?? plan.amount)}
        </p>

        {quote.ready === false && <p role="alert">{explain(quote.reason || '')}</p>}

        {paid ? (
          <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#edf7f1',
                color: '#28755d',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}
            >
              <Check size={26} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>{copy('Pembayaran Berhasil!', 'Payment Successful!')}</h3>
            <p style={{ fontSize: '13px', color: '#676975', margin: '0 0 16px' }}>
              {copy(
                `Akses ${order?.accessDays ?? plan.accessDays} hari telah aktif untuk akun ${currentUser?.email || ''}.`,
                `${order?.accessDays ?? plan.accessDays} days access is now active for ${currentUser?.email || ''}.`
              )}
            </p>
            <a className="landing-button landing-button-primary" href={landingLinks.editor}>
              {copy('Buka Editor Sekarang', 'Open Editor Now')}
              <ArrowRight size={16} />
            </a>
          </div>
        ) : !currentUser ? (
          /* Step 1: Login with Google first to guarantee zero typos */
          <div className="landing-auth-prompt">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <p className="landing-auth-prompt-desc">
                {copy(
                  'Masuk dengan akun Google Anda terlebih dahulu agar akses langganan langsung terhubung ke akun Anda secara otomatis tanpa risiko salah ketik email.',
                  'Sign in with your Google account first so your subscription is automatically linked to your account with zero email typos.'
                )}
              </p>
            </div>

            <button
              type="button"
              className="landing-button landing-google-btn"
              disabled={authBusy || busy}
              onClick={() => void handleGoogleLogin()}
            >
              {authBusy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{copy('Menghubungkan ke Google…', 'Connecting to Google…')}</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>{copy('Lanjutkan dengan Google', 'Continue with Google')}</span>
                </>
              )}
            </button>

            {authError && (
              <p role="alert" style={{ color: '#d92d20', fontSize: '12px', margin: 0 }}>
                {authError}
              </p>
            )}
          </div>
        ) : (
          /* Step 2: User is authenticated -> show locked verified account & proceed button */
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void start();
            }}
          >
            <div className="landing-account-card">
              <div className="landing-account-info">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="landing-account-avatar" />
                ) : (
                  <div className="landing-account-avatar-placeholder">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="landing-account-details">
                  <span className="landing-account-name">
                    {currentUser.displayName || copy('Akun Google', 'Google Account')}
                  </span>
                  <span className="landing-account-email">{currentUser.email}</span>
                  <span className="landing-verified-badge">
                    <Check size={12} />
                    {copy('Email Akun Terverifikasi', 'Verified Account Email')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="landing-account-switch"
                disabled={busy}
                onClick={() => void handleSwitchAccount()}
                title={copy('Ganti akun Google', 'Switch Google account')}
              >
                {copy('Ganti Akun', 'Switch')}
              </button>
            </div>

            {order && (
              <p className="landing-payment-order">
                {copy('Nomor transaksi: ', 'Order: ')}
                {order.orderId}
              </p>
            )}

            <button
              className="landing-button landing-button-primary"
              disabled={busy || quote.ready === false}
            >
              {busy
                ? copy('Memproses…', 'Processing…')
                : order
                ? copy('Lanjutkan pembayaran', 'Resume payment')
                : copy('Pilih metode pembayaran', 'Choose payment method')}
            </button>

            {order && (
              <button
                type="button"
                className="landing-button landing-button-secondary"
                disabled={busy}
                onClick={() => void check()}
              >
                {copy('Periksa status pembayaran', 'Check payment status')}
              </button>
            )}

            {order && (
              <button
                type="button"
                className="landing-button landing-button-secondary"
                disabled={busy}
                onClick={() => {
                  try {
                    sessionStorage.removeItem(storage);
                  } catch {}
                  setOrder(null);
                  setPaid(false);
                  setMessage('');
                }}
              >
                {copy('Buat transaksi baru', 'Create a new order')}
              </button>
            )}
          </form>
        )}

        <p role="status" aria-live="polite">
          {message}
        </p>

        <button
          className="landing-button landing-button-secondary"
          type="button"
          disabled={busy || authBusy}
          onClick={() => dialog.current?.close()}
        >
          {copy('Tutup', 'Close')}
        </button>
      </dialog>
    </>
  );
}
