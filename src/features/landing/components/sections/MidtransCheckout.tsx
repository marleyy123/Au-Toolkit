import { useEffect, useId, useRef, useState } from 'react';
import type { PlanQuote, Quote } from '../../hooks/useRegionalPricing';
import { useLandingLanguage } from '../../hooks/useLandingLanguage';
import { landingLinks } from '../../data/landingContent';

type Order = { orderId: string; statusToken: string; snapToken: string; clientKey: string; production: boolean; amount: number; planId?: string; accessDays?: number };
type Snap = { pay: (token: string, callbacks: { onSuccess: () => void; onPending: () => void; onError: () => void; onClose: () => void }) => void };
const STORAGE = 'au-midtrans-order';
function savedOrder(storage: string, planId: string): Order | null {
  try {
    const data = JSON.parse(sessionStorage.getItem(storage) || 'null');
    return typeof data?.production === 'boolean' && (data.planId === planId || (!data.planId && planId === 'monthly')) &&
      /^au_(?:sb|live)_[a-f0-9]{32}$/.test(data.orderId) && /^[a-f0-9]{64}$/.test(data.statusToken) &&
      typeof data.snapToken === 'string' && /^Mid-client-[A-Za-z0-9_-]+$/.test(data.clientKey || '') ? data : null;
  } catch { return null; }
}
async function api(body: object) {
  const response = await fetch('/api/midtrans', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.reason || 'PAYMENT_SERVICE_UNAVAILABLE');
  return data;
}
function loadSnap(clientKey: string, production: boolean): Promise<Snap> {
  return new Promise((resolve, reject) => {
    const target = window as Window & { snap?: Snap };
    const existing = document.getElementById('au-midtrans-snap') as HTMLScriptElement | null;
    if (existing?.dataset.clientKey === clientKey && existing.dataset.production === String(production) && target.snap) return resolve(target.snap);
    existing?.remove();
    const script = document.createElement('script');
    script.id = 'au-midtrans-snap';
    script.src = `https://app${production ? '' : '.sandbox'}.midtrans.com/snap/snap.js`;
    script.dataset.clientKey = clientKey;
    script.dataset.production = String(production);
    const timeout = window.setTimeout(() => { script.remove(); reject(new Error('SNAP_LOAD_FAILED')); }, 15000);
    script.onload = () => { clearTimeout(timeout); target.snap ? resolve(target.snap) : reject(new Error('SNAP_LOAD_FAILED')); };
    script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('SNAP_LOAD_FAILED')); };
    document.head.appendChild(script);
  });
}

export function MidtransCheckout({ quote, plan }: { quote: Quote; plan: PlanQuote }) {
  const { copy } = useLandingLanguage();
  const titleId = useId();
  const storage = plan.id === 'monthly' ? STORAGE : `${STORAGE}-${plan.id}`;
  const dialog = useRef<HTMLDialogElement>(null);
  const [order, setOrder] = useState<Order | null>(() => savedOrder(storage, plan.id));
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [paid, setPaid] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const explain = (reason: string) => ({
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
        setPaid(true); try { sessionStorage.removeItem(storage); } catch {}
        setMessage(result.accessActivated === true
          ? copy('Pembayaran terverifikasi. Akses staging aktif. Silakan masuk dengan email pembelian.', 'Payment verified. Staging access is active. Sign in using your purchase email.')
          : copy('Pembayaran terverifikasi, tetapi akses akun belum aktif. Hubungi admin dengan nomor transaksi ini.', 'Payment verified, but account access is inactive. Contact the administrator with this order number.'));
      } else if (result.status === 'pending') setMessage(copy('Belum ada pembayaran terverifikasi. Selesaikan pembayaran lalu periksa lagi.', 'No verified payment yet. Complete the payment, then check again.'));
      else setMessage(copy('Transaksi berakhir: ', 'Transaction ended: ') + result.status);
    } catch (e) { if (mounted.current) setMessage(explain((e as Error).message)); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function pay(current: Order) {
    const snap = await loadSnap(current.clientKey, current.production);
    if (!mounted.current) return;
    // A native modal sits above Snap's iframe. Close it before opening Snap.
    dialog.current?.close();
    const reopen = () => { if (mounted.current) dialog.current?.showModal(); };
    snap.pay(current.snapToken, {
      onSuccess: () => { reopen(); void check(current); },
      onPending: () => { reopen(); void check(current); },
      onError: () => { reopen(); setMessage(copy('Pembayaran gagal. Periksa status atau coba kembali.', 'Payment failed. Check the status or try again.')); },
      onClose: () => { reopen(); setMessage(copy('Pembayaran belum selesai. Kamu bisa melanjutkan atau memeriksa status.', 'Payment is unfinished. You can resume or check its status.')); },
    });
  }
  async function start() {
    setBusy(true); setMessage('');
    try {
      const current: Order = order || await api({ action: 'create', planId: plan.id, email });
      if (!mounted.current) return;
      if (typeof current.production !== 'boolean' || !/^Mid-client-[A-Za-z0-9_-]+$/.test(current.clientKey || '') || !current.snapToken) throw new Error('MIDTRANS_KEYS_REQUIRED');
      setOrder(current);
      try { sessionStorage.setItem(storage, JSON.stringify({ ...current, planId: plan.id })); } catch { /* Checkout remains usable with storage disabled. */ }
      await pay(current);
    } catch (e) { if (mounted.current) setMessage(explain((e as Error).message)); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <>
    <button className="landing-button landing-button-primary" type="button" onClick={() => dialog.current?.showModal()}>{copy('Bayar melalui Midtrans', 'Pay with Midtrans')}</button>
    <dialog ref={dialog} className="landing-payment-dialog" aria-labelledby={titleId} onCancel={event => { if (busy) event.preventDefault(); }}>
      <h2 id={titleId}>{copy(order?.production ?? quote.production ? 'Pembayaran Midtrans' : 'Pembayaran sandbox', order?.production ?? quote.production ? 'Midtrans payment' : 'Sandbox payment')}</h2>
      <p>{copy(order?.production ?? quote.production ? 'Pembayaran diproses langsung oleh Midtrans. Semua metode yang aktif di akun tersedia pada langkah berikutnya.' : 'Simulasi pembayaran tanpa uang sungguhan. Semua metode yang aktif di akun Midtrans tersedia pada langkah berikutnya.', order?.production ?? quote.production ? 'Payment is processed by Midtrans. Every active payment method in the account is available in the next step.' : 'Test payments without real money. Every active Midtrans payment method is available in the next step.')}</p>
      <p>{copy(`Akses ${order?.accessDays ?? plan.accessDays} hari · `, `${order?.accessDays ?? plan.accessDays} days access · `)}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order?.amount ?? plan.amount)}</p>
      {quote.ready === false && <p role="alert">{explain(quote.reason || '')}</p>}
      {paid ? <a className="landing-button landing-button-primary" href={landingLinks.editor}>{copy('Masuk ke akun', 'Sign in')}</a> : <form onSubmit={event => { event.preventDefault(); void start(); }}>
        {!order && <label>{copy('Email akun Google untuk akses', 'Google account email for access')}<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label>}
        {order && <p className="landing-payment-order">{copy('Nomor transaksi: ', 'Order: ')}{order.orderId}</p>}
        <button className="landing-button landing-button-primary" disabled={busy || quote.ready === false}>{busy ? copy('Memproses…', 'Processing…') : order ? copy('Lanjutkan pembayaran', 'Resume payment') : copy('Pilih metode pembayaran', 'Choose payment method')}</button>
        {order && <button type="button" className="landing-button landing-button-secondary" disabled={busy} onClick={() => void check()}>{copy('Periksa status pembayaran', 'Check payment status')}</button>}
        {order && <button type="button" className="landing-button landing-button-secondary" disabled={busy} onClick={() => { try { sessionStorage.removeItem(storage); } catch {} setOrder(null); setPaid(false); setMessage(''); }}>{copy('Buat transaksi baru', 'Create a new order')}</button>}
      </form>}
      <p role="status" aria-live="polite">{message}</p>
      <button className="landing-button landing-button-secondary" type="button" disabled={busy} onClick={() => dialog.current?.close()}>{copy('Tutup', 'Close')}</button>
    </dialog>
  </>;
}
