interface GeocodingResult {
  formatted_address: string
  place_id: string
}

export const geocodingService = {
  reverseGeocode: async (
    lat: number,
    lng: number,
    apiKey: string,
  ): Promise<string | null> => {
    if (!apiKey) {
      console.warn('Google Maps API Key required for geocoding')
      return null
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
      )
      const data = await response.json()

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address
      } else {
        console.warn('Geocoding failed:', data.status)
        return null
      }
    } catch (error) {
      console.error('Geocoding request failed', error)
      return null
    }
  },
}
