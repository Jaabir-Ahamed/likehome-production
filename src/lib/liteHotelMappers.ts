/**
 * Helpers to normalize LiteAPI / Edge Function responses for hotel search & rates.
 */

export function defaultCheckInOut(): { checkIn: string; checkOut: string } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return {
    checkIn: start.toISOString().slice(0, 10),
    checkOut: end.toISOString().slice(0, 10),
  };
}

export function extractFirstPlaceId(placesRaw: unknown): string | null {
  const o = placesRaw as { data?: Array<{ placeId?: string }> };
  const first = o?.data?.[0];
  return typeof first?.placeId === "string" ? first.placeId : null;
}

export type HotelListCard = {
  id: string;
  name: string;
  location: string;
  neighborhood: string;
  rating: number;
  reviews: number;
  price: number;
  images: string[];
  stars: number;
  amenities: string[];
  description: string;
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : null;
}

export function mapHotelsListResponse(raw: unknown): HotelListCard[] {
  const root = asRecord(raw);
  let rows: unknown[] = [];
  if (Array.isArray(root?.data)) rows = root!.data as unknown[];
  else if (Array.isArray(raw)) rows = raw as unknown[];

  return rows.map((row) => {
    const h = asRecord(row) ?? {};
    const hotelId = String(h.hotelId ?? h.id ?? "");
    const name = String(h.name ?? h.hotelName ?? "Hotel");
    const city = String(h.city ?? h.cityName ?? "");
    const country = String(h.country ?? "");
    const location = [city, country].filter(Boolean).join(", ") || name;
    const neighborhood = city || "—";
    const rating =
      typeof h.rating === "number"
        ? h.rating
        : typeof h.reviewScore === "number"
          ? h.reviewScore
          : 0;
    const reviews =
      typeof h.reviewCount === "number"
        ? h.reviewCount
        : typeof h.numberOfReviews === "number"
          ? h.numberOfReviews
          : 0;
    const stars =
      typeof h.starRating === "number"
        ? Math.min(5, Math.max(1, Math.round(h.starRating)))
        : typeof h.stars === "number"
          ? Math.min(5, Math.max(1, Math.round(h.stars)))
          : 4;
    const thumb =
      typeof h.thumbnail === "string"
        ? h.thumbnail
        : typeof h.main_photo === "string"
          ? h.main_photo
          : typeof (h.image as string) === "string"
            ? (h.image as string)
            : PLACEHOLDER;
    const desc =
      typeof h.description === "string"
        ? h.description
        : typeof h.hotelDescription === "string"
          ? stripHtml(String(h.hotelDescription)).slice(0, 220)
          : `${name} — ${location}`;

    const amenities: string[] = [];
    const fac = h.hotelFacilities ?? h.facilities;
    if (Array.isArray(fac)) {
      for (const f of fac.slice(0, 8)) {
        if (typeof f === "string") amenities.push(f.toLowerCase());
        else if (f && typeof f === "object" && "name" in (f as object))
          amenities.push(String((f as { name: string }).name).toLowerCase());
      }
    }

    return {
      id: hotelId,
      name,
      location,
      neighborhood,
      rating,
      reviews,
      price: 0,
      images: [thumb],
      stars,
      amenities: amenities.length ? mapAmenityKeywords(amenities) : ["wifi"],
      description: desc,
    };
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function mapAmenityKeywords(names: string[]): string[] {
  const out = new Set<string>();
  for (const n of names) {
    const low = n.toLowerCase();
    if (/wifi|internet/.test(low)) out.add("wifi");
    if (/restaurant|dining|bar/.test(low)) out.add("restaurant");
    if (/parking|garage/.test(low)) out.add("parking");
    if (/gym|fitness/.test(low)) out.add("gym");
  }
  return out.size ? Array.from(out) : ["wifi"];
}

export function mergeMinRatesFromResponse(
  hotels: HotelListCard[],
  ratesRaw: unknown,
): void {
  type RateRow = {
    hotelId?: string;
    roomTypes?: Array<{ rates?: Array<{ price?: number }> }>;
  };
  const o = ratesRaw as { data?: RateRow[] };
  const rows = o?.data ?? [];
  const minByHotel = new Map<string, number>();

  for (const h of rows) {
    const hid = h.hotelId;
    if (!hid) continue;
    let min = Infinity;
    for (const rt of h.roomTypes ?? []) {
      for (const r of rt.rates ?? []) {
        if (typeof r.price === "number" && r.price < min) min = r.price;
      }
    }
    if (min !== Infinity) minByHotel.set(hid, min);
  }

  for (const card of hotels) {
    const p = minByHotel.get(card.id);
    if (p !== undefined) card.price = p;
  }
}

export function firstOfferIdFromRates(ratesRaw: unknown): string | null {
  type RateRow = {
    roomTypes?: Array<{ rates?: Array<{ offerId?: string }> }>;
  };
  const o = ratesRaw as { data?: RateRow[] };
  const list = o?.data ?? [];
  for (const h of list) {
    for (const rt of h.roomTypes ?? []) {
      for (const r of rt.rates ?? []) {
        if (typeof r.offerId === "string" && r.offerId) return r.offerId;
      }
    }
  }
  return null;
}
