import { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { AuBrand } from '../../../../components/AuBrand';

export type AuthLifecycleStage =
  | 'EDITOR_LOADING' | 'AUTH_LOADING' | 'UNAUTHENTICATED' | 'AUTHENTICATED'
  | 'CHECK_ACCESS' | 'LOAD_USER_DATA' | 'HYDRATE_DATA' | 'READY' | 'ACCESS_EXPIRED' | 'AUTH_ERROR';

interface AppLoadingScreenProps {
  stage: AuthLifecycleStage;
  language?: 'en' | 'id';
  uiTheme?: 'light' | 'dark';
  errorMessage?: string | null;
  onRetry?: () => void;
  onBackToLogin?: () => void;
}

export function AppLoadingScreen({ stage, language = 'id', uiTheme = 'light', errorMessage, onRetry, onBackToLogin }: AppLoadingScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds(value => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const stages = {
    AUTH_LOADING: [copy('Memeriksa akun', 'Checking your account'), copy('Sebentar, kami sedang memeriksa sesi loginmu.', 'Just a moment while we check your sign-in session.')],
    CHECK_ACCESS: [copy('Memverifikasi akses', 'Verifying your access'), copy('Memeriksa status langganan untuk membuka editor.', 'Checking your subscription before opening the editor.')],
    LOAD_USER_DATA: [copy('Membuka workspace', 'Opening your workspace'), copy('Mengambil folder dan pengaturan yang kamu simpan.', 'Fetching your saved folders and settings.')],
    HYDRATE_DATA: [copy('Menyiapkan ceritamu', 'Getting your story ready'), copy('Menyiapkan editor dan pratinjau percakapan.', 'Preparing the editor and conversation preview.')],
    EDITOR_LOADING: [copy('Memuat editor', 'Loading the editor'), copy('Menyiapkan ruang untuk cerita berikutnya.', 'Making room for your next story.')],
  };
  const info = stages[stage as keyof typeof stages] || [copy('Memuat AU Toolkit', 'Loading AU Toolkit'), copy('Sebentar lagi siap.', 'Almost ready.')];
  const steps = ['AUTH_LOADING', 'CHECK_ACCESS', 'LOAD_USER_DATA', 'HYDRATE_DATA'];
  const activeStep = steps.indexOf(stage);
  const labels = [copy('Akun', 'Account'), copy('Akses', 'Access'), copy('Workspace', 'Workspace'), copy('Editor', 'Editor')];
  return <div className={`au-auth-screen ${uiTheme === 'dark' ? 'au-auth-dark' : ''}`}>
    <section className="au-auth-content au-loading-content" aria-busy={!errorMessage} aria-labelledby="au-loading-title">
      <AuBrand className="au-auth-brand" />
      <span className="au-auth-product">AU Toolkit</span>
      <div role="status" aria-live="polite" className="au-auth-heading">
        <h1 id="au-loading-title">{errorMessage ? copy('Belum bisa melanjutkan', 'Unable to continue') : info[0]}</h1>
        <p>{errorMessage ? copy('Coba kembali atau masuk dengan akunmu lagi.', 'Try again or sign in to your account again.') : info[1]}</p>
      </div>
      {errorMessage ? <div className="au-auth-notice au-auth-notice-error" role="alert"><AlertCircle size={17} /><span>{errorMessage}</span></div>
        : <div className="au-loading-indicator" aria-hidden="true"><span /></div>}
      {!errorMessage && activeStep >= 0 && <ol className="au-loading-steps" aria-label={copy('Tahap persiapan', 'Preparation steps')}>
        {labels.map((label, index) => <li key={label} data-complete={index < activeStep} aria-current={index === activeStep ? 'step' : undefined}><span />{label}</li>)}
      </ol>}
      {(elapsedSeconds >= 7 || errorMessage) && <div className="au-loading-recovery">
        {!errorMessage && <p>{copy('Prosesnya sedikit lebih lama. Kamu bisa menunggu atau mencoba lagi.', 'This is taking a little longer. You can wait or try again.')}</p>}
        <div className="au-auth-actions">
          {onRetry && <button type="button" className="au-auth-button au-auth-button-primary" onClick={onRetry}><RefreshCw size={15} />{copy('Coba lagi', 'Try again')}</button>}
          {onBackToLogin && <button type="button" className="au-auth-button" onClick={onBackToLogin}><ArrowLeft size={15} />{copy('Kembali ke login', 'Back to sign in')}</button>}
        </div>
      </div>}
      {!errorMessage && <Loader2 className="au-loading-spinner" size={16} aria-hidden="true" />}
    </section>
  </div>;
}
