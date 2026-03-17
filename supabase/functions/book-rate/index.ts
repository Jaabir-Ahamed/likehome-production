import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BASE_URL =
  Deno.env.get("LITEAPI_BASE_URL") ?? "https://api.liteapi.travel/v1";
const API_KEY = Deno.env.get("LITEAPI_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!API_KEY) throw new Error("LITEAPI_KEY is not set");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prebookId, holder, guests, payment, hotelMeta } = await req.json();

    if (!prebookId || !holder || !guests) {
      return new Response(
        JSON.stringify({
          error: "prebookId, holder, and guests are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bookPayload: Record<string, unknown> = {
      prebookId,
      holder,
      guests,
      payment: payment ?? { method: "ACC_CREDIT_CARD" },
    };

    const res = await fetch(`${BASE_URL}/rates/book`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(bookPayload),
    });

    const text = await res.text();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ liteapi_status: res.status, liteapi_response: text }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const bookingResult = JSON.parse(text);

    // Mirror the booking in our Supabase bookings table
    if (hotelMeta) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Extract user ID from the JWT
      const {
        data: { user },
      } = await createClient(SUPABASE_URL, authHeader.replace("Bearer ", ""), {
        auth: { persistSession: false },
      }).auth.getUser();

      if (user) {
        try {
          const { error: insertError } = await supabase
            .from("bookings")
            .insert({
              user_id: user.id,
              liteapi_booking_id:
                bookingResult.data?.bookingId ?? bookingResult.bookingId ?? null,
              hotel_confirmation_code:
                bookingResult.data?.hotelConfirmationCode ?? null,
              liteapi_offer_id: hotelMeta.offerId,
              prebook_id: prebookId,
              hotel_id: hotelMeta.hotelId,
              hotel_name: hotelMeta.hotelName,
              hotel_image: hotelMeta.hotelImage ?? null,
              check_in: hotelMeta.checkIn,
              check_out: hotelMeta.checkOut,
              guests: hotelMeta.guests ?? 1,
              rooms: hotelMeta.rooms ?? 1,
              total_amount: hotelMeta.totalAmount,
              currency: hotelMeta.currency ?? "USD",
              status: "reserved",
              guest_first_name: holder.firstName,
              guest_last_name: holder.lastName,
              guest_email: holder.email,
              guest_phone: holder.phone ?? null,
            });

          if (insertError) {
            // Postgres exclusion constraint violation (overlapping dates)
            if (insertError.code === "23P01") {
              return new Response(
                JSON.stringify({
                  error: "OVERLAPPING_BOOKING",
                  message:
                    "You already have a booking that overlaps with these dates. Please choose different dates.",
                  details: insertError.message,
                }),
                {
                  status: 409,
                  headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                  },
                }
              );
            }
            console.error("Failed to insert booking:", insertError);
          }
        } catch (dbErr) {
          console.error("DB insert error:", dbErr);
        }
      }
    }

    return new Response(JSON.stringify(bookingResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
