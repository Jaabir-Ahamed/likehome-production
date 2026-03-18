import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LITEAPI_BASE = "https://sandbox.liteapi.travel/v3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// deno-lint-ignore no-explicit-any
function str(v: any): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  return null;
}

// deno-lint-ignore no-explicit-any
function num(v: any): number {
  return typeof v === "number" ? v : 0;
}

// deno-lint-ignore no-explicit-any
function resolveAddress(h: any, item: any): { address: string | null; city: string | null; country: string | null } {
  // address may be a plain string or a nested object
  const addrObj = h?.address ?? item?.address;
  if (addrObj && typeof addrObj === "object") {
    return {
      address: str(addrObj.street ?? addrObj.line1 ?? addrObj.addressLine1),
      city: str(addrObj.city ?? addrObj.cityName),
      country: str(addrObj.country ?? addrObj.countryCode),
    };
  }
  return {
    address: str(addrObj) ?? str(h?.street) ?? str(item?.street),
    city: str(h?.city ?? h?.cityName ?? item?.city ?? item?.cityName),
    country: str(h?.country ?? h?.countryCode ?? item?.country ?? item?.countryCode),
  };
}

// deno-lint-ignore no-explicit-any
function resolveImage(h: any, item: any): string | null {
  // Try images array (various shapes)
  const imagesArr: any[] = h?.images ?? item?.images ?? [];
  for (const img of imagesArr) {
    const url = str(img?.url ?? img?.urlMax ?? img?.urlHd ?? img);
    if (url) return url;
  }
  // Try single photo fields
  return (
    str(h?.mainPhoto ?? h?.photo ?? h?.thumbnail) ??
    str(item?.mainPhoto ?? item?.photo ?? item?.thumbnail) ??
    null
  );
}

// deno-lint-ignore no-explicit-any
function resolvePrice(item: any): number | null {
  // rates[] -> retailRate.total[0].amount
  const rates: any[] = item?.rates ?? item?.rooms ?? [];
  for (const rate of rates) {
    const total = rate?.retailRate?.total ?? rate?.retailRate?.price;
    if (Array.isArray(total) && total.length > 0) {
      const amount = total[0]?.amount ?? total[0]?.price ?? total[0];
      if (typeof amount === "number") return amount;
    }
    // flat amount on rate itself
    if (typeof rate?.amount === "number") return rate.amount;
    if (typeof rate?.price === "number") return rate.price;
  }
  // top-level fallbacks
  if (typeof item?.lowestRate === "number") return item.lowestRate;
  if (typeof item?.price === "number") return item.price;
  if (typeof item?.minRate === "number") return item.minRate;
  return null;
}

// deno-lint-ignore no-explicit-any
function resolveCurrency(item: any): string {
  const rates: any[] = item?.rates ?? item?.rooms ?? [];
  for (const rate of rates) {
    const total = rate?.retailRate?.total ?? rate?.retailRate?.price;
    if (Array.isArray(total) && total.length > 0) {
      const c = str(total[0]?.currency ?? total[0]?.currencyCode);
      if (c) return c;
    }
  }
  return str(item?.currency) ?? "USD";
}

// deno-lint-ignore no-explicit-any
function normalizeHotel(item: any) {
  // hotel data may sit under item.hotel, or directly on item
  const h = (item?.hotel && typeof item.hotel === "object") ? item.hotel : item;

  const name =
    str(h?.name ?? h?.hotelName ?? h?.title) ??
    str(item?.name ?? item?.hotelName ?? item?.title) ??
    null;

  const image = resolveImage(h, item);
  const { address, city, country } = resolveAddress(h, item);
  const price = resolvePrice(item);
  const currency = resolveCurrency(item);

  return {
    hotelId: str(item?.hotelId ?? h?.hotelId ?? h?.id ?? item?.id),
    name,
    image,
    address,
    city,
    country,
    starRating: num(h?.starRating ?? h?.stars ?? item?.starRating ?? item?.stars),
    reviewRating: num(h?.reviewRating ?? h?.rating ?? h?.reviewScore ?? item?.reviewRating ?? item?.rating),
    reviewCount: num(h?.reviewCount ?? h?.numReviews ?? item?.reviewCount ?? item?.numReviews),
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

    const response = await fetch(`${LITEAPI_BASE}/hotels/rates`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.json();

    // Log the first item so you can inspect the real shape in Supabase logs
    if (Array.isArray(raw?.data) && raw.data.length > 0) {
      console.log("[search-hotel-rates] first item sample:", JSON.stringify(raw.data[0]));
    } else {
      console.log("[search-hotel-rates] raw response:", JSON.stringify(raw));
    }

    const hotels = Array.isArray(raw?.data) ? raw.data.map(normalizeHotel) : [];

    return new Response(
      JSON.stringify({ data: hotels, total: hotels.length }),
      {
        status: 200,
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
