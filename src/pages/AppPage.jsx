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
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [routePreference, setRoutePreference] = useState('safest');

  const { routes, isLoading, error, fetchRoutes, startPoint, endPoint } = useRoutes();
  const { speak, language } = useVoiceNavigation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      speak(
        language.startsWith('hi')
        ? 'SafeRoute AI में आपका स्वागत है। अपना गंतव्य दर्ज करें और सुरक्षित मार्ग खोजें।'
        : 'Welcome to SafeRoute AI. Enter your destination to find the safest routes.'
      );
    }, 1500);
  }, []);

  const detectLocation = () => {
    setIsDetectingLocation(true);
    setLocationError('');
    
    if (navigator.geolocation) {
      // Use getCurrentPosition for faster, one-time detection
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
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
        },
        (error) => {
          console.error("GPS Error:", error);
          setStartQuery('Indore, MP');
          setUserCoords([22.7196, 75.8577]);
          setGpsAccuracy(null);
          setLocationError('Location access denied. Type your starting location manually.');
          setIsDetectingLocation(false);
        },
        {
          enableHighAccuracy: false, // Much faster
          timeout: 5000,
          maximumAge: 60000 // Use cached location if available
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

  const handleSearch = (start = startQuery, end = endQuery, hour = travelHour, pref = routePreference) => {
    if (!start || !end) return;
    fetchRoutes(start, end, hour, pref);
    setSelectedRoute(null);
    if (isMobile) {
      setSidebarOpen(true);
    }
  };

  useEffect(() => {
    if (routes && routes.length > 0) {
      setSelectedRoute(routes[0]);
      
      // Voice announcement based on preference
      if (routePreference === 'safest') {
        speak(language.startsWith('hi') 
          ? `सबसे सुरक्षित मार्ग मिला। सुरक्षा स्कोर ${routes[0].score} है।` 
          : `Safest route found. Safety score is ${routes[0].score}.`);
      } else if (routePreference === 'fastest') {
        speak(language.startsWith('hi') 
          ? `सबसे तेज़ मार्ग मिला। समय ${routes[0].durMin} मिनट।` 
          : `Fastest route found. Travel time is ${routes[0].durMin} minutes.`);
      } else {
        speak(language.startsWith('hi') ? 'संतुलित मार्ग मिला।' : 'Balanced route found.');
      }
    }
  }, [routes]);

  const isNightTime = travelHour >= 19 || travelHour <= 5;

  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    if (route) {
      speak(
        language.startsWith('hi')
        ? `${route.name} चुना गया। दूरी ${route.distance} किलोमीटर। सुरक्षा स्कोर ${route.score} है।`
        : `${route.name} selected. Distance ${route.distance} kilometers. Safety score ${route.score} out of 100.`
      );
      if (isMobile) {
        setSidebarOpen(false); // Optionally hide sidebar to see the map after selecting
      }
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      background: '#0A0A0F'
    }}>
      
      {/* NIGHT BANNER */}
      {isNightTime && (
        <div className="absolute top-[64px] left-0 right-0 z-[40] bg-brand-warning/20 border-b border-brand-warning/30 backdrop-blur-md px-4 py-2 flex items-center justify-center gap-2 text-brand-warning font-medium text-sm">
          <AlertTriangle size={16} />
          <span>⚠ Night travel detected — extra precautions recommended</span>
        </div>
      )}
      
      {/* MAP - always full screen */}
      <div style={{
        position: 'absolute',
        top: '64px',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1
      }}>
        <MapView
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={handleRouteSelect}
          startCoords={startPoint ? [startPoint.lat, startPoint.lon] : null}
          endCoords={endPoint ? [endPoint.lat, endPoint.lon] : null}
          userCoords={userCoords}
        />
      </div>
      
      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          width: '320px',
          height: 'calc(100vh - 64px)',
          zIndex: 10,
          background: 'rgba(10,10,15,0.95)',
          backdropFilter: 'blur(10px)',
          overflowY: 'auto',
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Sidebar
            startQuery={startQuery}
            setStartQuery={setStartQuery}
            endQuery={endQuery}
            setEndQuery={setEndQuery}
            travelHour={travelHour}
            setTravelHour={setTravelHour}
            routePref={routePreference}
            setRoutePref={setRoutePreference}
            routes={routes}
            selectedRoute={selectedRoute}
            onRouteSelect={handleRouteSelect}
            onSearch={handleSearch}
            isLoading={isLoading}
            isDetectingLocation={isDetectingLocation}
            locationError={locationError}
            gpsAccuracy={gpsAccuracy}
            detectLocation={detectLocation}
            error={error}
          />
        </div>
      )}
      
      {/* MOBILE BOTTOM SHEET */}
      {isMobile && (
        <>
          {/* Toggle button - floating */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              position: 'absolute',
              bottom: sidebarOpen ? '64vh' : '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              background: '#7C3AED',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 20px',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
              transition: 'bottom 0.3s ease'
            }}
          >
            {sidebarOpen ? '▼ Hide Panel' : '▲ Route Planner'}
          </button>
          
          {/* Bottom Sheet */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: sidebarOpen ? '62vh' : '0',
            zIndex: 15,
            background: 'rgba(10,10,15,0.97)',
            backdropFilter: 'blur(15px)',
            borderRadius: '20px 20px 0 0',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'height 0.3s ease',
            overflow: 'hidden'
          }}>
            {/* Drag handle */}
            <div style={{
              width: '40px',
              height: '4px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '2px',
              margin: '12px auto 0'
            }} />
            
            {/* Scrollable content */}
            <div style={{
              height: 'calc(100% - 20px)',
              overflowY: 'auto',
              padding: '0 16px 20px'
            }}>
              <Sidebar
                startQuery={startQuery}
                setStartQuery={setStartQuery}
                endQuery={endQuery}
                setEndQuery={setEndQuery}
                travelHour={travelHour}
                setTravelHour={setTravelHour}
                routePref={routePreference}
                setRoutePref={setRoutePreference}
                routes={routes}
                selectedRoute={selectedRoute}
                onRouteSelect={handleRouteSelect}
                onSearch={handleSearch}
                isLoading={isLoading}
                isDetectingLocation={isDetectingLocation}
                locationError={locationError}
                gpsAccuracy={gpsAccuracy}
                detectLocation={detectLocation}
                error={error}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
