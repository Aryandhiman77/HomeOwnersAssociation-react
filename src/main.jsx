import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

try {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#243746',
              border: '1px solid #dce4e8',
              borderRadius: '12px',
              boxShadow: '0 14px 35px rgba(8, 24, 39, 0.18)',
              fontWeight: 700,
              maxWidth: '420px',
              padding: '14px 16px',
            },
            success: {
              iconTheme: {
                primary: '#15803d',
                secondary: '#ffffff',
              },
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
            },
          }}
        />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (error) {
  console.error('React mounting error:', error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>React Mounting Error</h1>
      <pre>${error.message}</pre>
      <pre>${error.stack}</pre>
    </div>
  `;
}
