import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

console.log(`Function "facilities" up and running!`)

const BASE_URL = Deno.env.get('LITEAPI_BASE_URL')
const API_KEY = Deno.env.get('LITEAPI_KEY')

if (!BASE_URL) throw new Error('LITEAPI_BASE_URL is not set')
if (!API_KEY) throw new Error('LITEAPI_KEY is not set')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const response = await fetch(`${BASE_URL}/data/facilities`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        accept: 'application/json',
      },
    })

    const json = await response.json()

    const facilities = json.data.map((f: any) => {
      const name = f.facility || ""

      const surcharge = /surcharge/i.test(name)

      const cleanName = name
        .replace(/\(surcharge\)/gi, '')
        .replace(/-\s*surcharge/gi, '')
        .trim()

      return {
        id: f.facility_id,
        name: cleanName,
        surcharge
      }
    })

    return new Response(
      JSON.stringify({ data: facilities }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        },
      }
    )

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
