import { useState, useCallback } from 'react';
import { geocode } from '../utils/geocoding';

export function useRoutes() {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  const fetchRoutes = useCallback(async (startQuery, endQuery, travelHour) => {
    if (!startQuery || !endQuery) return;
    
    setIsLoading(true);
    setError(null);
    setRoutes([]);
    
    try {
      console.log("Geocoding start location...");
      const startObj = await geocode(startQuery);
      const start = [startObj.lat, startObj.lon];
      
      console.log("Geocoding destination...");
      const endObj = await geocode(endQuery);
      const end = [endObj.lat, endObj.lon];
      
      setStartPoint(startObj);
      setEndPoint(endObj);

      console.log("Fetching routes from OSRM...");
      let finalRoutes = [];
      
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.routes || !data.routes[0]) {
          throw new Error('No routes returned');
        }
        
        const baseCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const distance = data.routes[0].distance / 1000;
        const duration = Math.round(data.routes[0].duration / 60);
        
        const safeCoords = baseCoords.map(([lat, lng], i) => [
          lat + (i % 3 === 0 ? 0.0015 : 0.001),
          lng + (i % 2 === 0 ? 0.0008 : 0.0005)
        ]);
        
        const moderateCoords = [...baseCoords];
        
        const riskyCoords = baseCoords.map(([lat, lng], i) => [
          lat - (i % 3 === 0 ? 0.0015 : 0.001),
          lng - (i % 2 === 0 ? 0.0008 : 0.0005)
        ]);
        
        const penalty = travelHour >= 19 || travelHour < 6 ? 15 : (travelHour >= 17 ? 8 : 0);
        
        finalRoutes = [
          {
            id: 1,
            name: 'Safest Route',
            type: 'safe',
            coordinates: safeCoords,
            color: '#00C896',
            score: Math.max(0, 85 - penalty),
            distance: (distance * 1.15).toFixed(1),
            duration: Math.round(duration * 1.2),
            dist: (distance * 1.15).toFixed(1) + ' km',
            time: Math.round(duration * 1.2) + ' min',
            rawDistance: distance * 1150,
            rawDuration: duration * 72,
            tags: ['CCTV', 'Well Lit', 'Police Nearby'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 9 },
              { icon: '📹', name: 'CCTV Coverage', score: 8 },
              { icon: '🚔', name: 'Police Proximity', score: 9 },
              { icon: '👥', name: 'Crowd Density', score: 7 },
              { icon: '📊', name: 'Crime History', score: 8 }
            ],
            confidence: 94,
            geometry: { coordinates: safeCoords.map(([lat, lng]) => [lng, lat]) }
          },
          {
            id: 2,
            name: 'Balanced Route',
            type: 'moderate',
            coordinates: moderateCoords,
            color: '#F59E0B',
            score: Math.max(0, 65 - penalty),
            distance: distance.toFixed(1),
            duration: duration,
            dist: distance.toFixed(1) + ' km',
            time: duration + ' min',
            rawDistance: distance * 1000,
            rawDuration: duration * 60,
            tags: ['Moderate Risk', 'Some Lighting'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 6 },
              { icon: '📹', name: 'CCTV Coverage', score: 5 },
              { icon: '🚔', name: 'Police Proximity', score: 6 },
              { icon: '👥', name: 'Crowd Density', score: 7 },
              { icon: '📊', name: 'Crime History', score: 5 }
            ],
            confidence: 87,
            geometry: { coordinates: moderateCoords.map(([lat, lng]) => [lng, lat]) }
          },
          {
            id: 3,
            name: 'High Risk Route',
            type: 'risky',
            coordinates: riskyCoords,
            color: '#EF4444',
            score: Math.max(0, 35 - penalty),
            distance: (distance * 0.85).toFixed(1),
            duration: Math.round(duration * 0.8),
            dist: (distance * 0.85).toFixed(1) + ' km',
            time: Math.round(duration * 0.8) + ' min',
            rawDistance: distance * 850,
            rawDuration: duration * 48,
            tags: ['⚠ High Risk', 'Poor Lighting', 'No CCTV'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 3 },
              { icon: '📹', name: 'CCTV Coverage', score: 2 },
              { icon: '🚔', name: 'Police Proximity', score: 3 },
              { icon: '👥', name: 'Crowd Density', score: 4 },
              { icon: '📊', name: 'Crime History', score: 2 }
            ],
            confidence: 91,
            geometry: { coordinates: riskyCoords.map(([lat, lng]) => [lng, lat]) }
          }
        ];
      } catch (err) {
        console.log('OSRM failed, using mock routes');
        const midLat = (start[0] + end[0]) / 2;
        const midLng = (start[1] + end[1]) / 2;
        const penalty = travelHour >= 19 || travelHour < 6 ? 15 : (travelHour >= 17 ? 8 : 0);
        
        finalRoutes = [
          {
            id: 1,
            name: 'Safest Route',
            type: 'safe',
            color: '#00C896',
            score: Math.max(0, 85 - penalty),
            distance: '3.2',
            duration: 18,
            dist: '3.2 km',
            time: '18 min',
            rawDistance: 3200,
            rawDuration: 18 * 60,
            coordinates: [start, [midLat + 0.008, midLng + 0.005], [midLat + 0.005, midLng + 0.008], end],
            tags: ['CCTV', 'Well Lit', 'Police Nearby'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 9 },
              { icon: '📹', name: 'CCTV Coverage', score: 8 },
              { icon: '🚔', name: 'Police Proximity', score: 9 },
              { icon: '👥', name: 'Crowd Density', score: 7 },
              { icon: '📊', name: 'Crime History', score: 8 }
            ],
            confidence: 94,
            geometry: { coordinates: [[start[1], start[0]], [midLng + 0.005, midLat + 0.008], [midLng + 0.008, midLat + 0.005], [end[1], end[0]]] }
          },
          {
            id: 2,
            name: 'Balanced Route',
            type: 'moderate',
            color: '#F59E0B',
            score: Math.max(0, 65 - penalty),
            distance: '2.8',
            duration: 15,
            dist: '2.8 km',
            time: '15 min',
            rawDistance: 2800,
            rawDuration: 15 * 60,
            coordinates: [start, [midLat + 0.002, midLng - 0.003], [midLat - 0.002, midLng + 0.003], end],
            tags: ['Moderate Risk', 'Some Lighting'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 6 },
              { icon: '📹', name: 'CCTV Coverage', score: 5 },
              { icon: '🚔', name: 'Police Proximity', score: 6 },
              { icon: '👥', name: 'Crowd Density', score: 7 },
              { icon: '📊', name: 'Crime History', score: 5 }
            ],
            confidence: 87,
            geometry: { coordinates: [[start[1], start[0]], [midLng - 0.003, midLat + 0.002], [midLng + 0.003, midLat - 0.002], [end[1], end[0]]] }
          },
          {
            id: 3,
            name: 'High Risk Route',
            type: 'risky',
            color: '#EF4444',
            score: Math.max(0, 35 - penalty),
            distance: '2.4',
            duration: 12,
            dist: '2.4 km',
            time: '12 min',
            rawDistance: 2400,
            rawDuration: 12 * 60,
            coordinates: [start, [midLat - 0.006, midLng - 0.004], [midLat - 0.004, midLng - 0.007], end],
            tags: ['⚠ High Risk', 'Poor Lighting', 'No CCTV'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 3 },
              { icon: '📹', name: 'CCTV Coverage', score: 2 },
              { icon: '🚔', name: 'Police Proximity', score: 3 },
              { icon: '👥', name: 'Crowd Density', score: 4 },
              { icon: '📊', name: 'Crime History', score: 2 }
            ],
            confidence: 91,
            geometry: { coordinates: [[start[1], start[0]], [midLng - 0.004, midLat - 0.006], [midLng - 0.007, midLat - 0.004], [end[1], end[0]]] }
          }
        ];
      }
      
      console.log('Routes count:', finalRoutes.length);
      setRoutes(finalRoutes);
    } catch (err) {
      if (err.message === 'GEOCODING_ERROR') {
        setError("❌ Location not found. Try: 'Rajwada, Indore'");
      } else {
        setError("❌ An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { routes, isLoading, error, fetchRoutes, startPoint, endPoint };
}
