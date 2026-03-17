import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
import { searchPlaces } from './liteapi.ts'
import { validateSearchParams } from './validate.ts'

console.log(`Function "search-places" up and running!`)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const params = {
      textQuery: url.searchParams.get('textQuery'),
      type: url.searchParams.get('type'),
      language: url.searchParams.get('language'),
      clientIP: url.searchParams.get('clientIP'),
    }

    validateSearchParams(params)

    const data = await searchPlaces(params)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
