import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Shield, PhoneCall, AlertTriangle, Link as LinkIcon, Menu, X, Navigation } from 'lucide-react';
import { showToast } from '../components/Toast';

// Component to auto-center map when location updates
function MapFollower({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.panTo([location.lat, location.lng], { animate: true });
    }
  }, [location, map]);
  return null;
}

export default function TrackingPage() {
  const { userId } = useParams();
  
  // State
  const [pin, setPin] = useState(['', '', '', '']);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [location, setLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [signalLost, setSignalLost] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);

  // Refs
  const wsRef = useRef(null);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // --- Voice Utilities ---
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Voice announcement on unlock
  useEffect(() => {
    if (isUnlocked) {
      speak("Live location tracking active. You are now monitoring a SafeRoute AI user.");
    }
  }, [isUnlocked, speak]);

  // Voice announcement on signal lost
  useEffect(() => {
    if (isUnlocked && signalLost) {
      speak("Warning. Location signal lost. Please contact emergency services if concerned.");
    }
  }, [signalLost, isUnlocked, speak]);

  // --- PIN Logic ---
  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1);
    setPin(newPin);

    // Auto advance
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto submit if 4 digits
    if (index === 3 && value) {
      validatePin([...newPin.slice(0, 3), value].join(''));
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const validatePin = (enteredPin) => {
    const validPin = localStorage.getItem(`sos_pin_${userId}`) || '1234'; // Fallback
    if (enteredPin === validPin) {
      setIsUnlocked(true);
    } else {
      setError("Incorrect PIN. Try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
    }
  };

  const handleDemoAccess = () => {
    setIsUnlocked(true);
  };

  // --- WebSocket & Demo Mode Logic ---
  const startDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setWsConnected(false);
    
    let lat = 22.7196;
    let lng = 75.8577;
    
    const interval = setInterval(() => {
      lat += (Math.random() - 0.5) * 0.0008;
      lng += (Math.random() - 0.5) * 0.0008;
      
      setLocation({ lat, lng });
      setLastUpdated(Date.now());
      setSignalLost(false);
    }, 3000);
    
    setLocation({ lat, lng });
    setLastUpdated(Date.now());
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;

    let ws;
    let demoCleanup;
    try {
      ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8080');
      wsRef.current = ws;
      
      ws.onopen = () => {
        setWsConnected(true);
        setIsDemoMode(false);
        ws.send(JSON.stringify({ type: 'SUBSCRIBE', userId: userId }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'LOCATION_UPDATE' && data.userId === userId) {
            setLocation({ lat: data.lat, lng: data.lng });
            setLastUpdated(Date.now());
            setSignalLost(false);
          }
          if (data.type === 'SOS_STOPPED' && data.userId === userId) {
            setSignalLost(true);
          }
        } catch (err) {}
      };
      
      ws.onerror = () => {
        demoCleanup = startDemoMode();
      };
      
      ws.onclose = () => {
        setWsConnected(false);
        demoCleanup = startDemoMode();
      };
    } catch(e) {
      demoCleanup = startDemoMode();
    }
    
    return () => {
      ws?.close();
      if (demoCleanup) demoCleanup();
    };
  }, [userId, isUnlocked, startDemoMode]);

  // --- Timers ---
  useEffect(() => {
    if (!lastUpdated) return;
    const timer = setInterval(() => {
      const diff = (Date.now() - lastUpdated) / 1000;
      if (diff > 30) setSignalLost(true);
    }, 5000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdated) {
        setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast({
      type: "Link copied!",
      location: "Share with emergency contacts",
      severity: "low"
    });
  };

  // Render PIN Screen
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-danger/20 text-brand-danger shadow-[0_0_30px_rgba(239,68,68,0.3)] mb-6 animate-pulse">
            <Shield size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Live Location Access</h1>
          <p className="text-brand-text-secondary mb-8">Enter PIN to track {userId}'s location</p>
          
          <div className={`bg-[#12121A] rounded-2xl p-8 border border-brand-purple/30 shadow-[0_0_25px_rgba(124,58,237,0.15)] ${shake ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
            <div className="flex justify-center gap-3 mb-4">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={inputRefs[i]}
                  type="password"
                  inputMode="numeric"
                  value={digit ? '●' : ''}
                  onChange={(e) => handlePinChange(i, e.target.value.replace('●', ''))}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  className="w-14 h-14 text-center text-2xl font-bold bg-[#1A1A24] border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple focus:shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all"
                  maxLength={2}
                />
              ))}
            </div>
            
            <div className="h-6">
              {error && <p className="text-brand-danger text-sm font-medium">{error}</p>}
            </div>
            
            <div className="mt-8 pt-6 border-t border-brand-border">
              <button 
                onClick={handleDemoAccess}
                className="w-full py-3 border border-dashed border-brand-border hover:border-brand-purple bg-transparent text-brand-text-primary rounded-xl transition-all flex justify-center items-center gap-2 text-sm"
              >
                🎯 Demo Access (Skip PIN)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Custom marker icon
  const pulsingIcon = L.divIcon({
    className: 'custom-pulsing-marker',
    html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
        <div style="position:absolute; width:40px; height:40px; background-color:#3B82F6; opacity:0.4; border-radius:50%; animation:pulse-marker 1.5s infinite;"></div>
        <div style="position:absolute; width:20px; height:20px; background-color:#3B82F6; border-radius:50%; border:2px solid white; z-index:2; box-shadow:0 0 10px rgba(59,130,246,0.8);"></div>
      </div>
      <style>
        @keyframes pulse-marker {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      </style>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });

  // Render Tracking Map Screen
  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden bg-black">
      
      {/* Top Bar */}
      <div className="w-full bg-[#8B0000] text-white py-3 px-4 flex justify-between items-center z-[1000] shadow-md border-b border-red-900">
        <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400"></span>
          </span>
          <span className="uppercase tracking-wider truncate max-w-[120px] sm:max-w-none">🔴 LIVE • {userId} sharing</span>
        </div>
        
        <div className="text-xs sm:text-sm font-medium">
          {secondsAgo <= 5 ? (
            <span className="text-green-300">Just now</span>
          ) : secondsAgo <= 30 ? (
            <span className={secondsAgo <= 15 ? 'text-green-300' : 'text-amber-300'}>
              Last updated: {secondsAgo}s ago
            </span>
          ) : (
            <span className="text-red-300 font-bold">Signal lost</span>
          )}
        </div>
      </div>
      
      {/* Signal Lost Warning */}
      {signalLost && (
        <div className="w-full bg-amber-500 text-amber-950 font-bold text-sm py-2 px-4 flex items-center justify-center gap-2 z-[999] shadow-md">
          <AlertTriangle size={16} />
          ⚠ Location signal lost. Last seen {secondsAgo}s ago.
        </div>
      )}

      {/* Demo Badge */}
      {isDemoMode && (
        <div className="absolute top-16 left-4 z-[900] bg-[#12121A] border border-brand-warning rounded-lg p-3 shadow-lg max-w-[200px]">
          <h4 className="text-brand-warning font-bold text-sm flex items-center gap-1"><AlertTriangle size={14} /> ⚡ DEMO MODE</h4>
          <p className="text-xs text-brand-text-secondary mt-1">Simulated location — Real GPS in production</p>
        </div>
      )}

      {/* Emergency Quick Actions (Right Floating) */}
      <div className={`absolute top-24 right-4 z-[900] flex flex-col items-end gap-3 transition-transform duration-300 ${!showEmergencyMenu ? 'translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        <button 
          onClick={() => setShowEmergencyMenu(!showEmergencyMenu)}
          className="md:hidden flex items-center justify-center w-10 h-10 bg-brand-surface border border-brand-border rounded-full shadow-lg text-brand-text-primary absolute -left-14 top-0"
        >
          {showEmergencyMenu ? <X size={20} /> : <PhoneCall size={20} className="text-brand-danger" />}
        </button>

        <a href="tel:100" className="flex items-center gap-3 bg-[#12121A] border border-brand-border border-l-4 border-l-[#3B82F6] p-3 rounded-lg shadow-lg w-48 hover:bg-[#1A1A24] transition-colors">
          <div className="bg-[#3B82F6]/20 p-2 rounded-full text-[#3B82F6]"><Shield size={16} /></div>
          <div><div className="font-bold text-sm text-white">Police</div><div className="text-xs text-[#3B82F6] font-mono">100</div></div>
        </a>
        <a href="tel:108" className="flex items-center gap-3 bg-[#12121A] border border-brand-border border-l-4 border-l-[#EF4444] p-3 rounded-lg shadow-lg w-48 hover:bg-[#1A1A24] transition-colors">
          <div className="bg-[#EF4444]/20 p-2 rounded-full text-[#EF4444]"><PhoneCall size={16} /></div>
          <div><div className="font-bold text-sm text-white">Ambulance</div><div className="text-xs text-[#EF4444] font-mono">108</div></div>
        </a>
        <a href="tel:1091" className="flex items-center gap-3 bg-[#12121A] border border-brand-border border-l-4 border-l-[#A855F7] p-3 rounded-lg shadow-lg w-48 hover:bg-[#1A1A24] transition-colors">
          <div className="bg-[#A855F7]/20 p-2 rounded-full text-[#A855F7]"><PhoneCall size={16} /></div>
          <div><div className="font-bold text-sm text-white">Women Helpline</div><div className="text-xs text-[#A855F7] font-mono">1091</div></div>
        </a>
      </div>

      {/* Share Button */}
      <button 
        onClick={handleShare}
        className="absolute bottom-24 right-4 z-[900] bg-brand-surface border border-brand-purple text-brand-purple px-4 py-2 rounded-full shadow-lg hover:bg-brand-purple hover:text-white transition-all flex items-center gap-2 text-sm font-bold"
      >
        <LinkIcon size={16} /> Share Link
      </button>

      {/* Map Container */}
      <div className="flex-1 w-full relative z-0">
        {location ? (
          <MapContainer 
            center={[location.lat, location.lng]} 
            zoom={16} 
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            <Marker position={[location.lat, location.lng]} icon={pulsingIcon}>
              <Popup className="dark-popup">
                <div className="text-center">
                  <div className="font-bold mb-1">📍 {userId}'s Location</div>
                  <div className="text-xs font-mono text-brand-text-muted mb-1">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-brand-purple font-medium">
                    Updated: {secondsAgo}s ago
                  </div>
                </div>
              </Popup>
            </Marker>
            <MapFollower location={location} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#12121A]">
            <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-brand-text-secondary font-medium">Acquiring live location...</p>
          </div>
        )}
      </div>

      {/* Bottom Info Panel */}
      <div className="w-full bg-[#12121A] border-t border-brand-border p-4 z-[1000] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-purple/20 text-brand-purple rounded-lg">
              <Navigation size={20} />
            </div>
            <div>
              <div className="text-xs text-brand-text-secondary font-medium uppercase tracking-wider mb-1">Current Coordinates</div>
              <div className="text-sm font-mono font-bold text-white">
                {location ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E` : '--'}
              </div>
            </div>
          </div>
          
          <div className="hidden md:block text-center flex-1">
            <div className="text-xs text-brand-text-secondary font-medium uppercase mb-1">Distance</div>
            <div className="text-sm font-bold text-brand-text-primary">
              <span className="text-brand-safe">Active Tracking</span>
            </div>
          </div>
          
          <a 
            href="tel:100"
            className="w-full sm:w-auto px-6 py-3 bg-brand-danger text-white font-bold rounded-xl shadow-lg shadow-brand-danger/20 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <PhoneCall size={18} /> Call Emergency
          </a>
        </div>
      </div>
    </div>
  );
}
