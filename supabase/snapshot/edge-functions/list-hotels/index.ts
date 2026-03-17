import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

console.log(`Function "list-hotels" up and running!`)

const BASE_URL = Deno.env.get('LITEAPI_BASE_URL')
const API_KEY = Deno.env.get('LITEAPI_KEY')

if (!BASE_URL) throw new Error('LITEAPI_BASE_URL is not set')
if (!API_KEY) throw new Error('LITEAPI_KEY is not set')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const sp = url.searchParams

    const countryCode = sp.get('countryCode')
    const cityName = sp.get('cityName')
    const placeId = sp.get('placeId')
    const hotelIds = sp.get('hotelIds')
    const latitude = sp.get('latitude')
    const longitude = sp.get('longitude')
    const radius = sp.get('radius')

    const hasCitySearch = countryCode && cityName
    const hasPlaceSearch = placeId
    const hasHotelIdsSearch = hotelIds
    const hasGeoSearch = latitude && longitude && radius

    if (!hasCitySearch && !hasPlaceSearch && !hasHotelIdsSearch && !hasGeoSearch) {
      return new Response(
        JSON.stringify({
          error:
            'You must provide one of: (countryCode + cityName), placeId, hotelIds, or (latitude + longitude + radius)',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const query = new URLSearchParams()

    if (countryCode) query.append('countryCode', countryCode)
    if (cityName) query.append('cityName', cityName)
    if (placeId) query.append('placeId', placeId)
    if (hotelIds) query.append('hotelIds', hotelIds)
    if (latitude) query.append('latitude', latitude)
    if (longitude) query.append('longitude', longitude)
    if (radius) query.append('radius', radius)

    const optionalParams = [
      'hotelName',
      'offset',
      'limit',
      'lastUpdatedAt',
      'zip',
      'minRating',
      'minReviewsCount',
      'facilityIds',
      'hotelTypeIds',
      'chainIds',
      'strictFacilitiesFiltering',
      'starRating',
      'language',
      'advancedAccessibilityOnly',
      'aiSearch',
      'timeout',
    ]

    optionalParams.forEach((param) => {
      const value = sp.get(param)
      if (value) query.append(param, value)
    })

    const response = await fetch(
      `${BASE_URL}/data/hotels?${query.toString()}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          accept: 'application/json',
        },
      }
    )

    const text = await response.text()

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          liteapi_status: response.status,
          liteapi_response: text,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
