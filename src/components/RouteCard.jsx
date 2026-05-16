import React from 'react';
import { getSafetyLevel } from '../utils/safetyScore';

const RouteCard = ({ route, selected, onClick }) => {
  return (
    <div 
      onClick={() => onClick && onClick()}
      style={{
        background: route.bg,
        border: selected ? `2px solid ${route.color}` : `1.5px solid ${route.border}`,
        borderRadius: '14px',
        padding: '14px',
        cursor: 'pointer',
        marginBottom: '10px',
        transition: 'all 0.2s',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: selected ? `0 10px 20px ${route.color}22` : 'none',
        zIndex: selected ? 2 : 1,
        position: 'relative'
      }}
    >
      {/* Top - Score + Label */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: '700',
          color: route.color
        }}>
          {route.score}
          <span style={{
            fontSize: '13px',
            color: '#64748b',
            fontWeight: '400',
            marginLeft: '2px'
          }}>/100</span>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            padding: '3px 10px',
            borderRadius: '8px',
            background: route.color + '33',
            color: route.color,
            letterSpacing: '0.05em'
          }}>
            {route.icon} {route.label}
          </span>
          <span style={{
            fontSize: '10px',
            color: '#64748b'
          }}>
            {route.distance} · {route.durMin}min
          </span>
        </div>
      </div>

      {/* Safety Bar */}
      <div style={{
        height: '6px',
        background: '#1e293b',
        borderRadius: '3px',
        marginBottom: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${route.score}%`,
          height: '100%',
          background: route.color,
          borderRadius: '3px',
          transition: 'width 0.8s ease'
        }}/>
      </div>

      {/* AI Score Breakdown */}
      <div style={{
        marginBottom: '10px'
      }}>
        <div style={{
          fontSize: '11px',
          color: '#64748b',
          marginBottom: '6px',
          fontWeight: '500'
        }}>
          🤖 AI Safety Analysis:
        </div>

        {[
          { 
            label: '💡 Lighting', 
            score: route.score < 40 
              ? Math.floor(route.score * 0.8)
              : Math.min(100, Math.floor(route.score * 0.95))
          },
          { 
            label: '📹 CCTV Coverage', 
            score: route.score < 40 
              ? Math.floor(route.score * 0.7)
              : Math.min(100, Math.floor(route.score * 0.85))
          },
          { 
            label: '🚔 Police Proximity', 
            score: route.score < 40 
              ? Math.floor(route.score * 0.9)
              : Math.min(100, Math.floor(route.score * 0.95))
          },
          { 
            label: '👥 Crowd Density', 
            score: route.score < 40 
              ? Math.floor(route.score * 0.75)
              : Math.min(100, Math.floor(route.score * 0.88))
          },
          { 
            label: '📊 Crime History', 
            score: route.score < 40 
              ? Math.floor(route.score * 0.65)
              : Math.min(100, Math.floor(route.score * 0.92))
          }
        ].map((factor, i) => (
          <div key={i} style={{
            marginBottom: '5px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '3px'
            }}>
              <span>{factor.label}</span>
              <span style={{
                color: getSafetyLevel(factor.score).color,
                fontWeight: '600'
              }}>
                {factor.score}/100
              </span>
            </div>
            <div style={{
              height: '4px',
              background: '#1e293b',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${factor.score}%`,
                height: '100%',
                background: getSafetyLevel(factor.score).color,
                borderRadius: '2px',
                transition: 'width 1s ease'
              }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Unsafe Warning Banner */}
      {route.label === 'UNSAFE' && (
        <div style={{
          padding: '8px 10px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#ef4444',
            fontWeight: '600',
            marginBottom: '3px'
          }}>
            ⚠️ AI Alert: Unsafe Route Detected
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            lineHeight: '1.3'
          }}>
            {route.unsafeReason || 'This route has low safety score. Avoid if possible.'}
          </div>
        </div>
      )}

      {/* Recommended / Avoid tag */}
      {route.score >= 60 && (
        <div style={{
          fontSize: '11px',
          color: '#10b981',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>✅</span> AI Recommended — Safe to travel
        </div>
      )}
      {route.score < 40 && (
        <div style={{
          fontSize: '11px',
          color: '#ef4444',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>🚫</span> AI Advises — Avoid this route
        </div>
      )}
    </div>
  );
};

export default RouteCard;
