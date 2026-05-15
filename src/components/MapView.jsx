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
  selectedRouteIndex, 
  userCoords,
  routes
}) => {
  const map = useMap();
  const contactMarkersRef = useRef([]);
  const stopMarkersRef = useRef([]);

  const updateContactsForRoute = (map, routeCoords) => {
    // 1. Purane contact markers hatao
    contactMarkersRef.current.forEach(m => map.removeLayer(m));
    contactMarkersRef.current = [];

    if (!routeCoords || routeCoords.length === 0) return;

    // 2. Load contacts from storage
    const contacts = JSON.parse(
      localStorage.getItem('trusted_contacts') || '[]'
    );

    // 3. Sirf selected route ke 3km range wale filter karo
    const nearby = contacts.filter(contact => {
      if (!contact.lat || !contact.lng) return false;
      return routeCoords.some(([lat, lng]) => {
        const R = 6371;
        const dLat = (contact.lat - lat) * Math.PI / 180;
        const dLng = (contact.lng - lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
          Math.cos(lat * Math.PI / 180) *
          Math.cos(contact.lat * Math.PI / 180) *
          Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= 3.0; // 3km threshold
      });
    });

    // 4. Filtered contacts ke markers lagao
    nearby.forEach(contact => {
      const marker = L.circleMarker([contact.lat, contact.lng], {
        radius: 12,
        fillColor: '#7c3aed',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1,
        zIndexOffset: 1000
      })
      .bindTooltip(`👤 ${contact.name}`, {
        permanent: true,
        direction: 'top',
        offset: [0, -14],
        className: 'contact-label'
      })
      .bindPopup(`
        <div style="background:#1a2332;color:white;padding:12px;
          border-radius:10px;min-width:170px;border:1px solid #7c3aed;
          font-family:sans-serif;">
          <div style="color:#a78bfa;font-weight:700;font-size:14px">
            👤 ${contact.name}
          </div>
          <div style="color:#94a3b8;font-size:12px;margin-top:4px">
            📍 ${contact.address}
          </div>
          <div style="color:#94a3b8;font-size:12px;margin-top:4px">
            🔗 ${contact.relation}
          </div>
          <a href="tel:${contact.phone}" style="display:block;
            margin-top:10px;background:linear-gradient(135deg,#7c3aed,#ec4899);
            color:white;text-align:center;padding:8px;border-radius:6px;
            text-decoration:none;font-size:13px;font-weight:600">
            📞 Call ${contact.name}
          </a>
        </div>
      `)
      .addTo(map);

      contactMarkersRef.current.push(marker);
    });
  };

  const showSafeStops = (map, routeCoords, routeIdx) => {
    // Clear old stops
    stopMarkersRef.current.forEach(m => map.removeLayer(m));
    stopMarkersRef.current = [];

    if (!routeCoords || routeCoords.length === 0) return;

    // Define safe stops with dynamic online status based on route
    // Safest (0) = 3 online, Balanced (1) = 2 online, High Risk (2) = 1 online
    const routeSafeStops = safeStops.map((stop, i) => ({
      ...stop,
      isOnline: routeIdx === 0 ? true : (routeIdx === 1 ? i < 2 : i < 1)
    }));

    routeSafeStops.forEach((stop, i) => {
      const point = getPointOnRoute(routeCoords, stop.position);
      if (!point) return;

      const html = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 2px; height: 12px; background: ${stop.isOnline ? '#10b981' : '#64748b'};"></div>
          <div style="background: ${stop.isOnline ? '#064e3b' : '#1e293b'}; border: 2px solid ${stop.isOnline ? '#10b981' : '#64748b'}; border-radius: 12px; padding: 6px 10px; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); white-space: nowrap;">
            <span style="font-size:16px">${stop.avatar}</span>
            <div>
              <div style="color: white; font-size: 11px; font-weight: 600;">${stop.name}</div>
              <div style="color: ${stop.isOnline ? '#10b981' : '#94a3b8'}; font-size: 9px;">${stop.isOnline ? '🟢 Safe Stop' : '⚫ Offline'}</div>
            </div>
          </div>
          <div style="background: #7c3aed; color: white; font-size: 9px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 2px; font-weight: 600;">${i + 1}</div>
        </div>
      `;

      const icon = L.divIcon({ html, className: '', iconSize: [80, 70], iconAnchor: [40, 35] });
      const marker = L.marker(point, { icon }).addTo(map);

      marker.bindPopup(`
        <div style="background: #1a2332; border-radius: 12px; padding: 16px; min-width: 180px; color: #f1f5f9;">
          <div style="text-align: center; font-size: 32px; margin-bottom: 8px;">${stop.avatar}</div>
          <div style="font-weight: 600; font-size: 15px; text-align: center; margin-bottom: 4px;">${stop.name}</div>
          <div style="color: ${stop.isOnline ? '#10b981' : '#64748b'}; font-size: 12px; text-align: center; margin-bottom: 4px;">${stop.isOnline ? '🟢 Online — Safe Stop' : '⚫ Offline'}</div>
          <div style="color: #64748b; font-size: 11px; text-align: center; margin-bottom: 12px;">📍 ${stop.address}</div>
          <div style="color: #94a3b8; font-size: 11px; background: rgba(124,58,237,0.1); border: 1px solid #7c3aed; border-radius: 8px; padding: 8px; text-align: center; margin-bottom: 10px;">🛡 You can safely stop here if needed</div>
          <div style="display: flex; gap: 8px;">
            <a href="tel:${stop.phone}" style="flex: 1; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; text-align: center; padding: 8px; border-radius: 8px; font-size: 12px; text-decoration: none; display: block;">📞 Call</a>
            <a href="sms:${stop.phone}" style="flex: 1; background: #1e293b; border: 1px solid #374151; color: #94a3b8; text-align: center; padding: 8px; border-radius: 8px; font-size: 12px; text-decoration: none; display: block;">💬 SMS</a>
          </div>
        </div>
      `, { className: 'dark-popup', maxWidth: 220 });

      stopMarkersRef.current.push(marker);
    });
  };

  useEffect(() => {
    if (!map || !routes || routes.length === 0) return;
    
    // Determine which route to use
    const activeRoute = routes[selectedRouteIndex] || routes[0];
    if (activeRoute?.coordinates) {
      updateContactsForRoute(map, activeRoute.coordinates);
      showSafeStops(map, activeRoute.coordinates, selectedRouteIndex);
    }
  }, [map, selectedRouteIndex, routes]);

  useEffect(() => {
    if (!map || !routes?.length) return;
    const allCoords = routes.flatMap(r => r.coordinates || []);
    if (allCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(allCoords);
        map.flyToBounds(bounds, { padding: [80, 80], maxZoom: 14, duration: 1.2 });
      } catch(e) { console.log('bounds error:', e); }
    }
  }, [routes, map]);

  useEffect(() => {
    if (!map || !routes || !routes[selectedRouteIndex]) return;
    const coords = routes[selectedRouteIndex].coordinates;
    if (coords && coords.length > 0) {
      try {
        const bounds = L.latLngBounds(coords);
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 0.8 });
      } catch(e) { console.log('bounds error:', e); }
    }
  }, [selectedRouteIndex, map, routes]);

  useEffect(() => {
    if (!map) return;
    if (!routes || routes.length === 0) {
      if (userCoords) {
        map.flyTo(userCoords, 13, { duration: 1.5 });
      }
    }
  }, [userCoords, map, routes]);
  
  return null;
}

const MapView = ({
  routes = [],
  selectedRoute = null,
  selectedRouteIndex = 0,
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
        selectedRouteIndex={selectedRouteIndex}
        userCoords={userCoords}
        routes={routes}
      />
      
      {routes.map((route, index) => {
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
            eventHandlers={{ click: () => onRouteSelect && onRouteSelect(index) }}
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
