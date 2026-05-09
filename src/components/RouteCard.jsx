import React, { useState } from 'react';
import { ShieldCheck, MapPin, Clock, Volume2, ChevronDown } from 'lucide-react';
import SafetyMetrics from './SafetyMetrics';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';

export default function RouteCard({ route, isSelected, onClick, travelHour }) {
  const { name, score, dist, time, color, tags, metrics } = route;
  const { speak, isSupported, isVoiceEnabled } = useVoiceNavigation();
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleReplay = (e) => {
    e.stopPropagation();
    speak(
      `${name}. ${dist}, ${time}, safety score ${score}.`,
      `${name === 'Safest Route' ? 'सबसे सुरक्षित रास्ता' : name === 'Fastest Route' ? 'सबसे तेज़ रास्ता' : 'संतुलित रास्ता'}। ${dist}, ${time}, सुरक्षा स्कोर ${score}।`
    );
  };

  const confidence = score >= 70 ? 94 : score >= 40 ? 87 : 91;

  const safeFactors = [
    { icon: '💡', name: 'Street Lighting', score: 9 },
    { icon: '📹', name: 'CCTV Coverage', score: 8 },
    { icon: '🚔', name: 'Police Proximity', score: 9 },
    { icon: '👥', name: 'Crowd Density', score: 7 },
    { icon: '📊', name: 'Crime History', score: 8 },
  ];
  const moderateFactors = [
    { icon: '💡', name: 'Street Lighting', score: 6 },
    { icon: '📹', name: 'CCTV Coverage', score: 5 },
    { icon: '🚔', name: 'Police Proximity', score: 6 },
    { icon: '👥', name: 'Crowd Density', score: 7 },
    { icon: '📊', name: 'Crime History', score: 5 },
  ];
  const riskyFactors = [
    { icon: '💡', name: 'Street Lighting', score: 3 },
    { icon: '📹', name: 'CCTV Coverage', score: 2 },
    { icon: '🚔', name: 'Police Proximity', score: 3 },
    { icon: '👥', name: 'Crowd Density', score: 4 },
    { icon: '📊', name: 'Crime History', score: 2 },
  ];

  const factors = score >= 70 ? safeFactors : score >= 40 ? moderateFactors : riskyFactors;
  const isNight = travelHour >= 19 || travelHour < 5;
  const isEvening = travelHour >= 17 && travelHour < 19;

  return (
    <div 
      className={`card-container cursor-pointer p-4 card-hover overflow-hidden transition-all duration-300 ${
        isSelected ? 'border-glow bg-brand-surface' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} style={{ color }} />
            <h3 className="font-semibold text-brand-text-primary">{name}</h3>
            {isSupported && isVoiceEnabled && (
              <button 
                onClick={handleReplay}
                className="ml-2 text-brand-text-muted hover:text-brand-purple transition-colors p-1"
                title="Replay Route Details"
              >
                <Volume2 size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-brand-text-secondary">
            <span className="flex items-center gap-1"><MapPin size={14} /> {dist}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {time}</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div 
            className="flex flex-col items-center justify-center w-12 h-12 rounded-lg border bg-brand-bg font-bold text-lg"
            style={{ borderColor: color, color: color }}
          >
            {score}
          </div>
          <span style={{ fontSize: '10px', color: '#888', display: 'block', marginTop: '4px' }}>
            🤖 ML Confidence: {confidence}%
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {tags.map((tag, idx) => (
          <span 
            key={idx} 
            className="px-2 py-1 text-[10px] uppercase tracking-wider rounded-full bg-brand-bg text-brand-text-secondary border border-brand-border"
          >
            {tag}
          </span>
        ))}
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); setShowBreakdown(!showBreakdown); }}
        className="flex items-center gap-1 text-[11px] text-brand-purple font-medium hover:text-brand-purple/80 transition-colors mt-2"
      >
        🤖 View AI Analysis
        <ChevronDown size={14} className={`transition-transform duration-300 ${showBreakdown ? 'rotate-180' : ''}`} />
      </button>

      {/* AI Breakdown Panel */}
      <div 
        className={`transition-all duration-300 overflow-hidden ${showBreakdown ? 'max-h-[500px] mt-3 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '12px',
          padding: '16px'
        }}>
          <div className="flex justify-between items-center mb-4 border-b border-brand-border/50 pb-2">
            <span className="font-semibold text-sm text-brand-text-primary">🤖 AI Score Breakdown</span>
            <span style={{color: '#888', fontSize: '10px'}} className="uppercase tracking-wide">
              Powered by ML Model
            </span>
          </div>
          
          <div className="space-y-3">
            {factors.map((factor, idx) => (
              <div key={idx} className="flex items-center text-xs">
                <span className="w-6 text-center">{factor.icon}</span>
                <span className="w-28" style={{color: '#A0A0B0', fontSize: '12px'}}>{factor.name}</span>
                <div className="flex-1 mx-2 bg-white/10 h-[6px] rounded-full overflow-hidden relative">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: showBreakdown ? `${factor.score * 10}%` : '0%',
                      background: factor.score >= 7 ? '#00C896' : factor.score >= 5 ? '#F59E0B' : '#EF4444',
                      transitionDelay: `${idx * 100}ms`
                    }}
                  />
                </div>
                <span className="w-8 text-right font-medium text-brand-text-secondary">{factor.score}/10</span>
              </div>
            ))}
          </div>
          
          {isNight && (
            <div className="mt-4 text-xs font-medium text-brand-warning flex items-center gap-1 bg-brand-warning/10 p-2 rounded-lg border border-brand-warning/20">
              🌙 Night Time Penalty: -15 pts
            </div>
          )}
          {isEvening && !isNight && (
            <div className="mt-4 text-xs font-medium text-brand-warning flex items-center gap-1 bg-brand-warning/10 p-2 rounded-lg border border-brand-warning/20">
              🌆 Evening Penalty: -8 pts
            </div>
          )}
          
          <div className="my-4 border-t border-brand-border/50" />
          
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-brand-text-primary">🎯 Final Safety Score</span>
            <span style={{
              color: score >= 70 ? '#00C896' : score >= 40 ? '#F59E0B' : '#EF4444',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              {score}/100
            </span>
          </div>
          
          <div className="flex items-center gap-1 justify-center text-[10px] mt-2 pt-2 border-t border-brand-border/30">
            <span className="text-brand-text-muted">⚡ Analyzed using</span>
            <span style={{color: '#7C3AED', fontWeight: '500'}}>Random Forest + KNN Model</span>
          </div>
        </div>
      </div>
    </div>
  );
}
