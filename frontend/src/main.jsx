import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from './components/ClerkAuth'
import App from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_sample';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App isClerkConfigured={true} />
    </ClerkProvider>
  </React.StrictMode>,
)
