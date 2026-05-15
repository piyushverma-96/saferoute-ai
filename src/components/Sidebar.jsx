import React from 'react';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Search, Sun, Sunset, Moon, Volume2, VolumeX } from 'lucide-react';
import RouteCard from './RouteCard';
import SkeletonCard from './SkeletonCard';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { mockContacts, safeStops } from '../data/mockData';

export default function Sidebar({ 
  startQuery, 
  setStartQuery, 
  endQuery, 
  setEndQuery, 
  travelHour, 
  setTravelHour, 
  routePref,
  setRoutePref,
  onSearch, 
  routes, 
  isLoading, 
  error,
  selectedRoute,
  onRouteSelect,
  userCoords,
  isDetectingLocation,
  locationError,
  gpsAccuracy,
  detectLocation,
  isMobile
}) {
  const { isVoiceEnabled, setIsVoiceEnabled, speak, language, setLanguage, isSupported } = useVoiceNavigation();
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularIndoreLocations = [
    "Rajwada, Indore",
    "Vijay Nagar, Indore", 
    "Palasia, Indore",
    "Sapna Sangeeta, Indore",
    "MG Road, Indore",
    "Bhawarkuan, Indore",
    "Geeta Bhawan, Indore",
    "LIG Colony, Indore",
    "Scheme 54, Indore",
    "Chameli Devi, Indore"
  ];

  useEffect(() => {
    let timeoutId;
    if (endQuery.length >= 3 && showSuggestions && !popularIndoreLocations.includes(endQuery)) {
      timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endQuery)}&format=json&limit=5&countrycodes=in&viewbox=75.5,22.5,76.2,23.0`);
          const data = await res.json();
          setDestinationSuggestions(data.map(d => d.display_name));
        } catch(e) {
          console.error("Autocomplete error", e);
        }
      }, 500);
    } else if (endQuery.length < 3) {
      setDestinationSuggestions(popularIndoreLocations.slice(0, 5));
    }
    return () => clearTimeout(timeoutId);
  }, [endQuery, showSuggestions]);

  const handleDestinationFocus = () => {
    setShowSuggestions(true);
    if (!endQuery || endQuery.length < 3) {
      setDestinationSuggestions(popularIndoreLocations.slice(0, 5));
    }
  };

  const selectSuggestion = (s) => {
    setEndQuery(s);
    setShowSuggestions(false);
  };

  // Voice announcement for night mode
  useEffect(() => {
    if (travelHour >= 19 || travelHour < 5) {
      speak(
        language.startsWith('hi')
        ? "रात का समय है। कृपया रोशनी वाली सड़कों पर रहें और सुरक्षित मार्ग चुनें।"
        : "Night time detected. Please stay on well-lit roads and choose the safest route."
      );
    }
  }, [travelHour, speak]);

  // Voice announcement when routes load
  useEffect(() => {
    if (routes && routes.length > 0) {
      speak(
        language.startsWith('hi')
        ? `${routes.length} रास्ते मिले। सबसे सुरक्षित रास्ता चुन लिया गया है।`
        : `${routes.length} routes found. Safest route selected automatically.`
      );
    }
  }, [routes, language, speak]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (startQuery && endQuery) {
      onSearch(startQuery, endQuery, travelHour, routePref);
      // Select first route by default is handled in AppPage
    }
  };

  const timeOptions = [
    { label: 'Morning', icon: <Sun size={16} />, value: 9 },
    { label: 'Evening', icon: <Sunset size={16} />, value: 18 },
    { label: 'Night', icon: <Moon size={16} />, value: 22 },
  ];

  return (
    <div 
      className="sidebar w-full h-full flex flex-col z-20"
      style={{ background: 'transparent' }}
    >
      
      {/* Input Form Area */}
      <div className="border-b border-brand-border shrink-0" style={{ padding: '12px 16px 8px' }}>
        <div className="mb-3">
          <h2 className="font-bold flex items-center gap-2 mb-1" style={{ fontSize: '16px' }}>
            <span className="w-6 h-6 rounded bg-brand-purple/20 text-brand-purple flex items-center justify-center">
              <Navigation size={14} />
            </span>
            Route Planner
          </h2>
          <p className="text-xs text-brand-text-secondary">AI-Optimized for Safety & Speed</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDetectingLocation ? 'text-brand-purple animate-pulse' : (gpsAccuracy ? 'text-brand-safe' : 'text-brand-text-muted')}`}>
              <MapPin size={16} fill="currentColor" className={!gpsAccuracy && !isDetectingLocation ? "opacity-20" : ""} />
            </div>
            <input 
              type="text" 
              placeholder={isDetectingLocation ? "📍 Detecting location..." : "Starting Location..."}
              value={startQuery}
              onChange={(e) => setStartQuery(e.target.value)}
              disabled={isDetectingLocation}
              style={{ width: '100%', padding: '10px 40px 10px 40px', fontSize: '14px' }}
              className="bg-brand-bg border border-brand-border rounded-lg focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all disabled:opacity-70 disabled:cursor-wait"
            />
            <button 
              type="button"
              onClick={detectLocation}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-purple transition-colors"
              title="Use my current location"
            >
              <Navigation size={16} />
            </button>
            {gpsAccuracy && !locationError && (
              <div className={`text-[11px] mt-1 ml-1 ${gpsAccuracy < 50 ? 'text-brand-safe' : gpsAccuracy <= 200 ? 'text-brand-warning' : 'text-brand-danger'}`}>
                {gpsAccuracy < 50 ? "📍 High accuracy" : gpsAccuracy <= 200 ? "📍 Approximate" : "📍 Low accuracy"}
              </div>
            )}
            {locationError && (
              <div className="text-[11px] mt-1 ml-1 text-brand-text-secondary flex items-center gap-1">
                📍 {locationError}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-danger">
              <MapPin size={16} fill="currentColor" className="opacity-20" />
            </div>
            <input 
              type="text" 
              placeholder="Destination..." 
              value={endQuery}
              onChange={(e) => setEndQuery(e.target.value)}
              onFocus={handleDestinationFocus}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              style={{ width: '100%', padding: '10px 12px 10px 40px', fontSize: '14px' }}
              className="bg-brand-bg border border-brand-border rounded-lg focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
            />
            {showSuggestions && destinationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A2E] border border-brand-purple rounded-lg shadow-xl z-50 overflow-hidden">
                {destinationSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    onClick={() => selectSuggestion(s)}
                    className="px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-purple hover:text-white cursor-pointer border-b border-brand-border/50 last:border-0"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{
              display: 'flex',
              gap: '6px',
              width: '100%',
              marginTop: '8px'
            }}>
              {timeOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setTravelHour(opt.value)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: travelHour === opt.value 
                      ? '2px solid #7C3AED'
                      : '1px solid rgba(255,255,255,0.1)',
                    background: travelHour === opt.value
                      ? 'rgba(124,58,237,0.2)'
                      : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    minWidth: '0',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{fontSize: '18px'}}>
                    {opt.label === 'Morning' ? '☀️' : opt.label === 'Evening' ? '🌆' : '🌙'}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Route Preference Section */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '500' }}>
              🎯 Route Priority
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { key: 'safest', label: 'Safest', icon: '🛡', color: '#10b981' },
                { key: 'balanced', label: 'Balanced', icon: '⚖️', color: '#f59e0b' },
                { key: 'fastest', label: 'Fastest', icon: '⚡', color: '#ef4444' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setRoutePref(opt.key)}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    background: routePref === opt.key ? `${opt.color}22` : '#1a2332',
                    border: `2px solid ${routePref === opt.key ? opt.color : '#2d3748'}`,
                    borderRadius: '10px',
                    color: routePref === opt.key ? opt.color : '#64748b',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '18px' }}>{opt.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', marginTop: '4px' }}>{opt.label}</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: '8px', padding: '8px 10px', background: '#1a2332', borderRadius: '8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
              {routePref === 'safest' && '🛡 Longest but safest path — well lit streets, CCTV, police nearby'}
              {routePref === 'balanced' && '⚖️ Good balance of safety and travel time'}
              {routePref === 'fastest' && '⚡ Quickest route — safety not prioritized'}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              type="submit"
              disabled={isLoading || !startQuery || !endQuery}
              style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              className="flex-1 bg-gradient-brand rounded-xl font-bold shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
            >
              {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
              ) : (
                <Search size={16} />
              )}
              {isLoading ? 'Calculating...' : 'Find Safe Routes'}
            </button>
            
            {isSupported && (
              <>
                <button
                  type="button"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  title={isVoiceEnabled ? "Voice ON" : "Voice OFF"}
                  className={`px-3 rounded-xl border transition-all flex items-center justify-center ${
                    isVoiceEnabled 
                      ? 'border-brand-safe bg-brand-safe/10 text-brand-safe shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                      : 'border-brand-border bg-brand-surface text-brand-text-muted'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'hi-IN' ? 'en-IN' : 'hi-IN')}
                  title={language === 'hi-IN' ? "Switch to English" : "Switch to Hindi"}
                  className="px-3 rounded-xl border border-brand-border bg-brand-surface text-lg hover:bg-brand-bg transition-all flex items-center justify-center gap-1"
                >
                  {language === 'hi-IN' ? '🇮🇳 Hindi' : '🇬🇧 English'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Routes List Area */}
      {routes.length > 0 && (
        <div style={{ padding: '0 16px' }}>
          <p style={{
            color: '#888',
            fontSize: '11px',
            marginBottom: '8px',
            marginTop: '12px',
            textTransform: 'uppercase'
          }}>
            🛡 Route Options ({routes.length})
          </p>
          
          <div style={{
            maxHeight: '35vh',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#7C3AED transparent',
            paddingRight: '4px'
          }}>
            {routes.map(route => (
              <RouteCard
                key={route.id}
                route={route}
                selected={
                  selectedRoute?.id === route.id
                }
                onSelect={(r) => onRouteSelect(r)}
                travelTime={travelHour >= 19 || travelHour < 6 ? 'night' : travelHour >= 17 ? 'evening' : 'day'}
              />
            ))}
          </div>

          {selectedRoute !== null && (
            <div style={{
              marginTop: '16px',
              background: '#1a2332',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid #1e293b'
            }}>
              
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🛡 Safe Stops On Your Route
                <span style={{
                  background: '#7c3aed',
                  color: 'white',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {(() => {
                    const routeIndex = routes.findIndex(r => r.id === selectedRoute.id);
                    if (routeIndex === 0) return 3;
                    if (routeIndex === 1) return 2;
                    if (routeIndex === 2) return 1;
                    return 0;
                  })()} online
                </span>
              </div>

              {/* Route visualization */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '14px',
                padding: '8px',
                background: '#0f1724',
                borderRadius: '8px'
              }}>
                {/* Start */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981',
                  flexShrink: 0
                }}/>
                
                {/* Route line with stops */}
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: '#1e293b',
                  position: 'relative',
                  margin: '0 4px'
                }}>
                  {safeStops.map((stop, i) => {
                    const routeIndex = routes.findIndex(r => r.id === selectedRoute.id);
                    let isOnline = stop.isOnline;
                    if (routeIndex === 0) isOnline = true;
                    if (routeIndex === 1) isOnline = (i < 2);
                    if (routeIndex === 2) isOnline = (i < 1);
                    return (
                      <div key={i} style={{
                        position: 'absolute',
                        left: `${stop.position * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%,-50%)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isOnline ? '#10b981' : '#374151',
                        border: '2px solid #0f1724',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}>
                        {stop.avatar}
                      </div>
                    );
                  })}
                </div>
                
                {/* End */}
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  flexShrink: 0
                }}/>
              </div>

              {/* Stops list (Desktop) or Horizontal Scroll (Mobile) */}
              {!isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {safeStops.map((stop, i) => {
                    const routeIndex = routes.findIndex(r => r.id === selectedRoute.id);
                    let isOnline = stop.isOnline;
                    if (routeIndex === 0) isOnline = true;
                    if (routeIndex === 1) isOnline = (i < 2);
                    if (routeIndex === 2) isOnline = (i < 1);
                    return (
                      <div key={stop.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        background: '#0f1724',
                        borderRadius: '10px',
                        border: `1px solid ${isOnline ? 'rgba(16,185,129,0.2)' : '#1e293b'}`
                      }}>
                        {/* Stop number */}
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: '#7c3aed',
                          color: 'white',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>{i + 1}</div>

                        {/* Avatar */}
                        <div style={{ fontSize: '22px', flexShrink: 0 }}>{stop.avatar}</div>

                        {/* Info */}
                        <div style={{flex: 1}}>
                          <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: '500' }}>{stop.name}</div>
                          <div style={{ color: '#64748b', fontSize: '11px' }}>📍 {stop.address}</div>
                          <div style={{ color: isOnline ? '#10b981' : '#64748b', fontSize: '10px', marginTop: '1px' }}>
                            {isOnline ? '🟢 Safe to stop here' : '⚫ Offline'}
                          </div>
                        </div>

                        {/* Call button */}
                        <a href={`tel:${stop.phone}`} style={{
                          background: isOnline ? 'rgba(16,185,129,0.15)' : '#1e293b',
                          border: `1px solid ${isOnline ? '#10b981' : '#374151'}`,
                          borderRadius: '8px',
                          padding: '8px 10px',
                          color: isOnline ? '#10b981' : '#64748b',
                          fontSize: '14px',
                          textDecoration: 'none',
                          flexShrink: 0
                        }}>📞</a>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  marginTop: '10px',
                  borderTop: '1px solid #1e293b',
                  paddingTop: '10px'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                    🛡 Safe Stops On Route
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '4px',
                    scrollbarWidth: 'none'
                  }}>
                    {safeStops.map((stop, i) => {
                      const routeIndex = routes.findIndex(r => r.id === selectedRoute.id);
                      let isOnline = stop.isOnline;
                      if (routeIndex === 0) isOnline = true;
                      if (routeIndex === 1) isOnline = (i < 2);
                      if (routeIndex === 2) isOnline = (i < 1);
                      return (
                        <div key={i} style={{
                          flexShrink: 0,
                          background: '#1a2332',
                          border: `1px solid ${isOnline ? '#10b981' : '#1e293b'}`,
                          borderRadius: '10px',
                          padding: '10px 12px',
                          minWidth: '100px',
                          textAlign: 'center'
                        }}>
                          <div style={{fontSize: '22px'}}>{stop.avatar}</div>
                          <div style={{ color: '#f1f5f9', fontSize: '11px', fontWeight: '500', margin: '4px 0 2px' }}>
                            {stop.name}
                          </div>
                          <div style={{ color: isOnline ? '#10b981' : '#64748b', fontSize: '9px', marginBottom: '6px' }}>
                            {isOnline ? '🟢 Online' : '⚫ Offline'}
                          </div>
                          <a href={`tel:${stop.phone}`} style={{
                            display: 'block',
                            background: 'rgba(124,58,237,0.2)',
                            border: '1px solid #7c3aed',
                            borderRadius: '6px',
                            padding: '4px',
                            color: '#a78bfa',
                            fontSize: '12px',
                            textDecoration: 'none'
                          }}>📞 Call</a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Safety tip */}
              <div style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid #7c3aed',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '11px',
                color: '#a78bfa',
                textAlign: 'center',
                marginTop: '4px'
              }}>
                💡 Tap any stop on map to call or message your contact
              </div>
            </div>
          )}
        </div>
      )}
      
      {isLoading && (
        <div style={{ padding: '16px' }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      
      {error && (
        <div className="m-4 p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
