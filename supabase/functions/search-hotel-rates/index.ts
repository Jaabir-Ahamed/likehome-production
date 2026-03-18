import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// deno-lint-ignore no-explicit-any
function normalizeHotel(item: any) {
  const h = item.hotel ?? {};
  const rates: any[] = item.rates ?? [];
  const rateTotal = rates[0]?.retailRate?.total;
  const price =
    Array.isArray(rateTotal) && rateTotal.length > 0
      ? rateTotal[0].amount
      : (item.lowestRate ?? null);
  const currency =
    Array.isArray(rateTotal) && rateTotal.length > 0
      ? rateTotal[0].currency
      : "USD";

  const images: any[] = h.images ?? [];
  const image: string | null =
    images[0]?.url ?? h.mainPhoto ?? item.mainPhoto ?? null;

  return {
    hotelId: item.hotelId ?? h.hotelId ?? null,
    name: h.name ?? h.hotelName ?? item.hotelName ?? null,
    image,
    address: h.address ?? item.address ?? null,
    city: h.city ?? item.city ?? null,
    country: h.country ?? item.country ?? null,
    starRating: h.starRating ?? item.starRating ?? 0,
    reviewRating: h.reviewRating ?? item.reviewRating ?? 0,
    reviewCount: h.reviewCount ?? item.reviewCount ?? 0,
    price,
    currency,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LITEAPI_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LITEAPI_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Convert adults + rooms to the occupancies array LiteAPI expects
    const adults = Number(body.adults ?? 2);
    const rooms = Number(body.rooms ?? 1);
    const occupancies = Array.from({ length: rooms }, () => ({ adults }));

    const payload = {
      placeId: body.placeId,
      checkin: body.checkin,
      checkout: body.checkout,
      occupancies,
      currency: body.currency ?? "USD",
      guestNationality: body.guestNationality ?? "US",
      limit: body.limit ?? 30,
      includeHotelData: true,
      maxRatesPerHotel: 1,
    };

    const response = await fetch(
      "https://sandbox.liteapi.travel/v3.0/hotels/rates",
      {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const raw = await response.json();

    // Normalize into a consistent shape the frontend can rely on
    const hotels = Array.isArray(raw?.data) ? raw.data.map(normalizeHotel) : [];

    return new Response(
      JSON.stringify({ data: hotels, total: hotels.length }),
      {
        status: response.ok ? 200 : response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
