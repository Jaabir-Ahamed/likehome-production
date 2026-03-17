export interface Booking {
  id: string;
  user_id: string;
  liteapi_booking_id: string | null;
  hotel_confirmation_code: string | null;
  liteapi_offer_id: string;
  prebook_id: string | null;
  hotel_id: string;
  hotel_name: string;
  hotel_image: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  rooms: number;
  total_amount: number;
  currency: string;
  status: "reserved" | "completed" | "cancelled";
  guest_first_name: string | null;
  guest_last_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  reward_points: number;
  role: "customer" | "property_owner";
  created_at: string;
}
