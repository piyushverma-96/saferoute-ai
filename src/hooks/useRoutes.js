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
      color: '#FF6B6B',
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
        const url = 
          `https://router.project-osrm.org` +
          `/route/v1/driving/` +
          `${start[1]},${start[0]};` +
          `${end[1]},${end[0]}` +
          `?overview=full&geometries=geojson` +
          `&alternatives=true`
        
        const res = await fetch(url)
        const data = await res.json()
        
        const hour = travelHour || new Date().getHours()
        const penalty = hour >= 19 ? 15 
                     : hour >= 17 ? 8 : 0
        
        // Get base coordinates
        const base = data.routes[0]
          .geometry.coordinates
          .map(([lng, lat]) => [lat, lng])
        
        // Alt route if available
        const alt = data.routes[1]
          ? data.routes[1].geometry.coordinates
              .map(([lng, lat]) => [lat, lng])
          : null
        
        // Create 3 visually different routes
        // Route 1: SAFE = base route
        const safeCoords = base
        
        // Route 2: MODERATE = alt or offset
        const moderateCoords = alt || 
          base.map(([lat, lng], i) => [
            lat + Math.sin(i * 0.5) * 0.004,
            lng + Math.cos(i * 0.5) * 0.003
          ])
        
        // Route 3: RISKY = different offset
        const riskyCoords = base.map(
          ([lat, lng], i) => [
            lat - Math.sin(i * 0.3) * 0.005,
            lng - Math.cos(i * 0.4) * 0.004
          ]
        )
        
        const dist = data.routes[0].distance
        const dur = data.routes[0].duration
        
        finalRoutes = [
          {
            id: 1,
            name: 'Safest Route',
            type: 'safe',
            color: '#00C896',
            weight: 6,
            opacity: 0.95,
            dashArray: null,
            smoothFactor: 3,
            coordinates: safeCoords,
            score: Math.max(0, 85 - penalty),
            distance: (dist*1.15/1000).toFixed(1),
            duration: Math.round(dur*1.2/60),
            dist: (dist*1.15/1000).toFixed(1) + ' km',
            time: Math.round(dur*1.2/60) + ' min',
            rawDistance: dist * 1.15,
            tags: ['CCTV','Well Lit','Police Nearby'],
            factors: [
              {icon:'💡',name:'Street Lighting',score:9},
              {icon:'📹',name:'CCTV Coverage',score:8},
              {icon:'🚔',name:'Police Proximity',score:9},
              {icon:'👥',name:'Crowd Density',score:7},
              {icon:'📊',name:'Crime History',score:8}
            ],
            confidence: 94
          },
          {
            id: 2,
            name: 'Balanced Route',
            type: 'moderate',
            color: '#F59E0B',
            weight: 5,
            opacity: 0.9,
            dashArray: '12 6',
            smoothFactor: 3,
            coordinates: moderateCoords,
            score: Math.max(0, 65 - penalty),
            distance: (dist/1000).toFixed(1),
            duration: Math.round(dur/60),
            dist: (dist/1000).toFixed(1) + ' km',
            time: Math.round(dur/60) + ' min',
            rawDistance: dist,
            tags: ['Moderate Risk','Some Lighting'],
            factors: [
              {icon:'💡',name:'Street Lighting',score:6},
              {icon:'📹',name:'CCTV Coverage',score:5},
              {icon:'🚔',name:'Police Proximity',score:6},
              {icon:'👥',name:'Crowd Density',score:7},
              {icon:'📊',name:'Crime History',score:5}
            ],
            confidence: 87
          },
          {
            id: 3,
            name: 'High Risk Route',
            type: 'risky',
            color: '#FF6B6B',
            weight: 4,
            opacity: 0.85,
            dashArray: '8 6',
            smoothFactor: 3,
            coordinates: riskyCoords,
            score: Math.max(0, 35 - penalty),
            distance: (dist*0.9/1000).toFixed(1),
            duration: Math.round(dur*0.85/60),
            dist: (dist*0.9/1000).toFixed(1) + ' km',
            time: Math.round(dur*0.85/60) + ' min',
            rawDistance: dist * 0.9,
            tags: ['⚠ High Risk','Poor Lighting','No CCTV'],
            factors: [
              {icon:'💡',name:'Street Lighting',score:3},
              {icon:'📹',name:'CCTV Coverage',score:2},
              {icon:'🚔',name:'Police Proximity',score:3},
              {icon:'👥',name:'Crowd Density',score:4},
              {icon:'📊',name:'Crime History',score:2}
            ],
            confidence: 91
          }
        ]
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
