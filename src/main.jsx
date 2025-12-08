import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { DAuthProvider } from 'auth-node-test'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DAuthProvider
      clientId={import.meta.env.VITE_CLIENT_ID}
      redirectUri={window.location.origin + '/callback'}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DAuthProvider>
  </StrictMode>,
)
