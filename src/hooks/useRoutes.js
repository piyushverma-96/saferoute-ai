import { useState, useCallback } from 'react';
import { geocode } from '../utils/geocoding';

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

const findContactsNearRoute = (routeCoords, contacts, thresholdKm = 0.5) => {
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
        
        if (!data.routes?.length) {
          throw new Error('no routes')
        }
        
        const hour = travelHour || new Date().getHours()
        const penalty = hour >= 19 ? 15 
                     : hour >= 17 ? 8 : 0
        
        // Convert coordinates helper
        const toLatLng = (coords) =>
          coords.map(([lng, lat]) => [lat, lng])
        
        // Get real routes from OSRM
        const r0 = toLatLng(
          data.routes[0].geometry.coordinates
        )
        
        const moderateCoords = r0;
        const safeCoords = data.routes[1] 
          ? toLatLng(data.routes[1].geometry.coordinates)
          : r0;
          
        const riskyCoords = data.routes[2]
          ? toLatLng(data.routes[2].geometry.coordinates)
          : r0.map(([lat, lng], i, arr) => {
              // Only offset MIDDLE points
              // Keep start and end same
              if (i === 0 || i === arr.length-1) {
                return [lat, lng]
              }
              // Simple fixed offset south-west
              return [lat - 0.008, lng - 0.006]
            });
            
        console.log('Safe first point:', safeCoords[0])
        console.log('Risky first point:', riskyCoords[0])
        
        const d0 = data.routes[0].distance
        const t0 = data.routes[0].duration
        
        finalRoutes = [
          {
            id: 1,
            name: 'Safest Route',
            type: 'safe',
            color: '#00C896',
            weight: 6,
            dashArray: null,
            coordinates: safeCoords,
            score: Math.max(0, 85 - penalty),
            distance: (d0*1.1/1000).toFixed(1),
            duration: Math.round(t0*1.15/60),
            dist: (d0*1.1/1000).toFixed(1) + ' km',
            time: Math.round(t0*1.15/60) + ' min',
            rawDistance: d0 * 1.1,
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
            coordinates: moderateCoords,
            score: Math.max(0, 65 - penalty),
            distance: (d0/1000).toFixed(1),
            duration: Math.round(t0/60),
            dist: (d0/1000).toFixed(1) + ' km',
            time: Math.round(t0/60) + ' min',
            rawDistance: d0,
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
            coordinates: riskyCoords,
            score: Math.max(0, 35 - penalty),
            distance: (d0*0.9/1000).toFixed(1),
            duration: Math.round(t0*0.85/60),
            dist: (d0*0.9/1000).toFixed(1) + ' km',
            time: Math.round(t0*0.85/60) + ' min',
            rawDistance: d0 * 0.9,
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
