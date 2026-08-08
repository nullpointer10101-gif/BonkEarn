import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const AUTO_RELOAD_KEY = 'bonk_auto_reloaded'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[BonkEarn] Render error caught:', error, errorInfo)
    try {
      // First crash: silently auto-recover once
      if (!sessionStorage.getItem(AUTO_RELOAD_KEY)) {
        sessionStorage.setItem(AUTO_RELOAD_KEY, '1')
        setTimeout(() => window.location.reload(), 700)
      }
    } catch (e) {}
  }

  retry = () => {
    try {
      sessionStorage.removeItem(AUTO_RELOAD_KEY)
    } catch (e) {}
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 30%, #1e1238 0%, #0d0b18 70%)',
          color: '#fff', textAlign: 'center', padding: 24, fontFamily: 'Outfit, sans-serif'
        }}>
          <img src="/bonk_coin.png" alt="BONK" style={{ width: 72, height: 72, borderRadius: '50%', marginBottom: 14, boxShadow: '0 0 30px rgba(245,158,11,0.45)' }} />
          <div style={{ fontWeight: 800, fontSize: 18 }}>Temporary Glitch</div>
          <div style={{ fontSize: 13, color: '#9ca3af', margin: '6px 0 16px' }}>Something went wrong. Tap Retry to get back to earning.</div>
          <button onClick={this.retry} style={{ background: 'linear-gradient(135deg, #7c3aed, #c084fc)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>↻ Retry</button>
        </div>
      )
    }
    return this.props.children
  }
}

// Global safety net: any uncaught error → one silent auto-reload, then sticky fallback
let silentRecovered = false
function runGlobalRecovery() {
  try {
    if (!sessionStorage.getItem(AUTO_RELOAD_KEY) && !silentRecovered) {
      silentRecovered = true
      sessionStorage.setItem(AUTO_RELOAD_KEY, '1')
      setTimeout(() => window.location.reload(), 700)
    }
  } catch (e) {}
}

window.addEventListener('error', (e) => {
  console.error('[BonkEarn] Global error:', e.error || e.message)
  runGlobalRecovery()
})
window.addEventListener('unhandledrejection', (e) => {
  console.warn('[BonkEarn] Unhandled rejection:', e.reason)
  runGlobalRecovery()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)