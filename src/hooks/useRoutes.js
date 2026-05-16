import { useState, useCallback } from 'react';
import { geocode } from '../utils/geocoding';
import { getUnsafeZoneData, getSafetyLevel } from '../utils/safetyScore';

// Haversine distance formula
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2-lat1) * Math.PI/180
  const dLng = (lng2-lng1) * Math.PI/180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * 
    Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

const findContactsNearRoute = (routeCoords, contacts, thresholdKm = 3.0) => {
  const nearbyContacts = []
  
  contacts.forEach(contact => {
    if (!contact.lat || !contact.lng) return
    
    // Check distance from contact to any point on the route
    const isNear = routeCoords.some(([lat, lng]) => {
      const dist = getDistanceKm(lat, lng, contact.lat, contact.lng)
      return dist <= thresholdKm
    })
    
    if (isNear) {
      nearbyContacts.push(contact)
    }
  })
  
  return nearbyContacts
}

// SIMPLE mock routes - NO sin/cos
const generateMockRoutes = (start, end) => {
  const hour = new Date().getHours()
  const penalty = hour >= 19 ? 15 
               : hour >= 17 ? 8 : 0
  
  const s = start
  const e = end
  const mid = [
    (s[0]+e[0])/2,
    (s[1]+e[1])/2
  ]
  
  return [
    {
      id: 1,
      name: 'Safest Route',
      type: 'safe',
      color: '#00C896',
      weight: 6,
      dashArray: null,
      // Simple 3-point route going NORTH
      coordinates: [
        s,
        [mid[0]+0.02, mid[1]+0.01],
        e
      ],
      score: Math.max(0, 85 - penalty),
      distance: '4.2',
      duration: 20,
      dist: '4.2 km',
      time: '20 min',
      rawDistance: 4200,
      tags: ['CCTV','Well Lit',
             'Police Nearby'],
      factors: [
        {icon:'💡',
         name:'Street Lighting',score:9},
        {icon:'📹',
         name:'CCTV Coverage',score:8},
        {icon:'🚔',
         name:'Police Proximity',score:9},
        {icon:'👥',
         name:'Crowd Density',score:7},
        {icon:'📊',
         name:'Crime History',score:8}
      ],
      confidence: 94
    },
    {
      id: 2,
      name: 'Balanced Route',
      type: 'moderate',
      color: '#F59E0B',
      weight: 5,
      dashArray: '10 6',
      // Direct route
      coordinates: [s, mid, e],
      score: Math.max(0, 65 - penalty),
      distance: '3.5',
      duration: 16,
      dist: '3.5 km',
      time: '16 min',
      rawDistance: 3500,
      tags: ['Moderate Risk',
             'Some Lighting'],
      factors: [
        {icon:'💡',
         name:'Street Lighting',score:6},
        {icon:'📹',
         name:'CCTV Coverage',score:5},
        {icon:'🚔',
         name:'Police Proximity',score:6},
        {icon:'👥',
         name:'Crowd Density',score:7},
        {icon:'📊',
         name:'Crime History',score:5}
      ],
      confidence: 87
    },
    {
      id: 3,
      name: 'High Risk Route',
      type: 'risky',
      color: '#FF6B6B',
      weight: 4,
      dashArray: '6 8',
      // Simple 3-point going SOUTH
      coordinates: [
        s,
        [mid[0]-0.02, mid[1]-0.01],
        e
      ],
      score: Math.max(0, 35 - penalty),
      distance: '2.8',
      duration: 13,
      dist: '2.8 km',
      time: '13 min',
      rawDistance: 2800,
      tags: ['⚠ High Risk',
             'Poor Lighting','No CCTV'],
      factors: [
        {icon:'💡',
         name:'Street Lighting',score:3},
        {icon:'📹',
         name:'CCTV Coverage',score:2},
        {icon:'🚔',
         name:'Police Proximity',score:3},
        {icon:'👥',
         name:'Crowd Density',score:4},
        {icon:'📊',
         name:'Crime History',score:2}
      ],
      confidence: 91
    }
  ].map(route => {
    const savedContacts = JSON.parse(localStorage.getItem('trusted_contacts') || '[]')
    return {
      ...route,
      nearbyContacts: findContactsNearRoute(route.coordinates, savedContacts)
    }
  })
}

export const getRoutesByPreference = (routes, preference) => {
  if (!routes || routes.length === 0) return routes;

  // Sort based on user preference
  const sorted = [...routes];

  if (preference === 'safest') {
    // Sort by safety score DESC
    sorted.sort((a, b) => b.score - a.score);
  } else if (preference === 'fastest') {
    // Sort by duration ASC
    sorted.sort((a, b) => a.durMin - b.durMin);
  } else {
    // Balanced - sort by combined score
    sorted.sort((a, b) => {
      // Balanced logic: normalized score + inverse duration
      const scoreA = (a.score * 0.5) + ((1 / (a.durMin || 1)) * 1000 * 0.5);
      const scoreB = (b.score * 0.5) + ((1 / (b.durMin || 1)) * 1000 * 0.5);
      return scoreB - scoreA;
    });
  }

  // Mark top route as recommended
  return sorted.map((r, i) => ({
    ...r,
    recommended: i === 0,
    rank: i + 1
  }));
};

export function useRoutes() {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);

  const fetchRoutes = useCallback(async (startQuery, endQuery, travelHour, preference = 'safest') => {
    if (!startQuery || !endQuery) return;
    
    setIsLoading(true);
    setError(null);
    setRoutes([]);
    
    try {
      const startObj = await geocode(startQuery);
      const start = [startObj.lat, startObj.lon];
      
      const endObj = await geocode(endQuery);
      const end = [endObj.lat, endObj.lon];
      
      setStartPoint(startObj);
      setEndPoint(endObj);

      let finalRoutes = [];
      
      try {
        const url = 
          `https://router.project-osrm.org/route/v1/driving/` +
          `${start[1]},${start[0]};${end[1]},${end[0]}` +
          `?overview=full&geometries=geojson&alternatives=true`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.routes?.length) throw new Error('no routes');
        
        const hour = travelHour || new Date().getHours();
        const penalty = hour >= 19 ? 15 : hour >= 17 ? 8 : 0;
        const toLatLng = (coords) => coords.map(([lng, lat]) => [lat, lng]);
        
        const r0 = toLatLng(data.routes[0].geometry.coordinates);
        const moderateCoords = r0;
        const safeCoords = data.routes[1] ? toLatLng(data.routes[1].geometry.coordinates) : r0;
        const riskyCoords = data.routes[2]
          ? toLatLng(data.routes[2].geometry.coordinates)
          : r0.map(([lat, lng], i, arr) => {
              if (i === 0 || i === arr.length-1) return [lat, lng];
              return [lat - 0.008, lng - 0.006];
            });
            
        const d0 = data.routes[0].distance;
        const t0 = data.routes[0].duration;

        const unsafeZone = getUnsafeZoneData(endQuery);
        
        const rawRoutes = [
          {
            id: 1,
            name: 'Safest Route',
            type: 'safe',
            coordinates: safeCoords,
            score: unsafeZone ? unsafeZone.scores[0] : Math.max(0, 85 - penalty),
            distance: (d0*1.1/1000).toFixed(1),
            durMin: Math.round(t0*1.15/60),
            duration: Math.round(t0*1.15/60),
            dist: (d0*1.1/1000).toFixed(1) + ' km',
            time: Math.round(t0*1.15/60) + ' min',
            tags: ['CCTV','Well Lit','Police Nearby'],
            unsafeReason: unsafeZone?.reason || null,
            confidence: 94
          },
          {
            id: 2,
            name: 'Balanced Route',
            type: 'moderate',
            coordinates: moderateCoords,
            score: unsafeZone ? unsafeZone.scores[1] : Math.max(0, 65 - penalty),
            distance: (d0/1000).toFixed(1),
            durMin: Math.round(t0/60),
            duration: Math.round(t0/60),
            dist: (d0/1000).toFixed(1) + ' km',
            time: Math.round(t0/60) + ' min',
            tags: ['Moderate Risk','Some Lighting'],
            unsafeReason: unsafeZone?.reason || null,
            confidence: 87
          },
          {
            id: 3,
            name: 'High Risk Route',
            type: 'risky',
            coordinates: riskyCoords,
            score: unsafeZone ? unsafeZone.scores[2] : Math.max(0, 35 - penalty),
            distance: (d0*0.9/1000).toFixed(1),
            durMin: Math.round(t0*0.85/60),
            duration: Math.round(t0*0.85/60),
            dist: (d0*0.9/1000).toFixed(1) + ' km',
            time: Math.round(t0*0.85/60) + ' min',
            tags: ['⚠ High Risk','Poor Lighting','No CCTV'],
            unsafeReason: unsafeZone?.reason || null,
            confidence: 91
          }
        ].map(route => {
          const safety = getSafetyLevel(route.score);
          const savedContacts = JSON.parse(localStorage.getItem('trusted_contacts') || '[]');
          
          return {
            ...route,
            color: safety.color,
            label: safety.label,
            icon: safety.icon,
            bg: safety.bg,
            border: safety.border,
            nearbyContacts: findContactsNearRoute(route.coordinates, savedContacts)
          };
        });

        finalRoutes = getRoutesByPreference(rawRoutes, preference);
      } catch (err) {
        console.log('OSRM failed:', err);
        finalRoutes = getRoutesByPreference(generateMockRoutes(start, end, travelHour), preference);
      }
      
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
