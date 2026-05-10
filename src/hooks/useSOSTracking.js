import { useState, useCallback, useRef, useEffect } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export function useSOSTracking(userId) {
  const [isTracking, setIsTracking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [trackingPin, setTrackingPin] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const ws = useRef(null);
  const watchId = useRef(null);
  const mockInterval = useRef(null);

  useEffect(() => {
    // Attempt to connect to WebSocket
    ws.current = new WebSocket(WS_URL);
    
    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onerror = () => setIsConnected(false);

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const sendSMSFallback = (lat, lng) => {
    const link = `${import.meta.env.VITE_API_URL || 'http://localhost:5173'}/track/${userId}`;
    const message = `SOS! I need help. My location: ${lat.toFixed(4)},${lng.toFixed(4)} Track me: ${link}`;
    window.open(`sms:100?body=${encodeURIComponent(message)}`);
  };

  const startTracking = useCallback(() => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setTrackingPin(pin);
    setIsTracking(true);

    // Save PIN and ID to localStorage
    localStorage.setItem(`sos_pin_${userId}`, pin);
    localStorage.setItem('sos_active_userId', userId);
    
    console.log('=== SOS ACTIVATED ===');
    console.log('userId:', userId);
    console.log('PIN:', pin);
    console.log('Tracking URL:', `${window.location.origin}/track/${userId}`);
    console.log('PIN saved in localStorage as:', `sos_pin_${userId}`);

    const handleLocationUpdate = (lat, lng) => {
      setCurrentLocation({ lat, lng });
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'UPDATE_LOCATION',
          userId: userId,
          lat: lat,
          lng: lng,
          timestamp: Date.now()
        }));
        console.log('Location sent:', lat, lng, 'for userId:', userId);
      }
    };

    const initializeTracking = (initialLat, initialLng) => {
      setCurrentLocation({ lat: initialLat, lng: initialLng });
      
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'START_SOS',
          userId,
          lat: initialLat,
          lng: initialLng,
          name: 'User',
          pin
        }));
      } else {
        // WebSocket failed, trigger SMS fallback
        sendSMSFallback(initialLat, initialLng);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          initializeTracking(latitude, longitude);

          // Watch position
          watchId.current = navigator.geolocation.watchPosition(
            (pos) => handleLocationUpdate(pos.coords.latitude, pos.coords.longitude),
            (err) => console.error('GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
          );
        },
        (error) => {
          console.error('Geolocation denied or failed, using mock mode.', error);
          startMockTracking(initializeTracking, handleLocationUpdate);
        }
      );
    } else {
      startMockTracking(initializeTracking, handleLocationUpdate);
    }
  }, [userId]);

  const startMockTracking = (initFn, updateFn) => {
    let lat = 20.5937;
    let lng = 78.9629;
    initFn(lat, lng);
    
    mockInterval.current = setInterval(() => {
      lat += 0.0001; // simulate movement
      updateFn(lat, lng);
    }, 3000);
  };

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    setTrackingPin(null);
    setCurrentLocation(null);

    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (mockInterval.current) {
      clearInterval(mockInterval.current);
      mockInterval.current = null;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'STOP_SOS', userId }));
    }
  }, [userId]);

  return {
    isTracking,
    isConnected,
    trackingPin,
    currentLocation,
    startTracking,
    stopTracking
  };
}
