import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { isContactNearRoute } from '../utils/contactUtils'
import { mockContacts, safeStops } from '../data/mockData'

const getPointOnRoute = (coords, percentage) => {
  if (!coords?.length) return null
  const index = Math.floor(coords.length * percentage)
  return coords[Math.min(index, coords.length - 1)]
}

const MapUpdater = ({ 
  selectedRoute, 
  userCoords,
  routes
}) => {
  const map = useMap();
  const stopMarkersRef = useRef([]);

  useEffect(() => {
    if (!map) return;

    // 1. Clear old stops
    stopMarkersRef.current.forEach(m => map.removeLayer(m));
    stopMarkersRef.current = [];

    // 2. Determine active route coords
    const activeRoute = selectedRoute || (routes && routes[0]);
    if (!activeRoute?.coordinates) return;

    // 3. Load contacts
    const savedContacts = JSON.parse(
      localStorage.getItem('trusted_contacts') || '[]'
    );

    // 4. Filter contacts near THIS route only (3km threshold)
    const nearbyContacts = savedContacts.filter(contact => 
      isContactNearRoute(contact, activeRoute.coordinates, 3.0)
    );

    console.log('Selected route contacts:', nearbyContacts.map(c => c.name));

    // Draw markers for nearby contacts
    nearbyContacts.forEach(contact => {
      const marker = L.circleMarker([contact.lat, contact.lng], {
        radius: 12,
        fillColor: '#7c3aed',
        color: '#fff',
        weight: 2,
        fillOpacity: 1,
        interactive: true,
        zIndexOffset: 1000
      })
      .bindTooltip(`👤 ${contact.name}`, {
        permanent: true,
        direction: 'top',
        offset: [0, -14],
        className: 'contact-label'
      })
      .bindPopup(`
        <div style="background:#1a2332;color:white;
          padding:12px;border-radius:10px;
          min-width:170px;border:1px solid #7c3aed;
          font-family:sans-serif;">
          <div style="color:#a78bfa;font-weight:700;
            font-size:14px;margin-bottom:6px;">
            👤 ${contact.name}
          </div>
          <div style="color:#94a3b8;font-size:12px;
            margin-bottom:4px;">
            📍 ${contact.address}
          </div>
          <div style="color:#94a3b8;font-size:12px;
            margin-bottom:10px;">
            🔗 ${contact.relation}
          </div>
          <a href="tel:${contact.phone}" style="
            display:block;
            background:linear-gradient(135deg,#7c3aed,#ec4899);
            color:white;text-align:center;
            padding:8px;border-radius:6px;
            text-decoration:none;font-size:13px;
            font-weight:600;">
            📞 Call ${contact.name}
          </a>
        </div>
      `)
      .addTo(map);

      stopMarkersRef.current.push(marker);
    });
  }, [map, selectedRoute, routes]);

  useEffect(() => {
    if (!map || !routes?.length) return
    const allCoords = routes.flatMap(r => r.coordinates || [])
    if (allCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(allCoords)
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 14, duration: 1.2 })
      } catch(e) { console.log('bounds error:', e) }
    }
  }, [routes, map])

  useEffect(() => {
    if (!map || !selectedRoute) return
    if (selectedRoute?.coordinates?.length > 0) {
      try {
        const bounds = L.latLngBounds(selectedRoute.coordinates)
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 0.8 })
      } catch(e) { console.log('bounds error:', e) }
    }
  }, [selectedRoute, map])

  useEffect(() => {
    if (!map) return
    if (!selectedRoute && (!routes || routes.length === 0) && userCoords) {
      map.flyTo(userCoords, 13, { duration: 1.5 })
    }
  }, [userCoords, map, selectedRoute, routes])
  
  return null
}

const MapView = ({
  routes = [],
  selectedRoute = null,
  onRouteSelect,
  startCoords,
  endCoords,
  userCoords
}) => {
  return (
    <MapContainer
      style={{ height: '100vh', width: '100vw', position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      center={userCoords || [22.7196, 75.8577]}
      zoom={13}
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='© OpenStreetMap © CARTO'
      />
      
      <MapUpdater
        selectedRoute={selectedRoute}
        userCoords={userCoords}
        routes={routes}
      />
      
      {routes.map((route) => {
        const isSelected = selectedRoute?.id === route.id
        const noneSelected = !selectedRoute
        
        return (
          <Polyline
            key={route.id}
            positions={route.coordinates || []}
            pathOptions={{
              color: route.color,
              // Recommended route is thick and solid, others are dashed
              weight: isSelected ? 10 : (route.recommended ? 7 : 4),
              opacity: noneSelected ? (route.recommended ? 1 : 0.6) : isSelected ? 1.0 : 0.2,
              dashArray: route.recommended ? null : '8, 8',
              smoothFactor: 5,
              lineCap: 'round',
              lineJoin: 'round'
            }}
            eventHandlers={{ click: () => onRouteSelect && onRouteSelect(route) }}
          />
        )
      })}
      
      {startCoords && <Marker position={startCoords} icon={L.divIcon({ className: '', html: `<div style="width:30px;height:40px;background:#00C896;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,200,150,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;transform:rotate(45deg);"></div></div>`, iconSize: [30, 40], iconAnchor: [15, 40] })} />}
      {endCoords && <Marker position={endCoords} icon={L.divIcon({ className: '', html: `<div style="width:30px;height:40px;background:#EF4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;transform:rotate(45deg);"></div></div>`, iconSize: [30, 40], iconAnchor: [15, 40] })} />}
      {userCoords && <Marker position={userCoords} icon={L.divIcon({ className: '', html: `<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })} />}
    </MapContainer>
  )
}

export default MapView
