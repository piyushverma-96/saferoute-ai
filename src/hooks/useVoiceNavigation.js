import { useCallback, useRef, useState } from 'react'

const useVoiceNavigation = () => {
  const [isVoiceOn, setIsVoiceOn] = useState(true)
  const [language, setLanguage] = useState('en')
  const synthRef = useRef(window.speechSynthesis)

  const speak = useCallback((text) => {
    if (!isVoiceOn) return
    if (!window.speechSynthesis) {
      console.log('Speech not supported')
      return
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Small delay needed for mobile Chrome
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices()
      
      if (language === 'hi') {
        const hindiVoice = voices.find(v => 
          v.lang.includes('hi')
        )
        if (hindiVoice) {
          utterance.voice = hindiVoice
        }
      } else {
        const englishVoice = voices.find(v =>
          v.lang.includes('en-IN') ||
          v.lang.includes('en-GB') ||
          v.lang.includes('en')
        )
        if (englishVoice) {
          utterance.voice = englishVoice
        }
      }
      
      utterance.onerror = (e) => {
        console.log('Speech error:', e)
      }
      
      window.speechSynthesis.speak(utterance)
    }, 100)
    
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
      prev === 'en' ? 'hi' : 'en'
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
    isSupported,
    // Provide aliases for backwards compatibility
    isVoiceEnabled: isVoiceOn,
    setIsVoiceEnabled: setIsVoiceOn
  }
}

export default useVoiceNavigation
export { useVoiceNavigation }
