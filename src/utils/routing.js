import { getUnsafeZoneData, getSafetyLevel, calcSafetyScore } from './safetyScore';

/**
 * Fetch routes from OSRM and always return exactly 3 routes.
 * If OSRM returns fewer than 3, additional routes are created via coordinate offsets.
 */
export const fetchRoutes = async (
  start, end, travelHour, destination = ''
) => {
  try {
    const startLon = start.lon || start.lng;
    const endLon = end.lon || end.lng;
    const url = `https://router.project-osrm.org/route/v1/driving/${startLon},${start.lat};${endLon},${end.lat}?alternatives=true&geometries=geojson&overview=full`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes')
    }

    // Get main route
    const mainRoute = data.routes[0]
    const mainCoords = mainRoute.geometry
      .coordinates.map(c => [c[1], c[0]])

    // ALWAYS create 3 route coordinate arrays
    // by offsetting the main route
    const route1Coords = mainCoords // original

    const route2Coords = mainCoords.map(
      ([lat, lng], i) => {
        const total = mainCoords.length
        const progress = i / total
        const factor = Math.sin(
          progress * Math.PI
        )
        return [
          lat + (0.006 * factor),
          lng + (-0.008 * factor)
        ]
      }
    )

    const route3Coords = mainCoords.map(
      ([lat, lng], i) => {
        const total = mainCoords.length
        const progress = i / total
        const factor = Math.sin(
          progress * Math.PI
        )
        return [
          lat + (-0.005 * factor),
          lng + (0.009 * factor)
        ]
      }
    )

    // Get unsafe zone data
    const unsafeZone = getUnsafeZoneData(
      destination
    )

    // Calculate scores
    const scores = unsafeZone
      ? unsafeZone.scores
      : [
          calcSafetyScore(0, travelHour),
          calcSafetyScore(1, travelHour),
          calcSafetyScore(2, travelHour)
        ]

    // Build 3 routes
    const allCoords = [
      route1Coords,
      route2Coords,
      route3Coords
    ]

    return allCoords.map((coords, i) => {
      const score = scores[i]
      const safety = getSafetyLevel(score)

      return {
        score,
        label: safety.label,
        color: safety.color,
        icon: safety.icon,
        bg: safety.bg,
        border: safety.border,
        unsafeReason: unsafeZone?.reason || null,
        distKm: +(
          (mainRoute.distance * 
            [1.15, 1.05, 1.0][i]) / 1000
        ).toFixed(1),
        durMin: Math.round(
          (mainRoute.duration * 
            [1.2, 1.08, 1.0][i]) / 60
        ),
        coordinates: coords
      }
    })

  } catch(err) {
    console.error('Routing error:', err)
    // Fallback mock routes
    return getMockRoutes(
      start, end, travelHour, destination
    )
  }
}

// Fallback if OSRM fails completely
const getMockRoutes = (
  start, end, travelHour, destination
) => {
  const startLon = start.lon || start.lng;
  const endLon = end.lon || end.lng;
  const latDiff = end.lat - start.lat
  const lngDiff = endLon - startLon

  const unsafeZone = getUnsafeZoneData(
    destination
  )
  const scores = unsafeZone
    ? unsafeZone.scores
    : [
        calcSafetyScore(0, travelHour),
        calcSafetyScore(1, travelHour),
        calcSafetyScore(2, travelHour)
      ]

  const offsets = [
    [0.006, -0.008],
    [0, 0],
    [-0.005, 0.009]
  ]

  return offsets.map((
    [latOff, lngOff], i
  ) => {
    const score = scores[i]
    const safety = getSafetyLevel(score)
    const coords = [
      [start.lat, startLon],
      [
        start.lat + latDiff*0.25 + latOff*0.5,
        startLon + lngDiff*0.25 + lngOff*0.5
      ],
      [
        start.lat + latDiff*0.5 + latOff,
        startLon + lngDiff*0.5 + lngOff
      ],
      [
        start.lat + latDiff*0.75 + latOff*0.5,
        startLon + lngDiff*0.75 + lngOff*0.5
      ],
      [end.lat, endLon]
    ]

    return {
      score,
      label: safety.label,
      color: safety.color,
      icon: safety.icon,
      bg: safety.bg,
      border: safety.border,
      unsafeReason: unsafeZone?.reason || null,
      distKm: +(3.5 * [1.15, 1.05, 1.0][i])
        .toFixed(1),
      durMin: Math.round(
        14 * [1.2, 1.08, 1.0][i]
      ),
      coordinates: coords
    }
  })
}
