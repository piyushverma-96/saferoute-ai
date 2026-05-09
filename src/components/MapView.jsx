import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker function - Teardrop CSS pins
const createCustomPin = (color) => {
  return L.divIcon({
    className: 'custom-pin-wrapper',
    html: `
      <div style="
        width: 30px; 
        height: 40px; 
        background: ${color}; 
        border-radius: 50% 50% 50% 0px; 
        transform: rotate(-45deg); 
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 10px; height: 10px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40], // Anchor exactly at bottom tip
    popupAnchor: [0, -40]
  });
};

// Global canvas renderer for paths to boost performance
const globalCanvasRenderer = L.canvas({ 
  padding: 0.5,
  tolerance: 5 
});

// Custom Animated Polyline component
const AnimatedPolyline = ({ positions, pathOptions, popupContent, delay, isSelected }) => {
  const polylineRef = useRef(null);

  useEffect(() => {
    if (polylineRef.current) {
      const el = polylineRef.current.getElement();
      // Only SVG elements have style
      if (el && el.style) {
        el.style.transition = 'stroke-dashoffset 1.5s ease-out, stroke-width 0.3s ease, opacity 0.3s ease';
        el.style.strokeDasharray = '20000 20000';
        el.style.strokeDashoffset = '20000';
        
        setTimeout(() => {
          el.style.strokeDashoffset = '0';
        }, delay);
      }
    }
  }, [delay]);

  return (
    <Polyline
      ref={polylineRef}
      positions={positions}
      pathOptions={{ ...pathOptions, renderer: globalCanvasRenderer }}
    >
      <Popup className="dark-popup">
        <div className="font-sans">
          {popupContent}
        </div>
      </Popup>
    </Polyline>
  );
};

// Add user location marker (blue dot)
const userLocationIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background: #3B82F6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.3);
      animation: pulse 2s infinite;
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Component to handle map bounds when routes change
function MapUpdater({ startPoint, endPoint, routes, userCoords, setMapLoading }) {
  const map = useMap();

  useEffect(() => {
    const handleLoad = () => {
      setMapLoading(false);
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    map.on('load', handleLoad);
    map.on('tileload', handleLoad);
    
    // Fallback if events don't fire
    const timer = setTimeout(() => setMapLoading(false), 2000);

    return () => {
      map.off('load', handleLoad);
      map.off('tileload', handleLoad);
      clearTimeout(timer);
    };
  }, [map, setMapLoading]);

  useEffect(() => {
    if (routes && routes.length > 0) {
      const bounds = [];
      routes.forEach(route => {
        if (route.geometry && route.geometry.coordinates) {
          route.geometry.coordinates.forEach(c => bounds.push([c[1], c[0]]));
        }
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    } else if (startPoint && endPoint) {
      map.fitBounds([
        [startPoint.lat, startPoint.lon],
        [endPoint.lat, endPoint.lon]
      ], { padding: [60, 60] });
    } else if (userCoords) {
      map.flyTo(userCoords, 14, { duration: 1.5 });
    } else if (startPoint) {
      map.setView([startPoint.lat, startPoint.lon], 13);
    }
  }, [map, startPoint, endPoint, routes, userCoords]);

  return null;
}

export default function MapView({ routes, startPoint, endPoint, selectedRouteId, userCoords }) {
  const defaultCenter = [22.7196, 75.8577]; // Indore
  const [mapLoading, setMapLoading] = useState(true);

  return (
    <div className="w-full h-[calc(100vh-64px)] lg:h-full relative z-0">
      
      {mapLoading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          background: '#0A0A0F',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px', 
            border: '4px solid #7C3AED',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#A0A0B0' }}>
            Loading map...
          </p>
        </div>
      )}

      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        minZoom={10}
        maxZoom={18}
        style={{ width: '100%', height: '100%' }}
        preferCanvas={true}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap &copy; CARTO"
          maxZoom={19}
          minZoom={5}
          tileSize={256}
          zoomOffset={0}
          keepBuffer={4}
          updateWhenIdle={false}
          updateWhenZooming={false}
          detectRetina={true}
          crossOrigin={true}
        />
        
        <MapUpdater 
          startPoint={startPoint} 
          endPoint={endPoint} 
          routes={routes} 
          userCoords={userCoords} 
          setMapLoading={setMapLoading}
        />

        {userCoords && (
          <Marker 
            position={userCoords} 
            icon={userLocationIcon}
          />
        )}

        {startPoint && (
          <Marker 
            position={[startPoint.lat, startPoint.lon]} 
            icon={createCustomPin('#00C896')}
          >
            <Popup className="dark-popup">
              <b>Start:</b> {startPoint.name || 'Your Location'}
            </Popup>
          </Marker>
        )}

        {endPoint && (
          <Marker 
            position={[endPoint.lat, endPoint.lon]} 
            icon={createCustomPin('#EF4444')}
          >
            <Popup className="dark-popup">
              <b>Destination:</b> {endPoint.name}
            </Popup>
          </Marker>
        )}

        {routes && routes.map((route, i) => {
          if (!route.geometry || !route.geometry.coordinates) return null;
          
          const offset = i === 1 ? 0.0002 : i === 2 ? -0.0002 : 0;
          const positions = route.geometry.coordinates.map(c => [c[1] + offset, c[0] + offset]);
          
          const isSelected = selectedRouteId === route.id;
          const weight = isSelected ? 8 : 4;
          const opacity = isSelected ? 1.0 : (selectedRouteId !== null ? 0.4 : 0.85);
          const delay = i * 300; 

          return (
            <AnimatedPolyline
              key={route.id}
              positions={positions}
              delay={delay}
              isSelected={isSelected}
              pathOptions={{
                color: route.color || (i === 0 ? '#00C896' : i === 1 ? '#F59E0B' : '#EF4444'),
                weight: weight,
                opacity: opacity,
                lineJoin: 'round',
                lineCap: 'round',
                className: isSelected ? 'route-selected' : 'route-unselected'
              }}
              popupContent={
                <>
                  <b style={{ color: route.color || '#00C896' }}>Safety: {route.score}/100</b><br/>
                  {route.dist} · ~{route.time}
                </>
              }
            />
          );
        })}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[900] bg-brand-surface/90 backdrop-blur border border-brand-border rounded-lg p-3 shadow-xl">
        <h4 className="label-text mb-2">Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00C896]"></span>
            <span className="text-brand-text-secondary">Safe (70-100)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
            <span className="text-brand-text-secondary">Moderate (40-69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
            <span className="text-brand-text-secondary">High Risk (0-39)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
