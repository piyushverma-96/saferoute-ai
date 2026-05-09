// Routing — OSRM (free, no API key)
export async function getRoutes(start, end) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?alternatives=true&geometries=geojson&overview=full`;
    const r = await fetch(url);
    const d = await r.json();
    if (d.code !== 'Ok') throw new Error('ROUTING_ERROR');
    return d.routes;
  } catch (error) {
    console.error("Routing error:", error);
    throw new Error('ROUTING_ERROR');
  }
}
