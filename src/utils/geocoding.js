// Geocoding — Nominatim (free, no API key)
export async function geocode(query) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await r.json();
    if (!d.length) throw new Error("GEOCODING_ERROR");
    return { 
      lat: +d[0].lat, 
      lon: +d[0].lon, 
      name: d[0].display_name.split(',').slice(0, 2).join(', ') 
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    throw new Error("GEOCODING_ERROR");
  }
}

export async function reverseGeocode(lat, lon) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const d = await r.json();
    if (d.error) throw new Error("REVERSE_GEOCODING_ERROR");
    return d.display_name.split(',').slice(0, 3).join(', ');
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`; // fallback
  }
}
