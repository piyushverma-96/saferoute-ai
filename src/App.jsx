import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSOS } from './hooks/useSOS';
import Navbar from './components/Navbar';
import SOSModal from './components/SOSModal';
import OfflineBanner from './components/OfflineBanner';
import UpdatePrompt from './components/UpdatePrompt';
import ProtectedRoute from './components/ProtectedRoute';
import Toast from './components/Toast';

const InstallPrompt = () => {
  const [prompt, setPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    window.addEventListener(
      'beforeinstallprompt', 
      (e) => {
        e.preventDefault()
        setPrompt(e)
        setShow(true)
      }
    )
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      background: '#1a2332',
      border: '1px solid #7c3aed',
      borderRadius: '16px',
      padding: '16px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <span style={{fontSize: '32px'}}>🛡</span>
      <div style={{flex: 1}}>
        <div style={{
          color: '#f1f5f9',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Install SafeRoute AI
        </div>
        <div style={{
          color: '#64748b',
          fontSize: '12px'
        }}>
          Works offline • No app store needed
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <button
          onClick={async () => {
            prompt.prompt()
            const result = await prompt.userChoice
            if (result.outcome === 'accepted') {
              localStorage.setItem('app_installed', 'true')
            }
            setShow(false)
          }}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            color: 'white',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Install
        </button>
        <button
          onClick={() => setShow(false)}
          style={{
            background: 'transparent',
            border: '1px solid #374151',
            borderRadius: '8px',
            padding: '6px 16px',
            color: '#64748b',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Later
        </button>
      </div>
    </div>
  )
}

const IOSInstallHint = () => {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isInstalled = window.navigator.standalone
  
  if (!isIOS || isInstalled) return null
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      background: '#1a2332',
      border: '1px solid #7c3aed',
      borderRadius: '16px',
      padding: '16px',
      zIndex: 9999,
      textAlign: 'center'
    }}>
      <div style={{
        color: '#f1f5f9',
        fontSize: '13px',
        marginBottom: '8px'
      }}>
        📱 Install SafeRoute AI on iPhone
      </div>
      <div style={{
        color: '#94a3b8',
        fontSize: '12px'
      }}>
        Tap <strong>Share</strong> (□↑) 
        then <strong>"Add to Home Screen"</strong>
      </div>
    </div>
  )
}

// Pages
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import Dashboard from './pages/Dashboard';
import ReportForm from './pages/ReportForm';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';
import TrackingPage from './pages/TrackingPage';

function App() {
  const { isSOSActive, toggleSOS, closeSOS, userId } = useSOS();

  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('trusted_contacts') || '[]');
    
    // Only load demo if no contacts exist
    if (existing.length === 0) {
      const DEMO_CONTACTS = [
        {
          id: 1,
          name: 'Mom',
          phone: '9876543210',
          relation: 'Family',
          address: 'Pithampur, Madhya Pradesh',
          lat: 22.6177,
          lng: 75.6953
        },
        {
          id: 2,
          name: 'Best Friend',
          phone: '9123456789',
          relation: 'Friend',
          address: 'Sanwer Road, Indore',
          lat: 22.6800,
          lng: 75.8100
        },
        {
          id: 3,
          name: 'Sister',
          phone: '9988776655',
          relation: 'Family',
          address: 'Lasudia, Indore',
          lat: 22.7200,
          lng: 75.8400
        },
        {
          id: 4,
          name: 'Uncle',
          phone: '9876512345',
          relation: 'Family',
          address: 'Mhow, Indore',
          lat: 22.5518,
          lng: 75.7587
        }
      ];
      localStorage.setItem('trusted_contacts', JSON.stringify(DEMO_CONTACTS));
      console.log('Demo contacts loaded ✅');
    }
  }, []);

  useEffect(() => {
    const unlockAudio = () => {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
    };
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col relative">
        <OfflineBanner />
        <Navbar onToggleSOS={toggleSOS} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/track/:userId" element={<TrackingPage />} />
            <Route path="/app" element={
              <ProtectedRoute>
                <AppPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute>
                <ReportForm />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <SOSModal 
          isOpen={isSOSActive} 
          onClose={closeSOS} 
          userId={userId}
        />
        <InstallPrompt />
        <IOSInstallHint />
        <UpdatePrompt />
        <Toast />
      </div>
    </BrowserRouter>
  );
}

export default App;
