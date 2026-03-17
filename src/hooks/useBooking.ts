import { useState, useCallback } from "react";
import { api } from "../api/liteApi";
import type { PrebookResponse, BookResponse } from "../types/liteapi";

type BookingStage =
  | "idle"
  | "prebooking"
  | "prebooked"
  | "booking"
  | "confirmed"
  | "error";

interface UseBookingReturn {
  stage: BookingStage;
  prebookData: PrebookResponse | null;
  bookingData: BookResponse | null;
  error: string | null;
  isOverlapping: boolean;
  prebook: (offerId: string) => Promise<void>;
  confirm: (params: {
    holder: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    hotelMeta: {
      hotelId: string;
      hotelName: string;
      hotelImage: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      rooms: number;
      totalAmount: number;
      currency: string;
      offerId: string;
    };
  }) => Promise<boolean>;
  reset: () => void;
}

export function useBooking(): UseBookingReturn {
  const [stage, setStage] = useState<BookingStage>("idle");
  const [prebookData, setPrebookData] = useState<PrebookResponse | null>(null);
  const [bookingData, setBookingData] = useState<BookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOverlapping, setIsOverlapping] = useState(false);

  const prebook = useCallback(async (offerId: string) => {
    setStage("prebooking");
    setError(null);
    setIsOverlapping(false);

    try {
      const data = await api.prebookRate(offerId);
      setPrebookData(data);
      setStage("prebooked");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to prebook. Please try again."
      );
      setStage("error");
    }
  }, []);

  const confirm = useCallback(
    async (params: {
      holder: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      };
      hotelMeta: {
        hotelId: string;
        hotelName: string;
        hotelImage: string;
        checkIn: string;
        checkOut: string;
        guests: number;
        rooms: number;
        totalAmount: number;
        currency: string;
        offerId: string;
      };
    }): Promise<boolean> => {
      if (!prebookData) {
        setError("No prebook session found. Please try again.");
        setStage("error");
        return false;
      }

      setStage("booking");
      setError(null);
      setIsOverlapping(false);

      try {
        const data = await api.bookRate({
          prebookId: prebookData.prebookId,
          holder: params.holder,
          guests: [
            {
              occupancyNumber: 1,
              firstName: params.holder.firstName,
              lastName: params.holder.lastName,
              email: params.holder.email,
              phone: params.holder.phone,
            },
          ],
          hotelMeta: params.hotelMeta,
        });

        setBookingData(data);
        setStage("confirmed");
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Booking failed. Please try again.";

        if (message.includes("OVERLAPPING_BOOKING") || message.includes("23P01")) {
          setIsOverlapping(true);
          setError(
            "You already have a booking that overlaps with these dates. Please choose different dates."
          );
        } else {
          setError(message);
        }

        setStage("error");
        return false;
      }
    },
    [prebookData]
  );

  const reset = useCallback(() => {
    setStage("idle");
    setPrebookData(null);
    setBookingData(null);
    setError(null);
    setIsOverlapping(false);
  }, []);

  return {
    stage,
    prebookData,
    bookingData,
    error,
    isOverlapping,
    prebook,
    confirm,
    reset,
  };
}
