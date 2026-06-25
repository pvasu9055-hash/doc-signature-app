import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="65303229751-iirh7m4p22c4q8jpra6pmcaipiccdlc3h.app.s.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)