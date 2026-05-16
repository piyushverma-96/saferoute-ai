import { useState, useCallback } from 'react';
import { geocode } from '../utils/geocoding';
import { getUnsafeZoneData, getSafetyLevel } from '../utils/safetyScore';
import { fetchRoutes as fetchRoutingData } from '../utils/routing';

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
        const hour = travelHour || new Date().getHours();
        const baseRoutes = await fetchRoutingData(startObj, endObj, hour, endQuery);
        
        const names = ['Safest Route', 'Balanced Route', 'High Risk Route'];
        const types = ['safe', 'moderate', 'risky'];
        const tagSets = [
          ['CCTV', 'Well Lit', 'Police Nearby'],
          ['Moderate Risk', 'Some Lighting'],
          ['⚠ High Risk', 'Poor Lighting', 'No CCTV']
        ];
        const confidences = [94, 87, 91];

        const rawRoutes = baseRoutes.map((route, i) => {
          const savedContacts = JSON.parse(localStorage.getItem('trusted_contacts') || '[]');
          return {
            ...route,
            id: i + 1,
            name: names[i],
            type: types[i],
            tags: tagSets[i],
            confidence: confidences[i],
            dist: route.distKm + ' km',
            time: route.durMin + ' min',
            nearbyContacts: findContactsNearRoute(route.coordinates, savedContacts)
          };
        });

        finalRoutes = getRoutesByPreference(rawRoutes, preference);
      } catch (err) {
        console.log('Routing failed:', err);
        setError("❌ Could not fetch routes. Please try again.");
      }
      
      setRoutes(finalRoutes);
    } catch (err) {
      if (err.message === 'GEOCODING_ERROR') {
        setError(
          '❌ "' + endQuery + '" not found. ' +
          'Try: "Vijay Nagar" or "Rajwada" or "MG Road"'
        );
      } else {
        setError("❌ An unexpected error occurred. Please check your internet.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { routes, isLoading, error, fetchRoutes, startPoint, endPoint };
}
