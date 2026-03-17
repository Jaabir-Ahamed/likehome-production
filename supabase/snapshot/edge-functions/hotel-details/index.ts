import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

console.log(`Function "hotel-details" up and running!`)

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

    const hotelId = sp.get('hotelId')
    const language = sp.get('language')
    const timeout = sp.get('timeout')
    const advancedAccessibilityOnly = sp.get('advancedAccessibilityOnly')

    if (!hotelId) {
      return new Response(
        JSON.stringify({ error: 'hotelId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const query = new URLSearchParams()

    query.append('hotelId', hotelId)

    if (language) query.append('language', language)
    if (timeout) query.append('timeout', timeout)
    if (advancedAccessibilityOnly)
      query.append('advancedAccessibilityOnly', advancedAccessibilityOnly)

    const response = await fetch(
      `${BASE_URL}/data/hotel?${query.toString()}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          accept: 'application/json'
        }
      }
    )

    const text = await response.text()

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          liteapi_status: response.status,
          liteapi_response: text
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(text, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
      }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
