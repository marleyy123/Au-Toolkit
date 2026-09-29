import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LegalPage } from './components/LegalPage';
import { ExportRenderPage } from './export/ExportRenderPage';
import { installPersistentLocalImageResolver } from './utils/imageManager';
import './index.css';

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
  const publicPage = pathname === '/__export-render'
    ? <ExportRenderPage />
    : pathname === '/privacy'
    ? <LegalPage kind="privacy" />
    : pathname === '/terms'
      ? <LegalPage kind="terms" />
      : <App />;

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
