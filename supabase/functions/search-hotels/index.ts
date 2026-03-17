// @ts-nocheck — Supabase Edge Functions run on Deno; Deno and JSR imports are available at deploy time.
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

const BASE_URL = Deno.env.get("LITEAPI_BASE_URL") ?? "https://api.liteapi.travel/v1";
const API_KEY = Deno.env.get("LITEAPI_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: "LITEAPI_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json() as {
      location?: string;
      checkIn?: string;
      checkOut?: string;
      guests?: number;
      currency?: string;
      guestNationality?: string;
    };

    const location = typeof body.location === "string" ? body.location.trim() : "";
    const checkIn = body.checkIn ?? "";
    const checkOut = body.checkOut ?? "";
    const guests = Math.max(1, Number(body.guests) || 2);
    const currency = body.currency ?? "USD";
    const guestNationality = body.guestNationality ?? "US";

    if (!location) {
      return new Response(
        JSON.stringify({ error: "location is required", data: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ error: "checkIn and checkOut are required", data: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiSearchQuery = location.toLowerCase().startsWith("hotel")
      ? location
      : `Hotels in ${location}`;

    const ratesBody = {
      aiSearch: aiSearchQuery,
      checkin: checkIn,
      checkout: checkOut,
      occupancies: [{ adults: guests }],
      currency,
      guestNationality,
      includeHotelData: true,
      maxRatesPerHotel: 5,
      limit: 100,
    };

    const res = await fetch(`${BASE_URL}/hotels/rates`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(ratesBody),
    });

    const text = await res.text();

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error: "LiteAPI request failed",
          liteapi_status: res.status,
          liteapi_response: text.slice(0, 500),
          data: [],
        }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON from LiteAPI", data: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message, data: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
