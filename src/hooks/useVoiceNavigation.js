import { useState, useCallback, useEffect } from 'react';

export function useVoiceNavigation() {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    const cached = localStorage.getItem('voice_enabled');
    return cached !== null ? JSON.parse(cached) : true;
  });
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('voice_language') || 'en-IN';
  });

  const isSupported = 'speechSynthesis' in window;

  // Persist settings
  useEffect(() => {
    localStorage.setItem('voice_enabled', JSON.stringify(isVoiceEnabled));
  }, [isVoiceEnabled]);

  useEffect(() => {
    localStorage.setItem('voice_language', language);
  }, [language]);

  // Pre-load voices for offline
  useEffect(() => {
    if (isSupported) {
      // Chrome requires this to pre-load voices before first use
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.getVoices(); // initial fetch
    }
  }, [isSupported]);

  // Welcome back greeting if app is installed
  useEffect(() => {
    const isInstalled = localStorage.getItem('app_installed') === 'true';
    const hasGreeted = sessionStorage.getItem('has_greeted') === 'true';
    
    if (isInstalled && !hasGreeted && isSupported && isVoiceEnabled) {
      setTimeout(() => {
        speak(
          "Welcome back to SafeRoute AI. You are protected.",
          "सेफ रूट एआई में आपकी वापसी का स्वागत है। आप सुरक्षित हैं।"
        );
        sessionStorage.setItem('has_greeted', 'true');
      }, 1000);
    }
  }, [isSupported, isVoiceEnabled, language]); // Added dependencies

  const speak = useCallback((englishText, hindiText) => {
    if (!isSupported || !isVoiceEnabled) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const textToSpeak = language === 'hi-IN' ? (hindiText || englishText) : englishText;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
  }, [isSupported, isVoiceEnabled, language]);

  const stopSpeaking = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSupported]);

  // Check battery status
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const checkBattery = () => {
          if (battery.level < 0.2 && !battery.charging) {
            speak(
              "Warning. Battery low. Please save your location now.",
              "चेतावनी। बैटरी कम है। कृपया अपनी लोकेशन तुरंत सेव करें।"
            );
          }
        };

        checkBattery();
        battery.addEventListener('levelchange', checkBattery);

        return () => {
          battery.removeEventListener('levelchange', checkBattery);
        };
      });
    }
  }, [speak]);

  return {
    isVoiceEnabled,
    setIsVoiceEnabled,
    language,
    setLanguage,
    speak,
    stopSpeaking,
    isSupported
  };
}
