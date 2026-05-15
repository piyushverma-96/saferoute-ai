import { useState, useEffect } from 'react';
import { showToast } from './Toast';

const InstallButton = ({ variant = 'floating' }) => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Check if already installed
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Capture install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      showToast({ 
        message: "✅ SafeRoute AI installed successfully! Open from home screen anytime.",
        severity: "low"
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      // appinstalled event will fire and show toast
    }
  };

  // Only show on mobile and if not installed
  if (!isMobile || isInstalled) return null;

  // Variant: Navbar (Small button)
  if (variant === 'navbar') {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 bg-brand-purple/10 text-brand-purple border border-brand-purple/50 px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-brand-purple hover:text-white transition-all duration-300"
      >
        <span className="text-sm">📲</span> Install
      </button>
    );
  }

  // Variant: Floating (Shown in app)
  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={handleInstall}
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '16px',
            zIndex: 950,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none',
            borderRadius: '25px',
            padding: '10px 16px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            animation: 'pulse 2s infinite'
          }}
        >
          📲 Install App
        </button>

        {/* iOS Guide Modal */}
        {showIOSGuide && (
          <div style={{
            position: 'fixed',
            bottom: '140px',
            left: '16px',
            right: '16px',
            background: '#1a2332',
            border: '1px solid #7c3aed',
            borderRadius: '16px',
            padding: '16px',
            zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              color: '#f1f5f9',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              📱 Install on iPhone
              <button onClick={() => setShowIOSGuide(false)} className="text-brand-text-muted">✕</button>
            </div>
            <div style={{
              color: '#94a3b8',
              fontSize: '13px',
              lineHeight: '1.6'
            }}>
              1. Tap <strong style={{color:'#f1f5f9'}}>Share button</strong> (□↑) at bottom
              <br/>
              2. Scroll down → tap <strong style={{color:'#f1f5f9'}}>"Add to Home Screen"</strong>
              <br/>
              3. Tap <strong style={{color:'#f1f5f9'}}>"Add"</strong>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                marginTop: '12px',
                background: 'transparent',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '6px 16px',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Got it ✓
            </button>
          </div>
        )}
      </>
    );
  }

  // Variant: Banner (Shown on Landing Page)
  if (variant === 'banner') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.15))',
        border: '1px solid rgba(124,58,237,0.3)',
        borderRadius: '16px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginTop: '24px',
        textAlign: 'left'
      }}>
        <span style={{fontSize: '40px'}}>📲</span>
        <div style={{flex: 1}}>
          <div style={{
            color: '#f1f5f9',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            Install SafeRoute AI
          </div>
          <div style={{
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            Works offline • No app store needed • Free forever
          </div>
        </div>
        <button
          onClick={handleInstall}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Install Free
        </button>

        {showIOSGuide && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            padding: '20px'
          }}>
            <div style={{
              background: '#1a2332',
              border: '1px solid #7c3aed',
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '300px',
              width: '100%'
            }}>
              <div style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                📱 iOS Installation
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.8', marginBottom: '20px' }}>
                1. Tap <strong style={{color:'#f1f5f9'}}>Share</strong> (□↑)
                <br/>
                2. Tap <strong style={{color:'#f1f5f9'}}>Add to Home Screen</strong>
                <br/>
                3. Tap <strong style={{color:'#f1f5f9'}}>Add</strong>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                style={{ width: '100%', padding: '12px', background: '#7c3aed', color: 'white', borderRadius: '10px', border: 'none', fontWeight: '600' }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default InstallButton;
