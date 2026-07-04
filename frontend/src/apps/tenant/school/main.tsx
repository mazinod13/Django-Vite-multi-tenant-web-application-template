import '@/styles/globals.css'
import { createRoot } from 'react-dom/client'
import AuthGate from '@/components/AuthGate'
import App from './App'

const el = document.getElementById('app')

if (!el) {
  throw new Error('Root element #app was not found')
}

createRoot(el).render(
  <AuthGate>
    <App />
  </AuthGate>,
)
