import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AppearanceProvider } from './context/AppearanceContext.jsx'

const origFetch = window.fetch;
window.fetch = function(urlOrRequest, init = {}) {
  const urlStr = typeof urlOrRequest === 'string' ? urlOrRequest : urlOrRequest instanceof URL ? urlOrRequest.toString() : urlOrRequest.url || '';
  if (urlStr.includes('ngrok-free.dev')) {
    init.headers = new Headers(init.headers || {});
    init.headers.set('ngrok-skip-browser-warning', 'true');
  }
  return origFetch(urlOrRequest, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AppearanceProvider>
        <App />
      </AppearanceProvider>
    </LanguageProvider>
  </StrictMode>,
)
