import React, { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mockContacts } from '../data/mockData'

const isContactNearRoute = (contactLoc, routeCoords) => {
  if (!contactLoc || !routeCoords?.length) return false
  return routeCoords.some(([lat, lng]) => {
    // Simple rough distance check as requested (~500m-800m)
    const dist = Math.sqrt(
      Math.pow(lat - contactLoc.lat, 2) +
      Math.pow(lng - contactLoc.lng, 2)
    )
    return dist < 0.008
  })
}

const MapUpdater = ({ 
  selectedRoute, 
  userCoords,
  routes
}) => {
  const map = useMap();
  const contactMarkersRef = useRef([]);

  useEffect(() => {
    if (!map) return;

    // 1. Clear old contact markers
    contactMarkersRef.current.forEach(m => map.removeLayer(m));
    contactMarkersRef.current = [];

    // 2. Determine active route coords
    const activeRoute = selectedRoute || (routes && routes[0]);
    if (!activeRoute?.coordinates) return;

    // 3. Filter mock contacts near route
    mockContacts.forEach(contact => {
      if (isContactNearRoute(contact.location, activeRoute.coordinates)) {
        const markerHtml = `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: ${contact.isOnline ? '#10b981' : '#64748b'};
              border: 3px solid white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              cursor: pointer;
            ">
              ${contact.avatar}
            </div>
            <div style="
              background: rgba(0,0,0,0.8);
              color: white;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
              text-align: center;
              margin-top: 2px;
              white-space: nowrap;
              font-weight: 600;
            ">
              ${contact.name}
            </div>
          </div>
        `

        const icon = L.divIcon({
          html: markerHtml,
          className: '',
          iconSize: [40, 55],
          iconAnchor: [20, 55]
        })

        const marker = L.marker(
          [contact.location.lat, contact.location.lng],
          { icon }
        ).addTo(map)

        marker.bindPopup(`
          <div style="background: #1a2332; color: #f1f5f9; padding: 12px; border-radius: 8px; min-width: 160px; font-family: sans-serif;">
            <div style="font-size: 24px; text-align: center; margin-bottom: 8px;">
              ${contact.avatar}
            </div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; text-align: center;">
              ${contact.name}
            </div>
            <div style="color: ${contact.isOnline ? '#10b981' : '#64748b'}; font-size: 12px; margin-bottom: 8px; text-align: center;">
              ${contact.isOnline ? '🟢 Online' : '⚫ ' + contact.lastSeen}
            </div>
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 12px; text-align: center;">
              📍 ${contact.location.address}
            </div>
            <a href="tel:${contact.phone}"
              style="display: block; background: linear-gradient(135deg, #7c3aed, #ec4899); color: white; text-align: center; padding: 10px; border-radius: 8px; font-size: 12px; text-decoration: none; font-weight: 600;">
              📞 Call ${contact.name}
            </a>
          </div>
        `, {
          className: 'custom-popup'
        })

        contactMarkersRef.current.push(marker)
      }
    })
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
