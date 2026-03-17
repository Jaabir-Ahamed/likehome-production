import { useEffect, useState, useCallback } from "react";
import { api } from "../api/liteApi";
import { useAuth } from "../context/AuthContext";
import type { SearchHotelResult } from "../types/liteapi";

interface UseHotelSearchParams {
  cityName: string;
  checkin: string;
  checkout: string;
  guests: number;
  currency?: string;
}

interface UseHotelSearchReturn {
  hotels: SearchHotelResult[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHotelSearch(
  params: UseHotelSearchParams
): UseHotelSearchReturn {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<SearchHotelResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { cityName, checkin, checkout, guests, currency = "USD" } = params;

  const fetchHotels = useCallback(async () => {
    if (!cityName || !checkin || !checkout) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.searchHotelRates({
        cityName: cityName.trim(),
        checkin,
        checkout,
        adults: guests,
        rooms: 1,
        currency,
        guestNationality: "US",
        limit: 20,
        userId: user?.id,
      });

      setHotels(response.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to search hotels";
      setError(message);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, [cityName, checkin, checkout, guests, currency, user?.id]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  return { hotels, loading, error, refetch: fetchHotels };
}
