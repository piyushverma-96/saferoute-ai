// Geocoding — Nominatim (free, no API key)

/**
 * Enhanced geocoding with retry logic to handle Indore-specific locations better.
 */
export const geocode = async (query) => {
  if (!query || query.trim().length < 2) 
    return null

  // Try 1: Original query
  let result = await tryGeocode(query)
  if (result) return result

  // Try 2: Add "Indore" if not present
  if (!query.toLowerCase().includes('indore')) {
    result = await tryGeocode(query + ', Indore')
    if (result) return result
  }

  // Try 3: Add "Madhya Pradesh"
  result = await tryGeocode(query + ', Madhya Pradesh, India')
  if (result) return result

  // Try 4: First word only
  const firstWord = query.trim().split(' ')[0]
  if (firstWord.length > 2) {
    result = await tryGeocode(firstWord + ', Indore, India')
    if (result) return result
  }

  throw new Error("GEOCODING_ERROR");
}

const tryGeocode = async (query) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(query)}` +
      `&format=json` +
      `&limit=5` +
      `&countrycodes=in`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SafeRouteAI/1.0'
        }
      }
    )
    const data = await res.json()
    
    if (data && data.length > 0) {
      console.log('Geocoded:', query, '→', data[0].display_name)
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: data[0].display_name.split(',').slice(0, 2).join(', ')
      }
    }
  } catch(e) {
    console.error('Geocode error:', e)
  }
  return null
}

export async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SafeRouteAI/1.0'
        }
      }
    );
    const d = await r.json();
    if (d.error) throw new Error("REVERSE_GEOCODING_ERROR");
    return d.display_name.split(',').slice(0, 3).join(', ');
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`; // fallback
  }
}
