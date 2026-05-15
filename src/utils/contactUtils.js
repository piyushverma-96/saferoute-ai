// Calculate distance between 2 points in km
export const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(
    Math.sqrt(a), Math.sqrt(1 - a)
  )
}

// Check if a contact is within some km of any point on the route
export const isContactNearRoute = (
  contact, routeCoords, thresholdKm = 5.0
) => {
  if (!contact.lat || !contact.lng) 
    return false
  if (!routeCoords || routeCoords.length === 0) 
    return false

  return routeCoords.some(([lat, lng]) => {
    const dist = getDistanceKm(
      lat, lng,
      contact.lat, contact.lng
    )
    return dist <= thresholdKm
  })
}

// Get all contacts near a route
export const getContactsNearRoute = (
  routeCoords, thresholdKm = 5.0
) => {
  try {
    const saved = localStorage.getItem(
      'trusted_contacts'
    )
    if (!saved) return []

    const contacts = JSON.parse(saved)
    
    return contacts.filter(contact =>
      isContactNearRoute(
        contact, routeCoords, thresholdKm
      )
    )
  } catch(e) {
    console.error('Error loading contacts:', e)
    return []
  }
}
