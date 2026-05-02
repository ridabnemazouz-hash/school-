import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AppearanceProvider } from './context/AppearanceContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <AppearanceProvider>
        <App />
      </AppearanceProvider>
    </LanguageProvider>
  </StrictMode>,
)
