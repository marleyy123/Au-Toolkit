import { ArrowUpRight, CheckCircle2, LogOut } from 'lucide-react';
import type { EntitlementCheckResult } from '../../../../services/buyerEntitlementService';
import { AuBrand } from '../../../../components/AuBrand';

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
  uiTheme?: 'light' | 'dark';
}

export function AccessGuard({ email, purchaseDate, accessExpiresAt, expirationDate, statusAccount = 'Expired',
  daysRemaining, status = 'EXPIRED', customMessage, onLogout, language = 'id', uiTheme = 'light' }: AccessGuardProps) {
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const isDeviceMismatch = status === 'DEVICE_MISMATCH';
  const isOrderNotSuccess = status === 'ORDER_NOT_SUCCESS';
  const isInactive = status === 'INACTIVE' || statusAccount === 'Inactive';
  const isInvalidPurchase = status === 'INVALID_PURCHASE_DATA';
  const expiry = expirationDate || accessExpiresAt;
  const title = isDeviceMismatch ? copy('Perangkat belum terdaftar', 'Device not registered')
    : isOrderNotSuccess ? copy('Pembayaran belum terverifikasi', 'Payment not verified')
    : isInactive ? copy('Akun sedang nonaktif', 'Your account is inactive')
    : isInvalidPurchase ? copy('Data pembelian perlu diperiksa', 'Purchase details need checking')
    : copy('Waktunya melanjutkan cerita', 'Time for your next chapter');
  const description = customMessage || (isDeviceMismatch ? copy('Perangkat ini belum terdaftar untuk akunmu. Hubungi bantuan untuk memeriksa akses.', 'This device is not registered for your account. Contact support to check your access.')
    : isOrderNotSuccess ? copy('Akses akan tersedia setelah pembayaran Lynk.id terverifikasi sukses.', 'Access becomes available once your Lynk.id payment is verified as successful.')
    : isInactive ? copy('Hubungi administrator untuk memeriksa status akunmu.', 'Contact the administrator to check your account status.')
    : isInvalidPurchase ? copy('Tanggal pembelian belum valid. Hubungi bantuan dengan invoice pembelianmu.', 'The purchase date is invalid. Contact support with your purchase invoice.')
    : copy('Masa akses AU Toolkit kamu telah berakhir. Perpanjang untuk kembali ke editor.', 'Your AU Toolkit access has expired. Renew your plan to return to the editor.'));
  const statusLabel = isDeviceMismatch ? copy('Perangkat', 'Device') : isOrderNotSuccess ? copy('Pembayaran', 'Payment')
    : isInvalidPurchase ? copy('Data pembelian', 'Purchase details') : isInactive ? copy('Nonaktif', 'Inactive') : copy('Akses berakhir', 'Access expired');
  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  return <div className={`au-auth-screen ${uiTheme === 'dark' ? 'au-auth-dark' : ''}`}>
    <section className="au-auth-content au-access-content" aria-labelledby="au-access-title">
      <AuBrand className="au-auth-brand" />
      <span className="au-auth-product">AU Toolkit</span>
      <span className="au-access-status">{statusLabel}</span>
      <div className="au-auth-heading"><h1 id="au-access-title">{title}</h1><p>{description}</p></div>
      <dl className="au-access-details">
        <div><dt>{copy('Email akun', 'Account email')}</dt><dd>{email}</dd></div>
        <div><dt>{copy('Status akun', 'Account status')}</dt><dd>{statusAccount === 'Active' ? copy('Aktif', 'Active') : statusAccount === 'Inactive' ? copy('Nonaktif', 'Inactive') : copy('Berakhir', 'Expired')}</dd></div>
        {purchaseDate && <div><dt>{copy('Tanggal pembelian', 'Purchase date')}</dt><dd>{formatDate(purchaseDate)}</dd></div>}
        {expiry && <div><dt>{copy('Tanggal berakhir', 'Expiry date')}</dt><dd>{formatDate(expiry)}</dd></div>}
        {daysRemaining != null && <div><dt>{copy('Sisa akses', 'Remaining access')}</dt><dd>{daysRemaining} {copy('hari', 'days')}</dd></div>}
      </dl>
      <div className="au-auth-notice au-auth-notice-saved"><CheckCircle2 size={17} /><div><strong>{copy('Ceritamu tetap tersimpan', 'Your saved work stays yours')}</strong><p>{copy('Status akses tidak menghapus folder dan pengaturanmu. Foto lokal tetap ada di browser tempat kamu mengunggahnya.', 'Your access status does not delete your folders or settings. Local photos remain in the browser where you uploaded them.')}</p></div></div>
      <div className="au-auth-actions au-auth-actions-stacked">
        {!isDeviceMismatch && <a className="au-auth-button au-auth-button-primary" href="/#pilihan-paket" target="_blank" rel="noopener noreferrer">{copy('Perpanjang akses', 'Renew access')}<ArrowUpRight size={16} /></a>}
        <button type="button" className="au-auth-button" onClick={onLogout}><LogOut size={15} />{copy('Ganti akun / keluar', 'Switch account / log out')}</button>
      </div>
    </section>
  </div>;
}
