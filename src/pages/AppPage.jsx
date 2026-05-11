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
  const [isDetectingLocation, setIsDetectingLocation] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const { routes, isLoading, error, fetchRoutes, startPoint, endPoint } = useRoutes();
  const { speak } = useVoiceNavigation();

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
  const routesFound = !!(routes && routes.length > 0);

  const selectRoute = (idx) => {
    setSelectedRouteId(idx);
    if (routes && routes[idx]) {
      speak(`Route ${idx + 1} selected. Safety score ${routes[idx].score}. Distance ${(routes[idx].rawDistance/1000).toFixed(1)} kilometers.`);
    }
  };

  const handleMobileSOSClick = () => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('SOS') || el.classList.contains('text-brand-danger'));
    if (btn) btn.click();
  };

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
      <div className="map-container flex-1 relative z-0 h-full w-full lg:w-[calc(100%-320px)]">
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
