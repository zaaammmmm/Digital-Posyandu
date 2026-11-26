import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App.jsx'
import { TransitionProvider } from './context/Transition.jsx'
import { AuthProvider } from './context/Auth.jsx'
import { ToastProvider } from './components/Toast.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <TransitionProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </TransitionProvider>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  </React.StrictMode>
)
