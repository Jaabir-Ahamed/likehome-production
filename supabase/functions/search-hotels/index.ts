import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const BASE_URL =
  Deno.env.get("LITEAPI_BASE_URL") ?? "https://api.liteapi.travel/v1";
const API_KEY = Deno.env.get("LITEAPI_KEY");

if (!API_KEY) throw new Error("LITEAPI_KEY is not set");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      countryCode,
      cityName,
      latitude,
      longitude,
      radius,
      checkin,
      checkout,
      adults = 2,
      rooms = 1,
      currency = "USD",
      guestNationality = "US",
      limit = 20,
      minRating,
      starRating,
      facilityIds,
    } = body;

    // Step 1: Fetch hotel list from LiteAPI
    const query = new URLSearchParams();
    if (countryCode) query.append("countryCode", countryCode);
    if (cityName) query.append("cityName", cityName);
    if (latitude) query.append("latitude", String(latitude));
    if (longitude) query.append("longitude", String(longitude));
    if (radius) query.append("radius", String(radius));
    if (limit) query.append("limit", String(limit));
    if (minRating) query.append("minRating", String(minRating));
    if (starRating) query.append("starRating", String(starRating));
    if (facilityIds) query.append("facilityIds", facilityIds);

    const hotelsRes = await fetch(
      `${BASE_URL}/data/hotels?${query.toString()}`,
      {
        method: "GET",
        headers: { "X-API-Key": API_KEY, accept: "application/json" },
      }
    );

    const hotelsText = await hotelsRes.text();
    if (!hotelsRes.ok) {
      return new Response(
        JSON.stringify({
          liteapi_status: hotelsRes.status,
          liteapi_response: hotelsText,
        }),
        {
          status: hotelsRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: liteHotels } = JSON.parse(hotelsText);

    if (!liteHotels || liteHotels.length === 0) {
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hotelIds = liteHotels.map((h: { id: string }) => h.id);

    // Step 2: Fetch live rates from LiteAPI
    const occupancies = Array.from({ length: Number(rooms) }, () => ({
      adults: Number(adults),
    }));

    const ratesRes = await fetch(`${BASE_URL}/hotels/rates`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        hotelIds,
        checkin,
        checkout,
        occupancies,
        currency,
        guestNationality,
        timeout: 10,
      }),
    });

    const ratesText = await ratesRes.text();

    let rates: { hotelId: string; roomTypes: unknown[] }[] = [];
    if (ratesRes.ok) {
      const parsed = JSON.parse(ratesText);
      rates = parsed.data ?? [];
    }

    // Step 3: Merge hotels + rates
    const rateMap = new Map(
      rates.map((r: { hotelId: string; roomTypes: unknown[] }) => [
        r.hotelId,
        r,
      ])
    );

    const results = liteHotels
      .map((h: Record<string, unknown>) => {
        const hotelRate = rateMap.get(h.id as string) as
          | { roomTypes: { offerRetailRate?: { amount: number } }[] }
          | undefined;
        return {
          ...h,
          rates: hotelRate ?? null,
          lowestRate:
            hotelRate?.roomTypes?.[0]?.offerRetailRate?.amount ?? null,
        };
      })
      .sort(
        (
          a: { lowestRate: number | null },
          b: { lowestRate: number | null }
        ) => (a.lowestRate ?? 9999) - (b.lowestRate ?? 9999)
      );

    return new Response(JSON.stringify({ data: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
