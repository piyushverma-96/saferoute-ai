import { useState, useCallback } from 'react';
import { geocode } from '../utils/geocoding';

const generateRoutes = (start, end, travelHour) => {
  const startLat = start[0]
  const startLng = start[1]
  const endLat = end[0]
  const endLng = end[1]
  
  // Calculate midpoints for each route
  const midLat = (startLat + endLat) / 2
  const midLng = (startLng + endLng) / 2
  
  // ROUTE 1 - SAFE (goes NORTH of direct path)
  const safeCoords = [
    [startLat, startLng],
    [midLat + 0.02, midLng - 0.01],
    [midLat + 0.025, midLng + 0.01],
    [midLat + 0.015, midLng + 0.02],
    [endLat, endLng]
  ]
  
  // ROUTE 2 - MODERATE (direct path)
  const moderateCoords = [
    [startLat, startLng],
    [midLat + 0.005, midLng - 0.005],
    [midLat, midLng],
    [midLat - 0.005, midLng + 0.005],
    [endLat, endLng]
  ]
  
  // ROUTE 3 - RISKY (goes SOUTH of direct)
  const riskyCoords = [
    [startLat, startLng],
    [midLat - 0.015, midLng - 0.01],
    [midLat - 0.025, midLng + 0.01],
    [midLat - 0.015, midLng + 0.02],
    [endLat, endLng]
  ]
  
  const hour = travelHour;
  const penalty = hour >= 19 ? 15 
               : hour >= 17 ? 8 : 0
  
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
      confidence: 94,
      geometry: { coordinates: safeCoords.map(c => [c[1], c[0]]) } // Adding geometry for map bounds matching
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
      confidence: 87,
      geometry: { coordinates: moderateCoords.map(c => [c[1], c[0]]) }
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
      confidence: 91,
      geometry: { coordinates: riskyCoords.map(c => [c[1], c[0]]) }
    }
  ]
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

      console.log("Generating distinct routes...");
      const finalRoutes = generateRoutes(start, end, travelHour);
      
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
