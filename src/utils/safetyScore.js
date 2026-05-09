// Safety scoring logic (time-aware)
export function calcSafety(routeIdx, travelHour) {
  const bases = [78, 61, 44]; // Safest → Riskiest
  let score = bases[routeIdx] || 55;
  
  if (travelHour >= 21 || travelHour <= 5) {
    score -= 28;
  } else if (travelHour >= 19) {
    score -= 15;
  } else if (travelHour <= 7) {
    score -= 10;
  }
  
  return Math.min(99, Math.max(8, Math.round(score)));
}

// Route colors based on safety score
export function scoreColor(s) {
  if (s >= 70) return 'var(--color-brand-safe)';
  if (s >= 40) return 'var(--color-brand-warning)';
  return 'var(--color-brand-danger)';
}
