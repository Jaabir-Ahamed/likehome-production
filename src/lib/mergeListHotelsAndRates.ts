import type { NormalizedHotel } from "../types/hotel";

/** One row from list-hotels (flexible keys). */
function listHotelsRow(item: unknown): {
  hotelId: string;
  name: string | null;
  image: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  starRating: number;
  reviewRating: number;
  reviewCount: number;
} | null {
  if (!item || typeof item !== "object") return null;
  const h = item as Record<string, unknown>;
  const id = String(h.hotelId ?? h.id ?? "");
  if (!id) return null;
  const images = h.images as
    | { url?: string }[]
    | undefined;
  const img =
    (Array.isArray(images) && images[0]?.url) ||
    (typeof h.mainPhoto === "string" ? h.mainPhoto : null) ||
    (typeof h.main_photo === "string" ? h.main_photo : null) ||
    (typeof h.thumbnail === "string" ? h.thumbnail : null);

  return {
    hotelId: id,
    name: typeof h.name === "string" ? h.name : null,
    image: typeof img === "string" ? img : null,
    address: typeof h.address === "string" ? h.address : null,
    city: typeof h.city === "string" ? h.city : null,
    country: typeof h.country === "string" ? h.country : null,
    starRating: typeof h.starRating === "number" ? h.starRating : typeof h.stars === "number" ? h.stars : 0,
    reviewRating: typeof h.rating === "number" ? h.rating : 0,
    reviewCount: typeof h.reviewCount === "number" ? h.reviewCount : 0,
  };
}

function lowestPriceFromRatesItem(item: unknown): {
  price: number | null;
  currency: string;
} {
  if (!item || typeof item !== "object")
    return { price: null, currency: "USD" };
  const row = item as Record<string, unknown>;
  const roomTypes = row.roomTypes as unknown[] | undefined;
  if (!Array.isArray(roomTypes) || roomTypes.length === 0)
    return { price: null, currency: String(row.currency ?? "USD") };

  let best: number | null = null;
  let currency = String(row.currency ?? "USD");

  for (const rt of roomTypes) {
    if (!rt || typeof rt !== "object") continue;
    const r = rt as Record<string, unknown>;
    const offerRetail = r.offerRetailRate as { amount?: number; currency?: string } | undefined;
    if (offerRetail && typeof offerRetail.amount === "number") {
      best = best === null ? offerRetail.amount : Math.min(best, offerRetail.amount);
      if (offerRetail.currency) currency = offerRetail.currency;
      continue;
    }
    const rates = r.rates as unknown[] | undefined;
    if (Array.isArray(rates)) {
      for (const rate of rates) {
        if (!rate || typeof rate !== "object") continue;
        const rr = rate as Record<string, unknown>;
        const retail = rr.retailRate as { total?: { amount?: number; currency?: string }[] } | undefined;
        const total = retail?.total;
        if (Array.isArray(total) && total[0] && typeof total[0].amount === "number") {
          const amt = total[0].amount;
          best = best === null ? amt : Math.min(best, amt);
          if (total[0].currency) currency = total[0].currency;
        }
      }
    }
  }

  return { price: best, currency };
}

/**
 * Merge list-hotels rows with hotel-rate rows by `hotelId`.
 */
export function mergeListHotelsAndRates(
  listRaw: unknown,
  ratesRaw: unknown
): NormalizedHotel[] {
  const listRoot = listRaw as { data?: unknown[] } | unknown[] | null;
  const listArr = Array.isArray(listRoot)
    ? listRoot
    : Array.isArray(listRoot?.data)
      ? listRoot.data!
      : [];

  const ratesRoot = ratesRaw as { data?: unknown[] } | unknown[] | null;
  const ratesArr = Array.isArray(ratesRoot)
    ? ratesRoot
    : Array.isArray(ratesRoot?.data)
      ? ratesRoot.data!
      : [];

  const rateById = new Map<string, { price: number | null; currency: string }>();
  for (const r of ratesArr) {
    if (!r || typeof r !== "object") continue;
    const id = String((r as { hotelId?: string }).hotelId ?? "");
    if (!id) continue;
    rateById.set(id, lowestPriceFromRatesItem(r));
  }

  const out: NormalizedHotel[] = [];
  for (const item of listArr) {
    const meta = listHotelsRow(item);
    if (!meta) continue;
    const rate = rateById.get(meta.hotelId);
    out.push({
      hotelId: meta.hotelId,
      name: meta.name,
      image: meta.image,
      address: meta.address,
      city: meta.city,
      country: meta.country,
      starRating: meta.starRating,
      reviewRating: meta.reviewRating,
      reviewCount: meta.reviewCount,
      price: rate?.price ?? null,
      currency: rate?.currency ?? "USD",
    });
  }

  return out;
}
