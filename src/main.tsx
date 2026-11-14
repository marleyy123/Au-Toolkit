import {StrictMode, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AppLoadingScreen } from './features/auth/components/access/AppLoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LegalPage } from './components/LegalPage';
import { ExportRenderPage } from './export/ExportRenderPage';
import { installPersistentLocalImageResolver } from './utils/imageManager';
import './index.css';

const LandingPage = lazy(() => import('./features/landing/LandingPage'));
const App = lazy(() => import('./App.tsx'));

function RouteLoading({ editor = false }: { editor?: boolean }) {
  const { language } = useLanguage();
  return <AppLoadingScreen stage={editor ? 'EDITOR_LOADING' : 'UNAUTHENTICATED'} language={language} />;
}

// Intercept global runtime exceptions
if (typeof window !== 'undefined') {
  installPersistentLocalImageResolver();
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      console.warn('Unhandled rejection captured in main:', event?.reason);
      if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      console.warn('Runtime error captured in main:', event?.message || event);
      if (event) {
        if (typeof event.preventDefault === 'function') event.preventDefault();
        if (typeof event.stopPropagation === 'function') event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      }
    },
    true
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const publicPage = pathname === '/' || pathname === '/landing'
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
