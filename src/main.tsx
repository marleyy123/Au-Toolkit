import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AppLoadingScreen } from './features/auth/components/access/AppLoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LegalPage } from './components/LegalPage';
import { ExportRenderPage } from './export/ExportRenderPage';
import { installPersistentLocalImageResolver } from './utils/imageManager';
import { MaintenancePage } from './components/MaintenancePage';
import './index.css';

const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const App = lazy(() => import('./App.tsx'));

function RouteLoading({ editor = false }: { editor?: boolean }) {
  const { language } = useLanguage();
  return <AppLoadingScreen stage={editor ? 'EDITOR_LOADING' : 'UNAUTHENTICATED'} language={language} />;
}

if (typeof window !== 'undefined') {
  // One-time cleanup of the old debug flag so Eruda never reappears for existing users.
  try {
    localStorage.removeItem('au_debug');
  } catch {}

  installPersistentLocalImageResolver();
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  const publicPage = maintenanceMode
    ? <MaintenancePage />
    : pathname === '/' || pathname === '/landing'
      ? <Suspense fallback={<RouteLoading />}><LandingPage /></Suspense>
      : pathname === '/__export-render'
        ? <ExportRenderPage />
        : pathname === '/privacy'
          ? <LegalPage kind="privacy" />
          : pathname === '/terms'
            ? <LegalPage kind="terms" />
            : <Suspense fallback={<RouteLoading editor />}><App /></Suspense>;

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <LanguageProvider>
          {publicPage}
        </LanguageProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}