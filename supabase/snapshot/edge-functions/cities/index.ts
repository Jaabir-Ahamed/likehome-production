import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

console.log(`Function "cities" up and running!`)

const BASE_URL = Deno.env.get('LITEAPI_BASE_URL')
const API_KEY = Deno.env.get('LITEAPI_KEY')

if (!BASE_URL) {
  throw new Error('LITEAPI_BASE_URL is not set')
}

if (!API_KEY) {
  throw new Error('LITEAPI_KEY is not set')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const countryCode = url.searchParams.get('countryCode')

    if (!countryCode) {
      return new Response(
        JSON.stringify({ error: 'countryCode query parameter is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const response = await fetch(
      `${BASE_URL}/data/cities?countryCode=${encodeURIComponent(countryCode)}&timeout=1.5`,
      {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
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
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
