import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AppRoutes from './routes/AppRoutes'
import CookieConsent from './components/CookieConsent'
import './styles/index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <CookieConsent />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)