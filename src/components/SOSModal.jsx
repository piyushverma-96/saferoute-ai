import React from 'react';
import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MapPin, X, Copy, Check, Radio } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import { useSOSTracking } from '../hooks/useSOSTracking';

export default function SOSModal({ isOpen, onClose, userId }) {
  const [countdown, setCountdown] = useState(null);
  const [copied, setCopied] = useState(false);
  const { isTracking, isConnected, trackingPin, currentLocation, startTracking, stopTracking } = useSOSTracking(userId);

  useEffect(() => {
    let timer;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      startTracking();
      setCountdown(null);
    }
    return () => clearTimeout(timer);
  }, [countdown, startTracking]);

  if (!isOpen) return null;

  const handleStartShare = () => {
    setCountdown(3);
  };

  const handleCancelShare = () => {
    setCountdown(null);
  };

  const handleStopShare = () => {
    stopTracking();
    setCountdown(null);
  };

  const trackingLink = `${import.meta.env.VITE_API_URL || 'http://localhost:5173'}/track/${userId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`SOS! I need immediate help. I've activated my emergency alarm. Track my live location here: ${trackingLink} (PIN: ${trackingPin})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-brand-surface border border-brand-danger/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-brand-danger/10 p-5 border-b border-brand-danger/20 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-3 text-brand-danger">
            <div className={`p-2 bg-brand-danger/20 rounded-full ${isTracking ? 'animate-pulse' : ''}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Emergency Help</h2>
              <p className="text-sm text-brand-danger/80">Stay calm. Help is available.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-6 overflow-y-auto">
          
          <div className="space-y-3">
            <h3 className="label-text">Quick Dial</h3>
            <div className="grid grid-cols-3 gap-2">
              <a href="tel:100" className="flex flex-col items-center justify-center p-3 bg-brand-bg hover:bg-brand-card border border-brand-border rounded-xl transition-colors">
                <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg mb-2"><Phone size={18} /></div>
                <div className="font-bold">Police</div>
                <div className="text-xs text-brand-text-muted">100</div>
              </a>
              <a href="tel:1091" className="flex flex-col items-center justify-center p-3 bg-brand-bg hover:bg-brand-card border border-brand-border rounded-xl transition-colors">
                <div className="p-2 bg-pink-500/20 text-pink-500 rounded-lg mb-2"><Phone size={18} /></div>
                <div className="font-bold">Women</div>
                <div className="text-xs text-brand-text-muted">1091</div>
              </a>
              <a href="tel:108" className="flex flex-col items-center justify-center p-3 bg-brand-bg hover:bg-brand-card border border-brand-border rounded-xl transition-colors">
                <div className="p-2 bg-red-500/20 text-red-500 rounded-lg mb-2"><Phone size={18} /></div>
                <div className="font-bold">Medical</div>
                <div className="text-xs text-brand-text-muted">108</div>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border">
            <h3 className="label-text mb-3">Live Location Tracking</h3>
            
            {countdown !== null ? (
              <div className="text-center py-6 bg-brand-bg rounded-xl border border-brand-danger/30">
                <div className="text-4xl font-black text-brand-danger mb-2">{countdown}</div>
                <p className="text-sm text-brand-text-secondary mb-4">SOS activating...</p>
                <button 
                  onClick={handleCancelShare}
                  className="px-6 py-2 bg-brand-surface border border-brand-border rounded-lg text-sm hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : isTracking ? (
              <div className="space-y-4">
                <div className="p-4 bg-brand-safe/10 border border-brand-safe/30 rounded-xl">
                  <div className="flex items-center gap-2 text-brand-safe font-bold mb-2">
                    <Radio size={18} className="animate-pulse" />
                    Sharing Live Location
                  </div>
                  
                  {currentLocation && (
                    <div className="text-xs font-mono text-brand-text-secondary mb-3">
                      📍 {currentLocation.lat.toFixed(4)}° N, {currentLocation.lng.toFixed(4)}° E — Updating...
                    </div>
                  )}

                  {!isConnected && (
                    <div className="text-xs text-brand-warning bg-brand-warning/10 p-2 rounded mb-3">
                      ⚠ DEMO MODE - Simulated Tracking (WS Disconnected)
                    </div>
                  )}

                  <div className="bg-brand-bg p-3 rounded-lg border border-brand-border mb-3">
                    <div className="text-xs text-brand-text-muted mb-1">Tracking Link:</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 text-sm text-brand-text-primary truncate">{trackingLink}</div>
                      <button onClick={handleCopy} className="p-1.5 hover:bg-brand-surface rounded text-brand-purple transition-colors">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-brand-text-muted">
                      Tracking PIN: <span className="font-bold text-white bg-brand-surface px-1 py-0.5 rounded tracking-widest">{trackingPin}</span>
                    </div>
                  </div>

                  {currentLocation && (
                    <div className="h-[150px] w-full rounded-lg overflow-hidden border border-brand-border z-0 relative">
                      <MapContainer 
                        center={[currentLocation.lat, currentLocation.lng]} 
                        zoom={16} 
                        style={{ width: '100%', height: '100%' }}
                        zoomControl={false}
                        dragging={false}
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <CircleMarker
                          center={[currentLocation.lat, currentLocation.lng]}
                          radius={8}
                          pathOptions={{ color: 'var(--color-brand-safe)', fillColor: 'var(--color-brand-safe)', fillOpacity: 0.5 }}
                        />
                      </MapContainer>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleStopShare}
                  className="w-full py-3 bg-brand-surface border border-brand-border text-brand-text-secondary hover:text-white rounded-xl transition-colors font-semibold"
                >
                  Stop Sharing Location
                </button>
              </div>
            ) : (
              <div>
                <button 
                  onClick={handleStartShare}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all bg-brand-danger text-white hover:bg-red-600 shadow-lg shadow-brand-danger/20 hover:shadow-brand-danger/40 animate-pulse"
                >
                  <MapPin size={20} />
                  Share Live Location Now
                </button>
                <p className="text-xs text-center text-brand-text-secondary mt-3 px-4">
                  Generates a secure tracking link and streams your GPS location to emergency contacts.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
