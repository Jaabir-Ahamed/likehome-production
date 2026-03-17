import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import type { Booking } from "../types/database";

interface UseMyBookingsReturn {
  scheduled: Booking[];
  previous: Booking[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  cancelBooking: (bookingId: string) => Promise<boolean>;
}

export function useMyBookings(): UseMyBookingsReturn {
  const { user } = useAuth();
  const [scheduled, setScheduled] = useState<Booking[]>([]);
  const [previous, setPrevious] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("check_in", { ascending: true });

      if (fetchError) throw fetchError;

      const today = new Date().toISOString().split("T")[0];
      const bookings = (data ?? []) as Booking[];

      setScheduled(
        bookings.filter(
          (b) => b.check_in >= today && b.status !== "cancelled"
        )
      );
      setPrevious(
        bookings.filter(
          (b) => b.check_in < today || b.status === "cancelled"
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load bookings"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = useCallback(
    async (bookingId: string): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId)
          .eq("user_id", user?.id);

        if (updateError) throw updateError;

        await fetchBookings();
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to cancel booking"
        );
        return false;
      }
    },
    [user, fetchBookings]
  );

  return { scheduled, previous, loading, error, refetch: fetchBookings, cancelBooking };
}
