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

/**
 * Color based on final safety score
 */
export function scoreColor(score) {
  if (score >= 70) return 'var(--color-brand-safe)';    // Green
  if (score >= 40) return 'var(--color-brand-warning)'; // Amber
  return 'var(--color-brand-danger)';                    // Red
}

/**
 * Label based on score
 */
export function scoreLabel(score) {
  if (score >= 70) return 'Safe';
  if (score >= 40) return 'Moderate Risk';
  return 'High Risk';
}
