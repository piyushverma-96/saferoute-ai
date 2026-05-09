import React from 'react';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Search, Sun, Sunset, Moon, Volume2, VolumeX } from 'lucide-react';
import RouteCard from './RouteCard';
import SkeletonCard from './SkeletonCard';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

export default function Sidebar({ 
  startQuery, 
  setStartQuery, 
  endQuery, 
  setEndQuery, 
  travelHour, 
  setTravelHour, 
  onSearch, 
  routes, 
  isLoading, 
  error,
  selectedRouteId,
  setSelectedRouteId,
  userCoords,
  isDetectingLocation,
  locationError,
  gpsAccuracy,
  detectLocation
}) {
  const { isVoiceEnabled, setIsVoiceEnabled, speak, language, setLanguage, isSupported } = useVoiceNavigation();
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularIndoreLocations = [
    "Rajwada, Indore",
    "Vijay Nagar, Indore", 
    "Palasia, Indore",
    "Sapna Sangeeta, Indore",
    "MG Road, Indore",
    "Bhawarkuan, Indore",
    "Geeta Bhawan, Indore",
    "LIG Colony, Indore",
    "Scheme 54, Indore",
    "Chameli Devi, Indore"
  ];

  useEffect(() => {
    let timeoutId;
    if (endQuery.length >= 3 && showSuggestions && !popularIndoreLocations.includes(endQuery)) {
      timeoutId = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endQuery)}&format=json&limit=5&countrycodes=in&viewbox=75.5,22.5,76.2,23.0`);
          const data = await res.json();
          setDestinationSuggestions(data.map(d => d.display_name));
        } catch(e) {
          console.error("Autocomplete error", e);
        }
      }, 500);
    } else if (endQuery.length < 3) {
      setDestinationSuggestions(popularIndoreLocations.slice(0, 5));
    }
    return () => clearTimeout(timeoutId);
  }, [endQuery, showSuggestions]);

  const handleDestinationFocus = () => {
    setShowSuggestions(true);
    if (!endQuery || endQuery.length < 3) {
      setDestinationSuggestions(popularIndoreLocations.slice(0, 5));
    }
  };

  const selectSuggestion = (s) => {
    setEndQuery(s);
    setShowSuggestions(false);
  };

  // Voice announcement for night mode
  useEffect(() => {
    if (travelHour >= 19 || travelHour < 5) {
      speak(
        "Night travel detected. Please stay on well-lit roads and keep your emergency contacts informed.",
        "रात का समय है। कृपया रोशनी वाली सड़कों पर रहें और अपने आपातकालीन संपर्कों को सूचित रखें।"
      );
    }
  }, [travelHour, speak]);

  // Voice announcement when route is selected
  useEffect(() => {
    if (routes && routes.length > 0 && selectedRouteId !== null) {
      const route = routes.find(r => r.id === selectedRouteId);
      if (route) {
        const riskLevel = route.score >= 70 ? 'Safe' : route.score >= 40 ? 'Moderate risk' : 'High risk';
        const riskLevelHi = route.score >= 70 ? 'सुरक्षित' : route.score >= 40 ? 'मध्यम जोखिम वाला' : 'उच्च जोखिम वाला';
        
        speak(
          `AI has analyzed 5 safety factors for this route. Safety score is ${route.score} out of 100. ${riskLevel} route selected. Distance ${route.dist}.`,
          `AI ने इस रास्ते के 5 सुरक्षा कारकों का विश्लेषण किया है। सुरक्षा स्कोर ${route.score} है। ${riskLevelHi} रास्ता चुना गया है। दूरी ${route.dist} है।`
        );
      }
    }
  }, [selectedRouteId, routes, speak]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (startQuery && endQuery) {
      onSearch(startQuery, endQuery, travelHour);
      setSelectedRouteId(0); // Select first route by default
    }
  };

  const timeOptions = [
    { label: 'Morning', icon: <Sun size={16} />, value: 9 },
    { label: 'Evening', icon: <Sunset size={16} />, value: 18 },
    { label: 'Night', icon: <Moon size={16} />, value: 22 },
  ];

  return (
    <div className="w-full lg:w-[320px] shrink-0 bg-brand-surface border-r border-brand-border h-[calc(100vh-64px)] flex flex-col z-20">
      
      {/* Input Form Area */}
      <div className="p-5 border-b border-brand-border shrink-0">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
            <span className="w-6 h-6 rounded bg-brand-purple/20 text-brand-purple flex items-center justify-center">
              <Navigation size={14} />
            </span>
            Route Planner
          </h2>
          <p className="text-xs text-brand-text-secondary">AI-Optimized for Safety & Speed</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDetectingLocation ? 'text-brand-purple animate-pulse' : (gpsAccuracy ? 'text-brand-safe' : 'text-brand-text-muted')}`}>
              <MapPin size={16} fill="currentColor" className={!gpsAccuracy && !isDetectingLocation ? "opacity-20" : ""} />
            </div>
            <input 
              type="text" 
              placeholder={isDetectingLocation ? "📍 Detecting your location..." : "Starting Location..."}
              value={startQuery}
              onChange={(e) => setStartQuery(e.target.value)}
              disabled={isDetectingLocation}
              className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all disabled:opacity-70 disabled:cursor-wait"
            />
            <button 
              type="button"
              onClick={detectLocation}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-purple transition-colors"
              title="Use my current location"
            >
              <Navigation size={16} />
            </button>
            {gpsAccuracy && !locationError && (
              <div className={`text-[11px] mt-1 ml-1 ${gpsAccuracy < 50 ? 'text-brand-safe' : gpsAccuracy <= 200 ? 'text-brand-warning' : 'text-brand-danger'}`}>
                {gpsAccuracy < 50 ? "📍 High accuracy" : gpsAccuracy <= 200 ? "📍 Approximate location" : "📍 Low accuracy — try outdoors"}
              </div>
            )}
            {locationError && (
              <div className="text-[11px] mt-1 ml-1 text-brand-text-secondary flex items-center gap-1">
                📍 {locationError}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-danger">
              <MapPin size={16} fill="currentColor" className="opacity-20" />
            </div>
            <input 
              type="text" 
              placeholder="Destination..." 
              value={endQuery}
              onChange={(e) => setEndQuery(e.target.value)}
              onFocus={handleDestinationFocus}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-brand-bg border border-brand-border rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
            />
            {showSuggestions && destinationSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A2E] border border-brand-purple rounded-lg shadow-xl z-50 overflow-hidden">
                {destinationSuggestions.map((s, i) => (
                  <div 
                    key={i} 
                    onClick={() => selectSuggestion(s)}
                    className="px-4 py-2 text-sm text-brand-text-primary hover:bg-brand-purple hover:text-white cursor-pointer border-b border-brand-border/50 last:border-0"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label-text flex items-center gap-1 mb-2">
              <Clock size={12} /> Time of Travel
            </label>
            <div className="grid grid-cols-3 gap-2">
              {timeOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setTravelHour(opt.value)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                    travelHour === opt.value
                      ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                      : 'border-brand-border bg-brand-bg text-brand-text-secondary hover:border-brand-text-muted'
                  }`}
                >
                  {opt.icon}
                  <span className="mt-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              type="submit"
              disabled={isLoading || !startQuery || !endQuery}
              className="flex-1 bg-gradient-brand py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-purple/20 hover:shadow-brand-purple/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
            >
              {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full"></span>
              ) : (
                <Search size={16} />
              )}
              {isLoading ? 'Calculating...' : 'Find Safe Routes'}
            </button>
            
            {isSupported && (
              <>
                <button
                  type="button"
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  title={isVoiceEnabled ? "Voice ON" : "Voice OFF"}
                  className={`px-3 rounded-xl border transition-all flex items-center justify-center ${
                    isVoiceEnabled 
                      ? 'border-brand-safe bg-brand-safe/10 text-brand-safe shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                      : 'border-brand-border bg-brand-surface text-brand-text-muted'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en-IN' ? 'hi-IN' : 'en-IN')}
                  title={language === 'hi-IN' ? "Hindi" : "English"}
                  className="px-3 rounded-xl border border-brand-border bg-brand-surface text-lg hover:bg-brand-bg transition-all flex items-center justify-center"
                >
                  {language === 'hi-IN' ? '🇮🇳' : '🇬🇧'}
                </button>
              </>
            )}
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
              justifyContent: 'center'
            }}
            title="Our AI analyzes 5 safety factors using Random Forest + KNN algorithms trained on 10,000+ incident reports"
          >
            <span style={{fontSize: '10px'}}>⚡</span>
            <span style={{
              fontSize: '10px',
              color: '#888',
              fontFamily: 'monospace'
            }}>
              Powered by ML Safety Model v2.1
            </span>
          </div>

        </form>
      </div>

      {/* Routes List Area */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent">
        <h3 className="label-text mb-4 sticky top-0 bg-brand-surface pb-2 z-10 border-b border-brand-border/50">
          Route Options
        </h3>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : routes.length > 0 ? (
            routes.map((route) => (
              <RouteCard 
                key={route.id} 
                route={route} 
                isSelected={selectedRouteId === route.id}
                onClick={() => setSelectedRouteId(route.id)}
                travelHour={travelHour}
              />
            ))
          ) : (
            <div className="text-center py-8 text-brand-text-muted">
              <MapPin size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm">Enter locations to find safe routes</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
