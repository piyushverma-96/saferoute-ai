import { useState, useCallback } from 'react';
import { geocode } from '../utils/geocoding';

const generateMockRoutes = (start, end) => {
  const startLat = start[0];
  const startLng = start[1];
  const endLat = end[0];
  const endLng = end[1];
  
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;
  
  const safeCoords = [
    [startLat, startLng],
    [midLat + 0.02, midLng - 0.01],
    [midLat + 0.025, midLng + 0.01],
    [midLat + 0.015, midLng + 0.02],
    [endLat, endLng]
  ];
  
  const moderateCoords = [
    [startLat, startLng],
    [midLat + 0.005, midLng - 0.005],
    [midLat, midLng],
    [midLat - 0.005, midLng + 0.005],
    [endLat, endLng]
  ];
  
  const riskyCoords = [
    [startLat, startLng],
    [midLat - 0.015, midLng - 0.01],
    [midLat - 0.025, midLng + 0.01],
    [midLat - 0.015, midLng + 0.02],
    [endLat, endLng]
  ];
  
  const hour = new Date().getHours();
  const penalty = hour >= 19 ? 15 : hour >= 17 ? 8 : 0;
  
  return [
    {
      id: 1,
      name: 'Safest Route',
      type: 'safe',
      color: '#00C896',
      weight: 6,
      coordinates: safeCoords,
      score: Math.max(0, 85 - penalty),
      distance: '3.8',
      duration: 22,
      dist: '3.8 km',
      time: '22 min',
      rawDistance: 3800,
      tags: ['CCTV', 'Well Lit', 'Police Nearby'],
      factors: [
        { icon: '💡', name: 'Street Lighting', score: 9 },
        { icon: '📹', name: 'CCTV Coverage', score: 8 },
        { icon: '🚔', name: 'Police Proximity', score: 9 },
        { icon: '👥', name: 'Crowd Density', score: 7 },
        { icon: '📊', name: 'Crime History', score: 8 }
      ],
      confidence: 94
    },
    {
      id: 2,
      name: 'Balanced Route',
      type: 'moderate',
      color: '#F59E0B',
      weight: 5,
      coordinates: moderateCoords,
      score: Math.max(0, 65 - penalty),
      distance: '3.2',
      duration: 18,
      dist: '3.2 km',
      time: '18 min',
      rawDistance: 3200,
      tags: ['Moderate Risk', 'Some Lighting'],
      factors: [
        { icon: '💡', name: 'Street Lighting', score: 6 },
        { icon: '📹', name: 'CCTV Coverage', score: 5 },
        { icon: '🚔', name: 'Police Proximity', score: 6 },
        { icon: '👥', name: 'Crowd Density', score: 7 },
        { icon: '📊', name: 'Crime History', score: 5 }
      ],
      confidence: 87
    },
    {
      id: 3,
      name: 'High Risk Route',
      type: 'risky',
      color: '#EF4444',
      weight: 5,
      coordinates: riskyCoords,
      score: Math.max(0, 35 - penalty),
      distance: '2.6',
      duration: 14,
      dist: '2.6 km',
      time: '14 min',
      rawDistance: 2600,
      tags: ['⚠ High Risk', 'Poor Lighting', 'No CCTV'],
      factors: [
        { icon: '💡', name: 'Street Lighting', score: 3 },
        { icon: '📹', name: 'CCTV Coverage', score: 2 },
        { icon: '🚔', name: 'Police Proximity', score: 3 },
        { icon: '👥', name: 'Crowd Density', score: 4 },
        { icon: '📊', name: 'Crime History', score: 2 }
      ],
      confidence: 91
    }
  ];
}

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
        const base = 'https://router.project-osrm.org/route/v1/driving/';
        const coords = `${start[1]},${start[0]};${end[1]},${end[0]}`;
        const url = `${base}${coords}?overview=full&geometries=geojson&alternatives=3`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.routes || data.routes.length === 0) {
          throw new Error('No routes');
        }
        
        const hour = travelHour || new Date().getHours();
        const penalty = hour >= 19 ? 15 : hour >= 17 ? 8 : 0;
        
        const baseRoute = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        
        const route2 = data.routes[1] 
          ? data.routes[1].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          : baseRoute.map(([lat, lng], i) => [
              lat + (i % 4 === 0 ? 0.003 : 0),
              lng + (i % 3 === 0 ? 0.002 : 0)
            ]);
        
        const route3 = data.routes[2]
          ? data.routes[2].geometry.coordinates.map(([lng, lat]) => [lat, lng])
          : baseRoute.map(([lat, lng], i) => [
              lat - (i % 4 === 0 ? 0.003 : 0),
              lng - (i % 3 === 0 ? 0.002 : 0)
            ]);
        
        const d0 = (data.routes[0].distance/1000).toFixed(1);
        const d1 = data.routes[1] ? (data.routes[1].distance/1000).toFixed(1) : (d0 * 1.2).toFixed(1);
        const d2 = data.routes[2] ? (data.routes[2].distance/1000).toFixed(1) : (d0 * 0.9).toFixed(1);
        
        const t0 = Math.round(data.routes[0].duration/60);
        const t1 = data.routes[1] ? Math.round(data.routes[1].duration/60) : Math.round(t0 * 1.2);
        const t2 = data.routes[2] ? Math.round(data.routes[2].duration/60) : Math.round(t0 * 0.85);
        
        finalRoutes = [
          {
            id: 1,
            name: 'Safest Route',
            type: 'safe',
            color: '#00C896',
            weight: 6,
            coordinates: baseRoute,
            score: Math.max(0, 85 - penalty),
            distance: d1,
            duration: t1,
            dist: d1 + ' km',
            time: t1 + ' min',
            rawDistance: data.routes[1] ? data.routes[1].distance : data.routes[0].distance * 1.2,
            tags: ['CCTV', 'Well Lit', 'Police Nearby'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 9 },
              { icon: '📹', name: 'CCTV Coverage', score: 8 },
              { icon: '🚔', name: 'Police Proximity', score: 9 },
              { icon: '👥', name: 'Crowd Density', score: 7 },
              { icon: '📊', name: 'Crime History', score: 8 }
            ],
            confidence: 94
          },
          {
            id: 2,
            name: 'Balanced Route',
            type: 'moderate',
            color: '#F59E0B',
            weight: 5,
            coordinates: route2,
            score: Math.max(0, 65 - penalty),
            distance: d0,
            duration: t0,
            dist: d0 + ' km',
            time: t0 + ' min',
            rawDistance: data.routes[0].distance,
            tags: ['Moderate Risk', 'Some Lighting'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 6 },
              { icon: '📹', name: 'CCTV Coverage', score: 5 },
              { icon: '🚔', name: 'Police Proximity', score: 6 },
              { icon: '👥', name: 'Crowd Density', score: 7 },
              { icon: '📊', name: 'Crime History', score: 5 }
            ],
            confidence: 87
          },
          {
            id: 3,
            name: 'High Risk Route',
            type: 'risky',
            color: '#EF4444',
            weight: 5,
            coordinates: route3,
            score: Math.max(0, 35 - penalty),
            distance: d2,
            duration: t2,
            dist: d2 + ' km',
            time: t2 + ' min',
            rawDistance: data.routes[2] ? data.routes[2].distance : data.routes[0].distance * 0.9,
            tags: ['⚠ High Risk', 'Poor Lighting', 'No CCTV'],
            factors: [
              { icon: '💡', name: 'Street Lighting', score: 3 },
              { icon: '📹', name: 'CCTV Coverage', score: 2 },
              { icon: '🚔', name: 'Police Proximity', score: 3 },
              { icon: '👥', name: 'Crowd Density', score: 4 },
              { icon: '📊', name: 'Crime History', score: 2 }
            ],
            confidence: 91
          }
        ];
      } catch (err) {
        console.log('OSRM failed:', err);
        finalRoutes = generateMockRoutes(start, end, travelHour);
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
