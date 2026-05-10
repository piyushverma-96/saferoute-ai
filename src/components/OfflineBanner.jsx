import { useState, useEffect } from 'react'

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(
    navigator.onLine
  )
  const [showOnline, setShowOnline] = 
    useState(false)

  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false)
      setShowOnline(false)
    }
    
    const goOnline = () => {
      setIsOnline(true)
      setShowOnline(true)
      // Hide "back online" after 3 seconds
      setTimeout(() => setShowOnline(false), 3000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (isOnline && !showOnline) return null

  return (
    <div style={{
      position: 'fixed',
      top: '52px',
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '10px 16px',
      background: isOnline 
        ? '#064e3b' 
        : '#7f1d1d',
      borderBottom: `1px solid ${
        isOnline ? '#10b981' : '#ef4444'
      }`,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: 'white',
      transition: 'all 0.3s'
    }}>
      {isOnline ? (
        <>
          <span>✅</span>
          <span>Back online — 
            Live data restored</span>
        </>
      ) : (
        <>
          <span>📡</span>
          <span>No internet — 
            Running in offline mode. 
            Cached routes available.</span>
        </>
      )}
    </div>
  )
}

export default OfflineBanner
