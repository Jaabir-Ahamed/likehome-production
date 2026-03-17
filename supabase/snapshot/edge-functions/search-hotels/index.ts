import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log(`Function "search-hotels" up and running!`)

const BASE_URL = Deno.env.get('LITEAPI_BASE_URL')
const API_KEY  = Deno.env.get('LITEAPI_KEY')
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SUPABASE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

if (!BASE_URL) throw new Error('LITEAPI_BASE_URL is not set')
if (!API_KEY)  throw new Error('LITEAPI_KEY is not set')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      countryCode,
      cityName,
      latitude,
      longitude,
      radius,
      checkin,
      checkout,
      adults = 2,
      rooms  = 1,
      currency = 'USD',
      guestNationality = 'US',
      limit       = '20',
      minRating,
      starRating,
      facilityIds,
      userId,
    } = body

    // Step 1: Fetch hotel list from LiteAPI
    const query = new URLSearchParams()
    if (countryCode) query.append('countryCode', countryCode)
    if (cityName)    query.append('cityName',    cityName)
    if (latitude)    query.append('latitude',    String(latitude))
    if (longitude)   query.append('longitude',   String(longitude))
    if (radius)      query.append('radius',      String(radius))
    if (limit)       query.append('limit',       String(limit))
    if (minRating)   query.append('minRating',   String(minRating))
    if (starRating)  query.append('starRating',  String(starRating))
    if (facilityIds) query.append('facilityIds', facilityIds)

    const hotelsRes = await fetch(
      `${BASE_URL}/data/hotels?${query.toString()}`,
      {
        method: 'GET',
        headers: { 'X-API-Key': API_KEY, accept: 'application/json' },
      }
    )
    const hotelsText = await hotelsRes.text()
    if (!hotelsRes.ok) {
      return new Response(
        JSON.stringify({ liteapi_status: hotelsRes.status, liteapi_response: hotelsText }),
        { status: hotelsRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { data: liteHotels } = JSON.parse(hotelsText)
    const hotelIds = liteHotels.map((h: any) => h.id)

    // Step 2: Fetch live rates from LiteAPI
    const ratesRes = await fetch(`${BASE_URL}/hotels/rates`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        hotelIds,
        checkin,
        checkout,
        adults:  Number(adults),
        rooms:   Number(rooms),
        currency,
        guestNationality,
      }),
    })
    const ratesText = await ratesRes.text()
    if (!ratesRes.ok) {
      return new Response(
        JSON.stringify({ liteapi_status: ratesRes.status, liteapi_response: ratesText }),
        { status: ratesRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { data: rates } = JSON.parse(ratesText)

    // Step 3: Merge hotels + rates
    const rateMap = new Map(rates.map((r: any) => [r.hotelId, r]))
    const results = liteHotels
      .map((h: any) => ({
        ...h,
        rates: rateMap.get(h.id) ?? null,
        lowestRate: rateMap.get(h.id)
          ?.rooms?.[0]?.rates?.[0]?.retailRate?.total?.[0]?.amount ?? null,
      }))
      .filter((h: any) => h.rates !== null)
      .sort((a: any, b: any) => (a.lowestRate ?? 9999) - (b.lowestRate ?? 9999))

    // Step 4: Cross-reference with Supabase hotels table
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const hotelNames = results.map((h: any) => h.name).filter(Boolean)
    const { data: dbHotels } = await supabase
      .from('hotels')
      .select(`
        id,
        name,
        description,
        star_rating,
        review_score,
        review_count,
        check_in_time,
        check_out_time,
        min_check_in_age,
        destination_fee,
        currency,
        locations (
          address_line1,
          address_line2,
          city,
          state,
          country,
          postal_code,
          latitude,
          longitude
        )
      `)
      .in('name', hotelNames)

    const dbMap = new Map((dbHotels ?? []).map((h: any) => [h.name, h]))

    const enriched = results.map((h: any) => {
      const db = dbMap.get(h.name)
      return db
        ? {
            ...h,
            db_id:           db.id,
            description:     db.description ?? h.description,
            star_rating:     db.star_rating  ?? h.starRating,
            review_score:    db.review_score,
            review_count:    db.review_count,
            check_in_time:   db.check_in_time,
            check_out_time:  db.check_out_time,
            min_check_in_age: db.min_check_in_age,
            destination_fee: db.destination_fee,
            location:        db.locations,
          }
        : h
    })

    // Step 5: Log search + award reward points
    if (userId) {
      try {
        await supabase.from('hotel_searches').insert(
          enriched.slice(0, 50).map((h: any) => ({
            user_id:     userId,
            hotel_id:    h.id,
            hotel_name:  h.name,
            destination: cityName ?? `${latitude},${longitude}`,
            checkin,
            checkout,
            rate_usd:    h.lowestRate,
            searched_at: new Date().toISOString(),
          }))
        )

        await supabase.rpc('increment_reward_points', {
          p_user_id: userId,
          p_points:  1,
        })
      } catch (_) {
        // Analytics failure never blocks the search response
      }
    }

    return new Response(JSON.stringify({ data: enriched }), {
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
