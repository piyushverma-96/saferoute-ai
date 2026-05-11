import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Map updater component
const MapUpdater = ({ 
  selectedRoute, 
  userCoords,
  routes
}) => {
  const map = useMap()
  
  useEffect(() => {
    if (!map || !routes?.length) return
    
    // Collect ALL coordinates from all 3 routes
    const allCoords = routes.flatMap(
      r => r.coordinates || []
    )
    
    if (allCoords.length > 0) {
      try {
        const bounds = L.latLngBounds(allCoords)
        map.flyToBounds(bounds, {
          padding: [80, 80],
          maxZoom: 14,
          duration: 1.2
        })
      } catch(e) {
        console.log('bounds error:', e)
      }
    }
  }, [routes, map])

  useEffect(() => {
    if (!map || !selectedRoute) return
    
    if (selectedRoute?.coordinates?.length > 0) {
      try {
        const bounds = L.latLngBounds(selectedRoute.coordinates)
        map.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15,
          duration: 0.8
        })
      } catch(e) {
        console.log('bounds error:', e)
      }
    }
  }, [selectedRoute, map])
  
  useEffect(() => {
    if (!map) return
    if (!selectedRoute && (!routes || routes.length === 0) && userCoords) {
      map.flyTo(userCoords, 13, {
        duration: 1.5
      })
    }
  }, [userCoords, map, selectedRoute, routes])
  
  return null
}

// Green start pin
const createStartPin = () => L.divIcon({
  className: '',
  html: `<div style="
    width:30px;height:40px;
    background:#00C896;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 2px 8px rgba(0,200,150,0.5);
    display:flex;align-items:center;
    justify-content:center;
  "><div style="
    width:8px;height:8px;
    background:white;
    border-radius:50%;
    transform:rotate(45deg);
  "></div></div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40]
})

// Red end pin
const createEndPin = () => L.divIcon({
  className: '',
  html: `<div style="
    width:30px;height:40px;
    background:#EF4444;
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    border:3px solid white;
    box-shadow:0 2px 8px rgba(239,68,68,0.5);
    display:flex;align-items:center;
    justify-content:center;
  "><div style="
    width:8px;height:8px;
    background:white;
    border-radius:50%;
    transform:rotate(45deg);
  "></div></div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40]
})

// Blue user location dot
const createUserPin = () => L.divIcon({
  className: '',
  html: `<div style="
    width:16px;height:16px;
    background:#3B82F6;
    border:3px solid white;
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(59,130,246,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
})

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
      style={{
        height: '100vh',
        width: '100vw',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1
      }}
      center={userCoords || [22.7196, 75.8577]}
      zoom={13}
      minZoom={5}
      maxZoom={18}
      preferCanvas={true}
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='© OpenStreetMap © CARTO'
        maxZoom={19}
        keepBuffer={4}
        updateWhenIdle={false}
        updateWhenZooming={false}
        detectRetina={true}
      />
      
      <MapUpdater
        selectedRoute={selectedRoute}
        userCoords={userCoords}
        routes={routes}
      />
      
      {/* Draw all routes */}
      {routes.map((route) => {
        const isSelected = 
          selectedRoute?.id === route.id
        const noneSelected = 
          selectedRoute === null || 
          selectedRoute === undefined
        
        return (
          <Polyline
            key={route.id}
            positions={route.coordinates || []}
            pathOptions={{
              color: route.color,
              weight: isSelected ? 8 
                    : route.weight,
              opacity: noneSelected ? 0.85
                     : isSelected ? 1.0 : 0.2,
              dashArray: isSelected 
                ? null 
                : route.dashArray,
              smoothFactor: 5,
              lineCap: 'round',
              lineJoin: 'round'
            }}
            eventHandlers={{
              click: () => {
                if (onRouteSelect) {
                  onRouteSelect(route)
                }
              }
            }}
          />
        )
      })}
      
      {/* Start marker */}
      {startCoords && (
        <Marker
          position={startCoords}
          icon={createStartPin()}
        />
      )}
      
      {/* End marker */}
      {endCoords && (
        <Marker
          position={endCoords}
          icon={createEndPin()}
        />
      )}
      
      {/* User location */}
      {userCoords && (
        <Marker
          position={userCoords}
          icon={createUserPin()}
        />
      )}
    </MapContainer>
  )
}

export default MapView
