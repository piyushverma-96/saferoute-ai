import { useState, useCallback } from 'react';
import { useVoiceNavigation } from './useVoiceNavigation';

export function useSOS() {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);
  const { speak } = useVoiceNavigation();

  const toggleSOS = useCallback(() => {
    setIsSOSActive(prev => {
      const newState = !prev;
      if (newState) {
        speak('SOS activated. Sharing live location now. Help is on the way.');
      }
      return newState;
    });
  }, [speak]);

  const closeSOS = useCallback(() => {
    setIsSOSActive(false);
  }, []);

  return { 
    isSOSActive, 
    toggleSOS, 
    closeSOS,
    userId
  };
}
