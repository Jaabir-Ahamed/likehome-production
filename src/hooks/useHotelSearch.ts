import { useState, useEffect, useCallback } from "react";
import { api, type SearchHotelRatesResponse } from "../api/liteApi";

export interface HotelSearchResult {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviewCount: number;
  stars: number;
  price: number;
  currency: string;
  offerId: string;
}

function parseRatesResponse(res: SearchHotelRatesResponse): HotelSearchResult[] {
  const list = res?.data ?? [];
  const results: HotelSearchResult[] = [];

  for (const item of list) {
    const hotelId = item.hotelId ?? "";
    const hotel = item.hotel ?? {};
    const name = hotel.name ?? "Hotel";
    const city = hotel.city ?? "";
    const country = hotel.country ?? "";
    const location = [city, country].filter(Boolean).join(", ") || "—";
    const image = hotel.main_photo ?? "";
    const rating = hotel.rating ?? 0;
    const reviewCount = hotel.reviewCount ?? 0;
    const stars = hotel.stars ?? 0;

    let price = 0;
    let currency = "USD";
    let offerId = "";

    const roomTypes = item.roomTypes ?? [];
    for (const rt of roomTypes) {
      const rates = rt.rates ?? [];
      for (const rate of rates) {
        const total = rate.retailRate?.total?.[0] ?? rate.commission?.[0];
        if (total?.amount != null && (price === 0 || total.amount < price)) {
          price = total.amount;
          currency = total.currency ?? "USD";
          offerId = rt.offerId ?? "";
        }
      }
    }

    if (hotelId) {
      results.push({
        id: hotelId,
        name,
        location,
        image,
        rating,
        reviewCount,
        stars,
        price,
        currency,
        offerId,
      });
    }
  }

  return results;
}

export interface UseHotelSearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  currency?: string;
  guestNationality?: string;
}

export function useHotelSearch(params: UseHotelSearchParams) {
  const { location, checkIn, checkOut, guests, currency, guestNationality } = params;
  const [hotels, setHotels] = useState<HotelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSearch = useCallback(async () => {
    const hasLocation = location.trim().length > 0;
    const hasDates = checkIn && checkOut;
    if (!hasLocation || !hasDates) {
      setHotels([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.searchHotelRates({
        location: location.trim(),
        checkIn,
        checkOut,
        guests: Math.max(1, guests),
        currency,
        guestNationality,
      });
      if (res.error) {
        setError(res.error);
        setHotels([]);
      } else {
        setHotels(parseRatesResponse(res));
        setError(null);
      }
    } catch (e) {
      setError((e as Error).message);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [location, checkIn, checkOut, guests, currency, guestNationality]);

  useEffect(() => {
    fetchSearch();
  }, [fetchSearch]);

  return { hotels, loading, error, refetch: fetchSearch };
}
