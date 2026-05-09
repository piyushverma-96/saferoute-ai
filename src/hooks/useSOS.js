import { useState, useCallback } from 'react';

export function useSOS() {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);

  const toggleSOS = useCallback(() => {
    setIsSOSActive(prev => !prev);
  }, []);

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
