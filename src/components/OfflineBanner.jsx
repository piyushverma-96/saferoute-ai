import React from 'react';
import { useEffect, useState } from 'react';
import { WifiOff, CheckCircle } from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export default function OfflineBanner() {
  const { isOffline, wasOffline, resetWasOffline } = useOfflineStatus();
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    if (!isOffline && wasOffline) {
      setShowOnlineToast(true);
      const timer = setTimeout(() => {
        setShowOnlineToast(false);
        resetWasOffline();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline, resetWasOffline]);

  if (isOffline) {
    return (
      <div className="bg-brand-danger text-white px-4 py-2 text-sm flex items-center justify-center gap-2 z-[100] relative shadow-md">
        <WifiOff size={16} className="animate-pulse" />
        <span className="font-semibold">No internet connection — Running in offline mode. Cached routes and map tiles available.</span>
      </div>
    );
  }

  if (showOnlineToast) {
    return (
      <div className="bg-brand-safe text-white px-4 py-2 text-sm flex items-center justify-center gap-2 z-[100] relative shadow-md animate-in slide-in-from-top fade-in duration-300">
        <CheckCircle size={16} />
        <span className="font-semibold">Back online — Live data restored</span>
      </div>
    );
  }

  return null;
}
