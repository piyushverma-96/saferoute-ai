import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import { AlertsProvider } from './context/AlertsContext'

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `
    <div style="background:#0A0A0F; color:#EF4444; padding:20px; font-family:monospace">
      <h2>Debug Error:</h2>
      <p>${msg}</p>
      <p>Line: ${line}</p>
      <p>${err?.stack}</p>
    </div>
  `
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          background: '#0A0A0F',
          color: 'white',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1>⚠ Something went wrong</h1>
          <p style={{color: '#EF4444'}}>
            {this.state.error?.message}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#7C3AED',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}>
            🔄 Reload App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AlertsProvider>
        <App />
      </AlertsProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
