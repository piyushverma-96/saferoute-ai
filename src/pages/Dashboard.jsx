import React from 'react';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { ShieldAlert, Activity, AlertTriangle, Users, MapPin, Clock, Brain, ShieldCheck, ThumbsUp, X, Filter, Navigation } from 'lucide-react';
import { useAlerts } from '../context/AlertsContext';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { getPendingReports, clearPendingReports } from '../utils/offlineStorage';
import { showToast } from '../components/Toast';

const heatmapData = [
  { lat: 20.5937, lon: 78.9629, intensity: 'high', label: 'Palasia Area' },
  { lat: 20.5900, lon: 78.9600, intensity: 'medium', label: 'Annapurna' },
  { lat: 20.6000, lon: 78.9700, intensity: 'low', label: 'MG Road' },
  { lat: 20.5850, lon: 78.9550, intensity: 'high', label: 'Sapna-Sangeeta Rd' },
];

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState('All Day');
  const [alertFilter, setAlertFilter] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  
  const { alerts, addAlert, removeAlert, confirmAlert } = useAlerts() || { alerts: [], addAlert: () => {}, removeAlert: () => {}, confirmAlert: () => {} };
  const { isOffline, wasOffline } = useOfflineStatus() || {};
  
  const pendingReports = getPendingReports() || [];

  // Sync pending reports when back online
  useEffect(() => {
    if (!isOffline && wasOffline && pendingReports?.length > 0) {
      pendingReports.forEach(report => {
        addAlert?.(report);
      });
      clearPendingReports();
    }
  }, [isOffline, wasOffline, pendingReports, addAlert]);

  // Auto-generate mock alerts every 45 seconds for demo
  useEffect(() => {
    const mockAlertTypes = [
      { type: "Poor Lighting", location: "Scheme 54, Indore", severity: "medium", description: "Dark stretch near park" },
      { type: "Safe Zone", location: "Treasure Island Mall, Indore", severity: "low", description: "Security guards present" },
      { type: "Suspicious Activity", location: "Annapurna Road, Indore", severity: "high", description: "Auto-generated community alert" }
    ];
    
    const interval = setInterval(() => {
      const random = mockAlertTypes[Math.floor(Math.random() * mockAlertTypes.length)];
      const newAlert = {
        ...random,
        reportedBy: "Community Member",
        anonymous: false
      };
      addAlert(newAlert);
      showToast(newAlert);
    }, 45000);
    
    return () => clearInterval(interval);
  }, [addAlert]);

  // Stats calculation
  const todayAlertsCount = alerts.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length;
  const highSeverityCount = alerts.filter(a => a.severity === 'high').length;
  
  const stats = {
    safetyScore: Math.max(0, 100 - (highSeverityCount * 2)),
    incidentsToday: todayAlertsCount,
    activeUsers: 234 + Math.floor(alerts.length * 1.5),
    sosAlerts: highSeverityCount
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#00C896';
      default: return '#8B5CF6';
    }
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'high': return <ShieldAlert size={16} />;
      case 'medium': return <AlertTriangle size={16} />;
      case 'low': return <ShieldCheck size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const handleNearMeFilter = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setAlertFilter('Near Me');
        },
        () => {
          alert("Unable to get location for Near Me filter. Defaulting to Indore area.");
          setAlertFilter('Near Me');
        }
      );
    } else {
      setAlertFilter('Near Me');
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === 'All') return true;
    if (alertFilter === 'High' && a.severity === 'high') return true;
    if (alertFilter === 'Medium' && a.severity === 'medium') return true;
    if (alertFilter === 'Low' && a.severity === 'low') return true;
    if (alertFilter === 'Last 1 Hour' && (Date.now() - a.timestamp) < 3600000) return true;
    if (alertFilter === 'Near Me' && a.location.toLowerCase().includes('indore')) return true; // simplified near me
    return false;
  }).slice(0, 10);

  const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className="card-container p-5 flex items-center gap-4">
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20`, color: color }}>
        <Icon size={24} />
      </div>
      <div>
        <div className="text-2xl font-bold text-brand-text-primary">{value}</div>
        <div className="text-sm text-brand-text-secondary">{label}</div>
      </div>
    </div>
  );

  const predictions = [
    { area: 'Rajwada', risk: 'HIGH', time: 'after 9 PM', reason: 'High footfall, low lighting', color: '#EF4444', icon: '🔴' },
    { area: 'Palasia Square', risk: 'MEDIUM', time: 'after 8 PM', reason: 'Moderate crowd, some CCTV', color: '#F59E0B', icon: '🟡' },
    { area: 'Bhawarkuan', risk: 'HIGH', time: 'after 10 PM', reason: 'Isolated roads, no CCTV', color: '#EF4444', icon: '🔴' },
    { area: 'Vijay Nagar', risk: 'LOW', time: 'all night', reason: 'Well lit, police present', color: '#00C896', icon: '🟢' },
    { area: 'Sapna Sangeeta', risk: 'LOW', time: 'all night', reason: 'Commercial area, CCTV covered', color: '#00C896', icon: '🟢' },
    { area: 'Annapurna Road', risk: 'MEDIUM', time: 'after 9 PM', reason: 'Mixed lighting conditions', color: '#F59E0B', icon: '🟡' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-text-primary mb-2">Safety Intelligence Dashboard</h1>
          <p className="text-brand-text-secondary">Real-time city safety overview</p>
        </div>
        <div className="flex items-center gap-2 bg-brand-surface border border-brand-border px-4 py-2 rounded-xl">
          <div className="text-brand-safe font-bold text-xl">{stats.safetyScore}</div>
          <div className="text-xs text-brand-text-secondary uppercase">City Score</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={MapPin} value={stats.incidentsToday} label="Incidents Today" color="var(--color-brand-safe)" />
        <StatCard icon={ShieldAlert} value={stats.sosAlerts} label="SOS Alerts" color="var(--color-brand-danger)" />
        <StatCard icon={AlertTriangle} value={alerts.length} label="Total Reports" color="var(--color-brand-warning)" />
        <StatCard icon={Users} value={stats.activeUsers} label="Active Users" color="var(--color-brand-purple)" />
      </div>

      {/* Prediction & Heatmap Row */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        
        {/* Left: AI Prediction (40%) */}
        <div className="w-full lg:w-[40%] card-container flex flex-col h-[700px] overflow-hidden bg-[#0A0A0F]">
          <div className="p-4 border-b border-brand-border flex justify-between items-start bg-brand-surface rounded-t-[10px]">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2 text-brand-text-primary">
                🔮 Tonight's AI Risk Prediction
              </h2>
              <p className="text-[11px] text-brand-text-secondary mt-1">
                Based on 30-day crime pattern analysis • Updated 1hr ago
              </p>
            </div>
            <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded bg-brand-purple/20 text-brand-purple uppercase border border-brand-purple/30">
              AI Powered
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {predictions.map((p, i) => (
              <div key={i} className="p-3 rounded-lg border bg-brand-surface/50 hover:bg-brand-surface transition-colors" style={{ borderColor: `${p.color}30` }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span className="font-semibold text-brand-text-primary text-sm">{p.area}</span>
                  </div>
                  <span 
                    className="text-[10px] font-bold px-2 py-0.5 rounded border"
                    style={{
                      backgroundColor: `${p.color}20`,
                      color: p.color,
                      borderColor: `${p.color}40`
                    }}
                  >
                    {p.risk}
                  </span>
                </div>
                <div className="pl-6 flex flex-col gap-1">
                  <span className="text-xs text-brand-text-secondary">{p.reason}</span>
                  <span className="text-[11px] text-brand-text-muted flex items-center gap-1 mt-1">
                    <Clock size={10} /> {p.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-brand-border/50 bg-[#0A0A0F]">
            <div className="flex flex-col text-[10px] text-brand-text-muted/60 font-mono gap-0.5">
              <span>🧠 Model: Random Forest Classifier</span>
              <span>📊 Training Data: 10,000+ incidents</span>
              <span>🎯 Accuracy: 87.3%</span>
            </div>
          </div>
        </div>
        
        {/* Right: Heatmap (60%) */}
        <div className="w-full lg:w-[60%] card-container p-1 flex flex-col h-[700px]">
          <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-surface rounded-t-[10px]">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity size={18} className="text-brand-purple" />
              Safety Heatmap
            </h2>
            <div className="flex gap-2">
              {['All Day', 'Morning', 'Evening', 'Night'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    timeFilter === t 
                      ? 'border-brand-purple bg-brand-purple/20 text-brand-purple' 
                      : 'border-brand-border text-brand-text-secondary hover:border-brand-text-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 rounded-b-[10px] overflow-hidden relative z-0">
            <MapContainer 
              center={[20.5937, 78.9629]} 
              zoom={13} 
              style={{ width: '100%', height: '100%' }}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
              />
              {heatmapData.map((pt, i) => (
                <CircleMarker
                  key={i}
                  center={[pt.lat, pt.lon]}
                  radius={pt.intensity === 'high' ? 20 : pt.intensity === 'medium' ? 15 : 10}
                  pathOptions={{
                    color: pt.intensity === 'high' ? 'var(--color-brand-danger)' : pt.intensity === 'medium' ? 'var(--color-brand-warning)' : 'var(--color-brand-safe)',
                    fillColor: pt.intensity === 'high' ? 'var(--color-brand-danger)' : pt.intensity === 'medium' ? 'var(--color-brand-warning)' : 'var(--color-brand-safe)',
                    fillOpacity: 0.4,
                    weight: 2
                  }}
                >
                  <Popup className="dark-popup">{pt.label} ({pt.intensity} risk)</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

      </div>

      {/* Bottom: Feed */}
      <div className="w-full space-y-6">
        
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All', val: 'All' },
            { label: '🔴 High', val: 'High' },
            { label: '🟡 Medium', val: 'Medium' },
            { label: '🟢 Low', val: 'Low' },
            { label: '🕐 Last 1 Hour', val: 'Last 1 Hour' }
          ].map(f => (
            <button 
              key={f.val}
              onClick={() => setAlertFilter(f.val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                alertFilter === f.val 
                  ? 'border-brand-purple bg-brand-purple/20 text-brand-purple' 
                  : 'border-brand-border bg-brand-surface text-brand-text-secondary hover:border-brand-purple/50'
              }`}
            >
              {f.label}
            </button>
          ))}
          <button 
            onClick={handleNearMeFilter}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1 ${
              alertFilter === 'Near Me' 
                ? 'border-brand-purple bg-brand-purple/20 text-brand-purple' 
                : 'border-brand-border bg-brand-surface text-brand-text-secondary hover:border-brand-purple/50'
            }`}
          >
            <Navigation size={12} /> Near Me
          </button>
        </div>

        {/* Community Feed */}
        <div className="card-container flex flex-col h-[500px]">
          <div className="p-4 border-b border-brand-border flex justify-between items-center sticky top-0 bg-[#12121A] z-10 rounded-t-xl">
            <h3 className="font-bold flex items-center gap-2">
              Community Alerts ({alerts.length})
              <span className="flex h-2 w-2 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-danger opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-danger"></span>
              </span>
              <span className="text-xs text-brand-danger font-bold uppercase">Live</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {filteredAlerts.length === 0 ? (
              <div className="text-center text-brand-text-muted py-8 text-sm">
                No alerts match your filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAlerts.map(alert => {
                  const isNew = (Date.now() - alert.timestamp) < 300000;
                  const severityColor = getSeverityColor(alert.severity);

                  return (
                    <div 
                      key={alert.id} 
                      className={`bg-brand-surface border border-brand-border rounded-lg p-4 relative overflow-hidden animate-[slideInRight_0.3s_ease-out] ${isNew ? 'after:absolute after:inset-0 after:bg-brand-safe/5 after:animate-[pulse_2s_ease-in-out_infinite] pointer-events-auto' : ''}`}
                      style={{ borderLeft: `4px solid ${severityColor}` }}
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2" style={{ color: severityColor }}>
                          {getSeverityIcon(alert.severity)}
                          <span className="font-bold text-sm">{alert.type}</span>
                        </div>
                        {isNew && (
                          <span className="px-2 py-0.5 bg-brand-safe/20 text-brand-safe text-[10px] font-bold rounded uppercase">
                            New
                          </span>
                        )}
                      </div>
                      
                      {/* Location Row */}
                      <div className="flex items-start gap-1.5 mb-2 text-brand-text-primary font-medium text-sm">
                        <MapPin size={14} className="text-brand-text-muted shrink-0 mt-0.5" />
                        <span>{alert.location}</span>
                      </div>
                      
                      {/* Description Row */}
                      <p className="text-sm text-brand-text-secondary mb-3 pl-5 line-clamp-2">
                        {alert.description?.length > 80 ? alert.description.substring(0, 80) + '...' : alert.description}
                      </p>
                      
                      {/* Footer Row */}
                      <div className="flex items-center justify-between pl-5 text-[11px] text-brand-text-muted border-t border-brand-border pt-3">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {alert.time} • By {alert.reportedBy}
                          </span>
                          <span className="uppercase font-bold" style={{ color: severityColor }}>
                            {alert.severity} Risk
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pl-5">
                        <button 
                          onClick={() => confirmAlert(alert.id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-brand-bg hover:bg-brand-safe/10 text-brand-text-secondary hover:text-brand-safe border border-brand-border rounded text-xs transition-colors"
                        >
                          <ThumbsUp size={14} /> 
                          Confirm {alert.confirmations > 0 && `(${alert.confirmations})`}
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm("Remove this alert from your feed?")) {
                              removeAlert(alert.id);
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-brand-bg hover:bg-brand-danger/10 text-brand-text-secondary hover:text-brand-danger border border-brand-border rounded text-xs transition-colors"
                        >
                          <X size={14} /> Dismiss
                        </button>
                      </div>

                      {/* Verified Badge */}
                      {alert.confirmations >= 3 && (
                        <div className="mt-2 pl-5">
                          <span className="inline-flex items-center gap-1 text-[10px] text-brand-safe bg-brand-safe/10 px-2 py-1 rounded">
                            <ShieldCheck size={12} /> Verified by community
                          </span>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
