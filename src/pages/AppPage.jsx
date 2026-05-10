import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MapView from '../components/MapView';
import { useRoutes } from '../hooks/useRoutes';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

export default function AppPage() {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [travelHour, setTravelHour] = useState(new Date().getHours());
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  
  const [userCoords, setUserCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { routes, isLoading, error, fetchRoutes, startPoint, endPoint } = useRoutes();
  const { speak } = useVoiceNavigation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const detectLocation = () => {
    setIsDetectingLocation(true);
    setLocationError('');
    if (navigator.geolocation) {
      let attempts = 0;
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          attempts++;
          const { latitude, longitude, accuracy } = position.coords;
          
          if (accuracy < 100 || attempts >= 2) {
            navigator.geolocation.clearWatch(watchId);
            
            const isValidIndiaLocation = (lat, lng) => {
              return lat >= 8.0 && lat <= 37.0 && lng >= 68.0 && lng <= 97.0;
            };

            if (!isValidIndiaLocation(latitude, longitude)) {
              setStartQuery('Indore, MP');
              setUserCoords([22.7196, 75.8577]);
              setGpsAccuracy(null);
              setLocationError('Using Indore as default location (GPS outside India)');
              setIsDetectingLocation(false);
              return;
            }

            try {
              const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
              const res = await fetch(url, {
                headers: {
                  'Accept-Language': 'en-US,en',
                  'User-Agent': 'SafeRouteAI/1.0'
                }
              });
              const data = await res.json();
              
              const addr = data.address;
              const name = 
                addr?.suburb ||
                addr?.neighbourhood ||
                addr?.quarter ||
                addr?.road ||
                addr?.village ||
                addr?.town ||
                addr?.city ||
                data.display_name?.split(',')[0] || 'Current Location';
              
              const city = addr?.city || addr?.town || addr?.county || 'Indore';
              
              setStartQuery(`${name}, ${city}`);
              setUserCoords([latitude, longitude]);
              setGpsAccuracy(accuracy);
              
              speak("Location detected. Enter your destination to find safe routes.");
            } catch(err) {
              setStartQuery('Current Location');
              setUserCoords([latitude, longitude]);
              setGpsAccuracy(accuracy);
            } finally {
              setIsDetectingLocation(false);
            }
          }
        },
        (error) => {
          setStartQuery('Indore, MP');
          setUserCoords([22.7196, 75.8577]);
          setGpsAccuracy(null);
          setLocationError('Location access denied. Type your starting location manually.');
          setIsDetectingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setStartQuery('Indore, MP');
      setUserCoords([22.7196, 75.8577]);
      setGpsAccuracy(null);
      setLocationError('Browser does not support GPS');
      setIsDetectingLocation(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const handleSearch = (start = startQuery, end = endQuery, hour = travelHour) => {
    if (!start || !end) return;
    fetchRoutes(start, end, hour);
    setSelectedRouteId(0); // Default to safest route
  };

  const isNightTime = travelHour >= 19 || travelHour <= 5;
  const routesFound = routes && routes.length > 0;

  const handleMobileSOSClick = () => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('SOS') || el.classList.contains('text-brand-danger'));
    if (btn) btn.click();
  };

  if (isMobile) {
    return (
      <div className="relative w-[100vw] h-[100dvh] overflow-hidden bg-black">
        {/* COMPONENT 2 - MAP (Full Screen) */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}>
          <MapView 
            routes={routes} 
            startPoint={startPoint} 
            endPoint={endPoint} 
            selectedRouteId={selectedRouteId}
            userCoords={userCoords}
          />
        </div>

        {/* COMPONENT 1 - TOP SEARCH BAR */}
        <div style={{
          position: 'fixed',
          top: '52px',
          left: 0,
          right: 0,
          zIndex: 900,
          padding: '10px 12px',
          background: 'rgba(11, 15, 26, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Start Location */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#1a2332',
            borderRadius: '10px',
            padding: '10px 12px',
            border: '1px solid #2d3748'
          }}>
            <div style={{
              width: '10px', height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              flexShrink: 0,
              boxShadow: '0 0 0 3px rgba(16,185,129,0.2)'
            }}/>
            <input
              value={startQuery}
              onChange={(e) => setStartQuery(e.target.value)}
              placeholder="📍 Your location (auto-detected)"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '16px',
                outline: 'none'
              }}
            />
            {isDetectingLocation && (
              <div style={{
                width: '16px', height: '16px',
                border: '2px solid #7c3aed',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}/>
            )}
          </div>

          {/* Connector line + swap button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '4px',
            gap: '8px'
          }}>
            <div style={{
              width: '2px', height: '16px',
              background: '#374151',
              marginLeft: '4px'
            }}/>
            <div style={{ flex: 1 }}/>
            <button 
              onClick={() => {
                const temp = startQuery;
                setStartQuery(endQuery);
                setEndQuery(temp);
              }}
              style={{
                background: '#1e293b',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >⇅</button>
          </div>

          {/* Destination */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#1a2332',
            borderRadius: '10px',
            padding: '10px 12px',
            border: '1px solid #2d3748'
          }}>
            <div style={{
              width: '10px', height: '10px',
              borderRadius: '50%',
              background: '#f43f5e',
              flexShrink: 0,
              boxShadow: '0 0 0 3px rgba(244,63,94,0.2)'
            }}/>
            <input
              value={endQuery}
              onChange={(e) => setEndQuery(e.target.value)}
              placeholder="Where do you want to go?"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>

          {/* Quick destination chips */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none'
          }}>
            {['Vijay Nagar', 'Rajwada', 'Palasia', 'MG Road', 'Sapna Sangeeta'].map(place => (
              <button
                key={place}
                onClick={() => setEndQuery(place + ', Indore')}
                style={{
                  background: '#1e293b',
                  border: '1px solid #374151',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  minHeight: '44px'
                }}
              >
                📍 {place}
              </button>
            ))}
          </div>

          {/* Find Route Button */}
          <button
            onClick={() => handleSearch()}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              width: '100%',
              minHeight: '48px',
              marginTop: '4px'
            }}
          >
            {isLoading ? 'Searching...' : '🔍 Find Safe Routes'}
          </button>
        </div>

        {/* COMPONENT 3 - FLOATING ACTION BUTTONS */}
        <button 
          onClick={detectLocation}
          style={{
            position: 'fixed',
            right: '16px',
            bottom: routesFound ? '220px' : '100px',
            zIndex: 950,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#1a2332',
            border: '1px solid #2d3748',
            color: '#60a5fa',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
            transition: 'bottom 0.3s ease'
          }}
        >
          📍
        </button>

        <button
          onClick={handleMobileSOSClick}
          style={{
            position: 'fixed',
            right: '16px',
            bottom: routesFound ? '168px' : '48px',
            zIndex: 950,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#dc2626',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 16px rgba(220,38,38,0.5)',
            animation: 'pulse 2s infinite',
            transition: 'bottom 0.3s ease'
          }}
        >
          🆘
        </button>

        {/* COMPONENT 4 - BOTTOM ROUTE CARDS */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 900,
          background: 'rgba(11, 15, 26, 0.97)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid #1e293b',
          borderRadius: '20px 20px 0 0',
          padding: '12px 16px 24px',
          transform: routesFound ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '200px'
        }}>
          <div style={{
            width: '36px', height: '4px',
            background: '#374151',
            borderRadius: '2px',
            margin: '0 auto 12px'
          }}/>

          <div style={{
            fontSize: '11px',
            color: '#64748b',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '10px'
          }}>
            🛡 Safe Routes Found
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}>
            {routes && routes.map((route, i) => {
              const score = route.safetyScore || 0;
              let label = 'Route';
              let color = '#60a5fa'; 
              if (score >= 80) { label = 'Safest'; color = '#10b981'; }
              else if (score >= 60) { label = 'Safe'; color = '#f59e0b'; }
              else { label = 'Risk'; color = '#ef4444'; }

              return (
                <div
                  key={i}
                  onClick={() => setSelectedRouteId(i)}
                  style={{
                    minWidth: '160px',
                    background: selectedRouteId === i ? 'rgba(124,58,237,0.15)' : '#1a2332',
                    border: `1px solid ${selectedRouteId === i ? color : '#2d3748'}`,
                    borderRadius: '12px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    scrollSnapAlign: 'start',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '20px', fontWeight: '600', color: color }}>
                      {score}
                    </span>
                    <span style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: color + '22',
                      color: color,
                      fontWeight: '500'
                    }}>
                      {label}
                    </span>
                  </div>

                  <div style={{
                    height: '3px',
                    background: '#243040',
                    borderRadius: '2px',
                    marginBottom: '6px'
                  }}>
                    <div style={{
                      width: score + '%',
                      height: '100%',
                      background: color,
                      borderRadius: '2px'
                    }}/>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {(route.distance / 1000).toFixed(1)}km · {Math.round(route.duration / 60)}min
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // DESKTOP LAYOUT (Unchanged)
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-brand-bg relative">
      
      {/* Night Time Warning Banner */}
      {isNightTime && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-brand-warning/20 border-b border-brand-warning/30 backdrop-blur-md px-4 py-2 flex items-center justify-center gap-2 text-brand-warning font-medium text-sm animate-in slide-in-from-top">
          <AlertTriangle size={16} />
          <span>⚠ Night travel detected — extra precautions recommended</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar 
        startQuery={startQuery}
        setStartQuery={setStartQuery}
        endQuery={endQuery}
        setEndQuery={setEndQuery}
        travelHour={travelHour}
        setTravelHour={setTravelHour}
        onSearch={handleSearch}
        routes={routes}
        isLoading={isLoading}
        error={error}
        selectedRouteId={selectedRouteId}
        setSelectedRouteId={setSelectedRouteId}
        userCoords={userCoords}
        isDetectingLocation={isDetectingLocation}
        locationError={locationError}
        gpsAccuracy={gpsAccuracy}
        detectLocation={detectLocation}
      />

      {/* Map Area */}
      <div className="flex-1 relative z-0 h-full w-full lg:w-[calc(100%-320px)]">
        <MapView 
          routes={routes} 
          startPoint={startPoint} 
          endPoint={endPoint} 
          selectedRouteId={selectedRouteId}
          userCoords={userCoords}
        />
      </div>

    </div>
  );
}
