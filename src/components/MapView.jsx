import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap, ZoomControl, Popup } from 'react-leaflet'
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
    
    if (!contacts.length) return;

    // 3. Route ko equal parts mein divide karo aur contacts ko SNAP karo
    // Har contact ko ek part pe place karo taaki woh hamesha dikhein
    const totalPoints = routeCoords.length;
    const segment = Math.floor(totalPoints / (contacts.length + 1));

    // 4. Snapped contacts ke markers lagao
    contacts.forEach((contact, idx) => {
      const pointIndex = segment * (idx + 1);
      const snapPoint = routeCoords[Math.min(pointIndex, totalPoints - 1)];
      
      if (!snapPoint) return;

      const [lat, lng] = snapPoint;

      const marker = L.circleMarker([lat, lng], {
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


  useEffect(() => {
    if (!map || !routes || routes.length === 0) return;
    
    // Determine which route to use
    const activeRoute = routes[selectedRouteIndex] || routes[0];
    if (activeRoute?.coordinates) {
      updateContactsForRoute(map, activeRoute.coordinates);
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
        const isUnsafe = route.score < 40
        
        return (
          <Polyline
            key={route.id}
            positions={route.coordinates || []}
            pathOptions={{
              color: route.color,
              weight: isSelected ? 8 : 5,
              opacity: isSelected ? 1 : 0.6,
              dashArray: isUnsafe ? '10, 10' : (isSelected ? null : '12, 8'),
              smoothFactor: 5,
              lineCap: 'round',
              lineJoin: 'round'
            }}
            eventHandlers={{ click: () => onRouteSelect && onRouteSelect(index) }}
          >
            <Popup>
              <div style={{
                background: '#1a2332',
                color: 'white',
                padding: '12px',
                borderRadius: '10px',
                minWidth: '190px',
                border: `1px solid ${route.color}`,
                fontFamily: 'sans-serif'
              }}>
                <div style={{
                  color: route.color,
                  fontWeight: '700',
                  fontSize: '15px',
                  marginBottom: '8px'
                }}>
                  {route.icon} {route.label} ROUTE
                </div>
                <div style={{
                  font_size: '22px',
                  fontWeight: '700',
                  color: route.color,
                  marginBottom: '4px'
                }}>
                  {route.score}<span style={{
                    fontSize: '12px',
                    color: '#64748b'
                  }}>/100</span>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '8px'
                }}>
                  📍 {route.dist} · ⏱ {route.time}
                </div>
                {route.label === 'UNSAFE' ? (
                  <div style={{
                    padding: '6px 8px',
                    background: 'rgba(239,68,68,0.15)',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#ef4444'
                  }}>
                    ⚠️ AI Alert: Unsafe Route
                  </div>
                ) : (
                  <div style={{
                    padding: '6px 8px',
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid #10b981',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#10b981'
                  }}>
                    ✅ AI Recommended Route
                  </div>
                )}
              </div>
            </Popup>
          </Polyline>
        )
      })}
      
      {startCoords && <Marker position={startCoords} icon={L.divIcon({ className: '', html: `<div style="width:30px;height:40px;background:#00C896;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,200,150,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;transform:rotate(45deg);"></div></div>`, iconSize: [30, 40], iconAnchor: [15, 40] })} />}
      {endCoords && <Marker position={endCoords} icon={L.divIcon({ className: '', html: `<div style="width:30px;height:40px;background:#EF4444;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;background:white;border-radius:50%;transform:rotate(45deg);"></div></div>`, iconSize: [30, 40], iconAnchor: [15, 40] })} />}
      {userCoords && <Marker position={userCoords} icon={L.divIcon({ className: '', html: `<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })} />}
    </MapContainer>
  )
}

export default MapView
