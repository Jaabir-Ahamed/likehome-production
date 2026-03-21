import { useEffect, useState, useCallback } from "react";
import { api } from "../api/liteApi";
import type { HotelDetail, HotelRatesResponse } from "../types/liteapi";

interface UseHotelDetailsReturn {
  hotel: HotelDetail | null;
  rates: HotelRatesResponse | null;
  loading: boolean;
  error: string | null;
  fetchRates: (
    checkin: string,
    checkout: string,
    adults: number,
    currency: string
  ) => Promise<void>;
}

export function useHotelDetails(hotelId: string | undefined): UseHotelDetailsReturn {
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [rates, setRates] = useState<HotelRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getHotelDetails(hotelId)
      .then((data) => {
        if (!cancelled) setHotel(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load hotel details"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hotelId]);

  const fetchRates = useCallback(
    async (
      checkin: string,
      checkout: string,
      adults: number,
      currency: string
    ) => {
      if (!hotelId) return;

      try {
        const data = await api.getHotelRatesForHotelId(
          hotelId,
          checkin,
          checkout,
          adults,
          currency,
          "US"
        );
        setRates(data);
      } catch (err) {
        console.error("Failed to fetch rates:", err);
      }
    },
    [hotelId]
  );

  return { hotel, rates, loading, error, fetchRates };
}
