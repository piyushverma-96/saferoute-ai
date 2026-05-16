// Geocoding — Nominatim (free, no API key)

/**
 * Robust geocoding with multiple retry variations and hardcoded Indore fallback.
 */
export const geocode = async (query) => {
  if (!query || query.trim().length < 2) 
    return null

  const cleanQuery = query.trim()
  
  // Try multiple variations for better result coverage
  const attempts = [
    cleanQuery,
    cleanQuery + ', Indore',
    cleanQuery + ', Indore, Madhya Pradesh',
    cleanQuery + ', Madhya Pradesh, India',
    cleanQuery + ', India'
  ]

  for (const attempt of attempts) {
    console.log('Trying geocode:', attempt)
    
    try {
      const url = 
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(attempt)}` +
        `&format=json` +
        `&limit=3` +
        `&accept-language=en`

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'SafeRouteAI/1.0'
        }
      })
      
      if (!res.ok) continue
      
      const data = await res.json()
      
      if (data && data.length > 0) {
        console.log('Found:', data[0].display_name)
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          name: data[0].display_name.split(',').slice(0, 2).join(', ')
        }
      }
    } catch(e) {
      console.error('Geocode attempt failed:', e)
      continue
    }

    // Wait 300ms between requests to respect Nominatim usage policy
    await new Promise(r => setTimeout(r, 300))
  }

  // FALLBACK: Hardcoded Indore locations if API fails
  const KNOWN_LOCATIONS = {
    'mg road': { lat: 22.7196, lon: 75.8577 },
    'mg road indore': { lat: 22.7196, lon: 75.8577 },
    'vijay nagar': { lat: 22.7533, lon: 75.8937 },
    'vijay nagar indore': { lat: 22.7533, lon: 75.8937 },
    'rajwada': { lat: 22.7196, lon: 75.8411 },
    'rajwada indore': { lat: 22.7196, lon: 75.8411 },
    'palasia': { lat: 22.7251, lon: 75.8654 },
    'palasia indore': { lat: 22.7251, lon: 75.8654 },
    'sapna sangeeta': { lat: 22.7105, lon: 75.8681 },
    'bhawarkuan': { lat: 22.6889, lon: 75.8364 },
    'pithampur': { lat: 22.6177, lon: 75.6953 },
    'mhow': { lat: 22.5518, lon: 75.7587 },
    'rau': { lat: 22.6456, lon: 75.7828 },
    'lasudia': { lat: 22.7389, lon: 75.9012 },
    'super corridor': { lat: 22.7789, lon: 75.9123 },
    'silicon city': { lat: 22.7612, lon: 75.9234 },
    'airport': { lat: 22.7214, lon: 75.8011 },
    'lig colony': { lat: 22.7089, lon: 75.8734 },
    'scheme 54': { lat: 22.7456, lon: 75.9012 },
    'ab road': { lat: 22.7234, lon: 75.8612 },
    'iim indore': { lat: 22.6789, lon: 75.7234 },
    'kanadia': { lat: 22.7678, lon: 75.8234 },
    'sanwer': { lat: 22.9728, lon: 75.8309 },
    'dewas': { lat: 22.9654, lon: 76.0502 },
    'ujjain': { lat: 23.1765, lon: 75.7885 }
  }

  const queryLower = cleanQuery.toLowerCase()
  for (const key in KNOWN_LOCATIONS) {
    if (queryLower.includes(key)) {
      console.log('Using hardcoded location fallback:', key)
      return {
        lat: KNOWN_LOCATIONS[key].lat,
        lon: KNOWN_LOCATIONS[key].lon,
        name: cleanQuery
      }
    }
  }

  console.error('Location not found in API or fallbacks:', cleanQuery)
  throw new Error("GEOCODING_ERROR")
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
