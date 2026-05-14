import { useCallback, useRef, useState, useEffect } from 'react'

const useVoiceNavigation = () => {
  const [isVoiceOn, setIsVoiceOn] = useState(true)
  const [language, setLanguage] = useState('hi-IN') // Default to Hindi as per user preference
  
  // Robust voice finding logic
  const getVoice = (lang) => {
    const voices = window.speechSynthesis.getVoices()
    
    if (lang === 'hi-IN') {
      return voices.find(v => 
        v.lang === 'hi-IN' || 
        v.lang === 'hi' ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('google hindi')
      )
    } else {
      return voices.find(v =>
        v.lang.includes('en-IN') ||
        v.lang.includes('en-GB') ||
        v.lang.includes('en-US') ||
        v.lang.includes('en')
      )
    }
  }

  const speak = useCallback((text, langOverride) => {
    if (!isVoiceOn) return
    if (!window.speechSynthesis) {
      console.log('Speech not supported')
      return
    }
    
    const targetLang = langOverride || language
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = targetLang
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    const voice = getVoice(targetLang)
    if (voice) {
      utterance.voice = voice
    }
    
    // Handle late-loading voices
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = getVoice(targetLang)
        if (v) utterance.voice = v
        window.speechSynthesis.speak(utterance)
      }
    } else {
      window.speechSynthesis.speak(utterance)
    }
    
  }, [isVoiceOn, language])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  const toggleVoice = useCallback(() => {
    setIsVoiceOn(prev => !prev)
    window.speechSynthesis?.cancel()
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => 
      prev === 'hi-IN' ? 'en-IN' : 'hi-IN'
    )
  }, [])

  const isSupported = 'speechSynthesis' in window

  return {
    speak,
    stopSpeaking,
    toggleVoice,
    toggleLanguage,
    isVoiceOn,
    language,
    setLanguage,
    isSupported,
    isVoiceEnabled: isVoiceOn,
    setIsVoiceEnabled: setIsVoiceOn
  }
}

export default useVoiceNavigation
export { useVoiceNavigation }
