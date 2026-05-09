import React from 'react';
import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { speak } = useVoiceNavigation();

  useEffect(() => {
    // Check if already installed or dismissed recently
    const isInstalled = localStorage.getItem('app_installed') === 'true';
    const lastDismissed = localStorage.getItem('install_dismissed');
    
    if (isInstalled) return;
    
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
    
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    // Standard PWA install prompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Listen for successful installation
  useEffect(() => {
    const handleAppInstalled = () => {
      localStorage.setItem('app_installed', 'true');
      localStorage.setItem('install_timestamp', Date.now().toString());
      setShowPrompt(false);
      speak("SafeRoute AI installed successfully. You can now use it offline.", "सेफ रूट एआई सफलतापूर्वक इंस्टॉल हो गया है। अब आप इसे ऑफ़लाइन उपयोग कर सकते हैं।");
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, [speak]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('install_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] p-4 flex justify-center animate-in slide-in-from-bottom duration-500">
      <div className="bg-brand-surface border border-brand-purple rounded-xl shadow-2xl p-4 w-full max-w-md relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-brand-text-muted hover:text-white"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shrink-0">
            <img src="/pwa-icon.svg" alt="App Icon" className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">Install SafeRoute AI</h3>
            <p className="text-xs text-brand-text-secondary mt-1">Works offline • Fast • No app store needed</p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-brand-bg rounded-lg p-3 text-sm text-center text-brand-text-secondary">
            Tap <span className="font-bold text-blue-400">Share</span> then <span className="font-bold text-white">Add to Home Screen</span>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <button 
              onClick={handleDismiss}
              className="flex-1 py-2 text-sm font-semibold text-brand-text-muted hover:text-white transition-colors"
            >
              Maybe Later
            </button>
            <button 
              onClick={handleInstall}
              className="flex-[2] bg-gradient-brand py-2 rounded-lg text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Install Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
