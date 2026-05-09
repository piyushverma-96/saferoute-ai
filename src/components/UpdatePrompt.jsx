import React from 'react';
import { RefreshCw } from 'lucide-react';
// We use dynamic import for virtual:pwa-register/react because it's only available after vite-plugin-pwa is configured
import { useEffect, useState } from 'react';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

export default function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateFunction, setUpdateFunction] = useState(null);
  const { speak } = useVoiceNavigation();

  useEffect(() => {
    const initPWA = async () => {
      try {
        const { useRegisterSW } = await import('virtual:pwa-register/react');
        // This inside the effect is a bit tricky, but useRegisterSW is a hook.
        // Actually, it's safer to just register the SW manually if we don't want to break hook rules.
        // But since this is a component, we can extract it or use the vanilla JS API.
      } catch (err) {
        console.warn('PWA plugin not fully initialized yet.', err);
      }
    };
    initPWA();
  }, []);

  // Using vanilla JS registerSW instead of the React hook to avoid dynamic import hook rule violations
  useEffect(() => {
    const setupVanillaSW = async () => {
      try {
        const { registerSW } = await import('virtual:pwa-register');
        const updateSW = registerSW({
          onNeedRefresh() {
            setNeedRefresh(true);
            setUpdateFunction(() => updateSW);
            speak(
              "SafeRoute AI has been updated. Tap to reload for latest safety data.",
              "सेफ रूट एआई अपडेट हो गया है। नवीनतम सुरक्षा डेटा के लिए रीलोड करें।"
            );
          },
          onOfflineReady() {
            console.log('App ready to work offline');
          },
        });
      } catch (e) {
        // ignore in dev
      }
    };
    setupVanillaSW();
  }, [speak]);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80">
      <div className="bg-brand-surface border border-brand-purple rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-brand-purple/20 text-brand-purple rounded-lg">
            <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Update Available!</h3>
            <p className="text-xs text-brand-text-secondary mt-0.5">A new version of SafeRoute is ready.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setNeedRefresh(false)}
            className="flex-1 py-2 text-xs font-semibold text-brand-text-muted hover:text-white transition-colors border border-brand-border rounded-lg"
          >
            Dismiss
          </button>
          <button 
            onClick={() => updateFunction && updateFunction(true)}
            className="flex-1 bg-brand-purple py-2 rounded-lg text-xs font-bold text-white hover:bg-brand-purple/90 transition-colors shadow-lg shadow-brand-purple/20"
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}
