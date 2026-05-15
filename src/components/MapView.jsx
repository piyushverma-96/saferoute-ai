import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
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

    // 3. Determine route index for online simulation
    const routeIndex = routes.findIndex(r => r.id === activeRoute.id);

    // 4. Place stops on route
    safeStops.forEach((stop, i) => {
      const point = getPointOnRoute(activeRoute.coordinates, stop.position);
      if (!point) return;

      // Simulated logic: safest route = more online contacts
      let isOnline = stop.isOnline;
      if (routeIndex === 0) isOnline = true;
      if (routeIndex === 1) isOnline = (i < 2);
      if (routeIndex === 2) isOnline = (i < 1);

      // Stop marker HTML
      const html = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <!-- Connector line to route -->
          <div style="width: 2px; height: 12px; background: ${isOnline ? '#10b981' : '#64748b'};"></div>
          
          <!-- Contact bubble -->
          <div style="
            background: ${isOnline ? '#064e3b' : '#1e293b'};
            border: 2px solid ${isOnline ? '#10b981' : '#64748b'};
            border-radius: 12px;
            padding: 6px 10px;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            white-space: nowrap;
          ">
            <span style="font-size:16px">${stop.avatar}</span>
            <div>
              <div style="color: white; font-size: 11px; font-weight: 600;">${stop.name}</div>
              <div style="color: ${isOnline ? '#10b981' : '#94a3b8'}; font-size: 9px;">
                ${isOnline ? '🟢 Safe Stop' : '⚫ Offline'}
              </div>
            </div>
          </div>
          
          <!-- Stop number badge -->
          <div style="
            background: #7c3aed;
            color: white;
            font-size: 9px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 2px;
            font-weight: 600;
          ">
            ${i + 1}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: '',
        iconSize: [80, 70],
        iconAnchor: [40, 35]
      });

      const marker = L.marker(point, { icon }).addTo(map);

      // Popup when clicked
      marker.bindPopup(`
        <div style="background: #1a2332; border-radius: 12px; padding: 16px; min-width: 180px; color: #f1f5f9;">
          <div style="text-align: center; font-size: 32px; margin-bottom: 8px;">${stop.avatar}</div>
          <div style="font-weight: 600; font-size: 15px; text-align: center; margin-bottom: 4px;">${stop.name}</div>
          <div style="color: ${isOnline ? '#10b981' : '#64748b'}; font-size: 12px; text-align: center; margin-bottom: 4px;">
            ${isOnline ? '🟢 Online — Safe Stop' : '⚫ Offline'}
          </div>
          <div style="color: #64748b; font-size: 11px; text-align: center; margin-bottom: 12px;">📍 ${stop.address}</div>
          <div style="color: #94a3b8; font-size: 11px; background: rgba(124,58,237,0.1); border: 1px solid #7c3aed; border-radius: 8px; padding: 8px; text-align: center; margin-bottom: 10px;">
            🛡 You can safely stop here if needed
          </div>
          
          <!-- Action buttons -->
          <div style="display: flex; gap: 8px;">
            <a href="tel:${stop.phone}" style="flex: 1; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; text-align: center; padding: 8px; border-radius: 8px; font-size: 12px; text-decoration: none; display: block;">📞 Call</a>
            <a href="sms:${stop.phone}" style="flex: 1; background: #1e293b; border: 1px solid #374151; color: #94a3b8; text-align: center; padding: 8px; border-radius: 8px; font-size: 12px; text-decoration: none; display: block;">💬 SMS</a>
          </div>
        </div>
      `, { className: 'dark-popup', maxWidth: 220 });

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
