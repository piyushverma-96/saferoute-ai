import React, { useState } from 'react';
import { MOCK_CONTACTS } from '../data/mockData';

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getNearbyContacts = (routeCoords) => {
  const contacts = JSON.parse(
    localStorage.getItem('trusted_contacts')
  ) || MOCK_CONTACTS

  return contacts.filter(contact => {
    if (!contact.lat || !contact.lng) return false
    return routeCoords.some(([lat, lng]) =>
      getDistanceKm(lat, lng, contact.lat, contact.lng) <= 0.8
    )
  })
}

const RouteCard = ({ route, selected, onSelect, travelTime }) => {
  const [showAI, setShowAI] = useState(false)
  const nearbyContacts = getNearbyContacts(route.coordinates || [])
  
  return (
    <div
      onClick={() => onSelect(route)}
      style={{
        background: selected 
          ? 'rgba(124,58,237,0.15)' 
          : 'rgba(255,255,255,0.05)',
        border: selected
          ? `2px solid ${route.color}`
          : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px',
        marginBottom: '10px',
        cursor: 'pointer',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* HIGH RISK WARNING BANNER */}
      {route.type === 'risky' && (
        <div style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: '6px',
          padding: '4px 8px',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{fontSize: '12px'}}>⚠️</span>
          <span style={{
            color: '#EF4444',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            High Risk — Not Recommended
          </span>
        </div>
      )}

      {/* TOP ROW - Route name + Score */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: route.color,
            flexShrink: 0
          }} />
          <span style={{
            color: 'white',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            {route.name}
          </span>
        </div>
        <span style={{
          color: route.color,
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          {route.score}
        </span>
      </div>

      {/* MIDDLE ROW - Distance + Time */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '8px'
      }}>
        <span style={{
          color: '#888',
          fontSize: '12px'
        }}>
          📍 {route.distance}
        </span>
        <span style={{
          color: '#888',
          fontSize: '12px'
        }}>
          ⏱ {route.duration} min
        </span>
        <span style={{
          color: '#555',
          fontSize: '10px',
          marginLeft: 'auto'
        }}>
          🤖 {route.confidence}%
        </span>
      </div>

      {/* TAGS ROW */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '10px'
      }}>
        {route.tags?.map(tag => (
          <span
            key={tag}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#aaa',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* NEARBY CONTACTS */}
      {nearbyContacts.length > 0 && (
        <div style={{
          marginTop: '10px',
          padding: '8px',
          background: 'rgba(124,58,237,0.1)',
          borderRadius: '8px',
          border: '1px solid #7c3aed'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#a78bfa',
            marginBottom: '6px',
            fontWeight: '500'
          }}>
            👥 Contacts on this route:
          </div>
          {nearbyContacts.map((c, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{
                fontSize: '12px',
                color: '#e2e8f0'
              }}>
                👤 {c.name}
              </span>
              <a 
                href={`tel:${c.phone}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#7c3aed',
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textDecoration: 'none'
                }}
              >
                Call
              </a>
            </div>
          ))}
        </div>
      )}

      {/* AI ANALYSIS BUTTON 
          - Always visible, large touch target */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowAI(!showAI)
        }}
        style={{
          width: '100%',
          padding: '10px',
          background: showAI
            ? 'rgba(124,58,237,0.3)'
            : 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: '8px',
          color: '#A78BFA',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: showAI ? '10px' : '0'
        }}
      >
        <span>🤖</span>
        <span>
          {showAI 
            ? 'Hide AI Analysis ▲' 
            : 'View AI Analysis ▼'}
        </span>
      </button>

      {/* AI BREAKDOWN PANEL */}
      {showAI && (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          padding: '12px',
          border: '1px solid rgba(124,58,237,0.2)'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <span style={{
              color: '#A78BFA',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              🤖 AI Score Breakdown
            </span>
            <span style={{
              color: '#555',
              fontSize: '10px'
            }}>
              Random Forest + KNN
            </span>
          </div>

          {/* Factor bars */}
          {route.factors?.map((factor, i) => (
            <div
              key={i}
              style={{
                marginBottom: '10px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{
                  color: '#aaa',
                  fontSize: '11px'
                }}>
                  {factor.icon} {factor.name}
                </span>
                <span style={{
                  color: factor.score >= 7 
                    ? '#00C896'
                    : factor.score >= 5
                    ? '#F59E0B'
                    : '#EF4444',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {factor.score}/10
                </span>
              </div>
              <div style={{
                height: '6px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${factor.score * 10}%`,
                  background: factor.score >= 7
                    ? '#00C896'
                    : factor.score >= 5
                    ? '#F59E0B'
                    : '#EF4444',
                  borderRadius: '3px',
                  transition: 'width 0.8s ease-out'
                }} />
              </div>
            </div>
          ))}

          {/* Night penalty */}
          {(travelTime === 'night' || 
            travelTime === 'evening') && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px',
              padding: '6px 10px',
              marginTop: '8px',
              marginBottom: '8px'
            }}>
              <span style={{
                color: '#EF4444',
                fontSize: '11px'
              }}>
                {travelTime === 'night' 
                  ? '🌙 Night Penalty: -15 pts'
                  : '🌆 Evening Penalty: -8 pts'}
              </span>
            </div>
          )}

          {/* Divider */}
          <div style={{
            height: '1px',
            background: 'rgba(255,255,255,0.1)',
            margin: '10px 0'
          }} />

          {/* Final score */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: '#aaa',
              fontSize: '12px'
            }}>
              🎯 Final Safety Score
            </span>
            <span style={{
              color: route.color,
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              {route.score}/100
            </span>
          </div>

          {/* ML Badge */}
          <div style={{
            marginTop: '10px',
            padding: '6px',
            background: 'rgba(124,58,237,0.1)',
            borderRadius: '6px',
            textAlign: 'center'
          }}>
            <span style={{
              color: '#7C3AED',
              fontSize: '10px'
            }}>
              ⚡ Analyzed by ML Safety Model v2.1
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RouteCard;
