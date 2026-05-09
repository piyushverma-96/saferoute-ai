// offlineStorage.js
// Handles queueing of reports and caching of geocoded locations

export function queueReport(reportData) {
  const pending = getPendingReports();
  pending.push({ ...reportData, id: Date.now() });
  localStorage.setItem('pending_reports', JSON.stringify(pending));
}

export function getPendingReports() {
  const data = localStorage.getItem('pending_reports');
  return data ? JSON.parse(data) : [];
}

export function clearPendingReports() {
  localStorage.removeItem('pending_reports');
}

export function cacheLocation(query, coords) {
  const cache = getCachedLocations();
  cache[query.toLowerCase()] = coords;
  
  // Keep only last 100 entries
  const keys = Object.keys(cache);
  if (keys.length > 100) {
    delete cache[keys[0]];
  }
  
  localStorage.setItem('location_cache', JSON.stringify(cache));
}

export function getCachedLocation(query) {
  const cache = getCachedLocations();
  return cache[query.toLowerCase()] || null;
}

function getCachedLocations() {
  const data = localStorage.getItem('location_cache');
  return data ? JSON.parse(data) : {};
}
