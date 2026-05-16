// ============================================================
// SafeRoute AI — Safety Scoring Engine
// Weighted multi-factor scoring model (ML-inspired)
// ============================================================

// Factor weights — must sum to 1.0
const WEIGHTS = {
  lighting: 0.25,       // Street light coverage
  cctv: 0.20,           // CCTV camera density
  crimeHistory: 0.25,   // Past incidents in area
  policeProximity: 0.15, // Distance to nearest station
  crowdDensity: 0.15,   // People presence (safety in numbers)
};

// Time-of-day penalty table
const TIME_PENALTIES = [
  { from: 21, to: 24, penalty: 28, label: "Late Night" },
  { from: 0, to: 5, penalty: 28, label: "Late Night" },
  { from: 19, to: 21, penalty: 15, label: "Evening" },
  { from: 5, to: 7, penalty: 10, label: "Early Morning" },
];

// Mock area profiles — replace with real API/DB data later
// Each value: 0 (worst) to 100 (best)
const ROUTE_PROFILES = [
  {
    // Route 0 — Safest
    name: "Safe Route",
    lighting: 85,
    cctv: 80,
    crimeHistory: 88,   // high = low crime
    policeProximity: 90,
    crowdDensity: 75,
  },
  {
    // Route 1 — Moderate
    name: "Balanced Route",
    lighting: 65,
    cctv: 55,
    crimeHistory: 62,
    policeProximity: 60,
    crowdDensity: 70,
  },
  {
    // Route 2 — Riskiest
    name: "Fastest Route",
    lighting: 40,
    cctv: 35,
    crimeHistory: 42,
    policeProximity: 38,
    crowdDensity: 50,
  },
];

/**
 * Calculate weighted safety score for a route
 * @param {number} routeIdx - 0 (safest) to 2 (riskiest)
 * @param {number} travelHour - 0-23 (hour of travel)
 * @returns {object} { score, breakdown, timePenalty, label }
 */
export function calcSafety(routeIdx, travelHour) {
  const profile = ROUTE_PROFILES[routeIdx] || ROUTE_PROFILES[1];

  // Step 1: Weighted base score
  const baseScore =
    profile.lighting * WEIGHTS.lighting +
    profile.cctv * WEIGHTS.cctv +
    profile.crimeHistory * WEIGHTS.crimeHistory +
    profile.policeProximity * WEIGHTS.policeProximity +
    profile.crowdDensity * WEIGHTS.crowdDensity;

  // Step 2: Time-of-day penalty
  let timePenalty = 0;
  let timeLabel = "Daytime";
  for (const t of TIME_PENALTIES) {
    if (travelHour >= t.from && travelHour < t.to) {
      timePenalty = t.penalty;
      timeLabel = t.label;
      break;
    }
  }

  // Step 3: Final score (clamped 8–99)
  const finalScore = Math.min(99, Math.max(8,
    Math.round(baseScore - timePenalty)
  ));

  return {
    score: finalScore,
    timePenalty,
    timeLabel,
    breakdown: {
      lighting: Math.round(profile.lighting * WEIGHTS.lighting),
      cctv: Math.round(profile.cctv * WEIGHTS.cctv),
      crimeHistory: Math.round(profile.crimeHistory * WEIGHTS.crimeHistory),
      policeProximity: Math.round(profile.policeProximity * WEIGHTS.policeProximity),
      crowdDensity: Math.round(profile.crowdDensity * WEIGHTS.crowdDensity),
    },
  };
}

// Unsafe zones - hardcoded for demo
export const UNSAFE_ZONES = {
  'vijay nagar': {
    scores: [38, 29, 19],
    reason: 'High crime incidents, poor street lighting, minimal CCTV coverage reported in this area'
  },
  'vijaynagar': {
    scores: [38, 29, 19],
    reason: 'High crime incidents, poor street lighting, minimal CCTV coverage reported in this area'
  },
  'vijay': {
    scores: [38, 29, 19],
    reason: 'High crime incidents, poor street lighting, minimal CCTV coverage reported in this area'
  },
  'rajwada': {
    scores: [71, 35, 28],
    reason: 'Crowded market area, 2 routes pass through poorly lit narrow lanes at night'
  },
  'palasia': {
    scores: [69, 42, 31],
    reason: 'Mixed safety zone, some routes pass through low surveillance areas'
  },
  'chhatripura': {
    scores: [41, 33, 24],
    reason: 'Low police presence, poor lighting reported'
  }
}

// FIXED detection function
export const getUnsafeZoneData = (destination) => {
  if (!destination) return null

  // Clean and lowercase
  const dest = destination
    .toLowerCase()
    .trim()
    .replace(/[,\.]/g, ' ')
    .replace(/\s+/g, ' ')

  console.log('Checking unsafe zone for:', dest)
  console.log('dest cleaned:', dest)
  console.log('checking against zones:', Object.keys(UNSAFE_ZONES))

  // Check each unsafe zone keyword
  for (const zone in UNSAFE_ZONES) {
    if (dest.includes(zone)) {
      console.log('UNSAFE ZONE DETECTED:', zone)
      return UNSAFE_ZONES[zone]
    }
  }

  console.log('No unsafe zone detected')
  return null
}

// Get safety label and color by score
export const getSafetyLevel = (score) => {
  if (score >= 60) return {
    label: 'SAFE',
    color: '#10b981',
    icon: '🟢',
    bg: 'rgba(16,185,129,0.1)',
    border: '#10b981'
  }
  if (score >= 40) return {
    label: 'MODERATE',
    color: '#f59e0b', 
    icon: '🟡',
    bg: 'rgba(245,158,11,0.1)',
    border: '#f59e0b'
  }
  return {
    label: 'UNSAFE',
    color: '#ef4444',
    icon: '🔴',
    bg: 'rgba(239,68,68,0.1)',
    border: '#ef4444'
  }
}

/**
 * Color based on final safety score
 */
export function scoreColor(score) {
  if (score >= 60) return '#10b981';    // Green
  if (score >= 40) return '#f59e0b'; // Amber
  return '#ef4444';                    // Red
}

/**
 * Label based on score
 */
export function scoreLabel(score) {
  if (score >= 60) return 'Safe';
  if (score >= 40) return 'Moderate Risk';
  return 'High Risk';
}
/**
 * Calculates safety score with clear separation between routes.
 * Ensures normal locations show a mix of SAFE, MODERATE, and UNSAFE paths.
 */
export const calcSafetyScore = (index, hour) => {
  // Base scores clearly different
  const baseScores = [82, 61, 38];
  
  // Night penalty (7 PM - 6 AM)
  const isNight = hour >= 19 || hour < 6;
  const nightPenalty = isNight ? 15 : 0;
  
  // Evening penalty (5 PM - 7 PM)
  const isEvening = hour >= 17 && hour < 19;
  const eveningPenalty = isEvening ? 7 : 0;
  
  const final = baseScores[index] - nightPenalty - eveningPenalty;
    
  return Math.max(final, 10);
}
