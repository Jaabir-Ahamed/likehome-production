import { supabase } from "../lib/supabaseClient";

type HotelSearchOptions = {
  limit?: number;
  offset?: number;
  language?: string;
  starRating?: string;
  minRating?: number;
};

type HotelSearchParams =
  | { placeId: string; countryCode?: never; cityName?: never }
  | { countryCode: string; cityName: string; placeId?: never };

type HotelRatesParams = {
  hotelIds: string[];
  checkin: string;
  checkout: string;
  occupancies: { adults: number; children?: number[] }[];
  currency?: string;
  guestNationality?: string;
  timeout?: number;
  limit?: number;
  offset?: number;
  roomMapping?: boolean;
};

type PrebookParams = {
  offerId: string;
  usePaymentSdk: boolean;
  voucherCode?: string;
  addons?: {
    addon: string;
    value?: number;
    currency?: string;
    addonDetails?: {
      packageId?: string;
      destinationCode?: string;
      startDate?: string;
      endDate?: string;
    };
  }[];
  bedTypeIds?: string[];
  includeCreditBalance?: boolean;
};

type BookGuest = {
  occupancyNumber: number;
  firstName: string;
  lastName: string;
  email: string;
};

type BookHolder = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type BookPayment = {
  method: "ACC_CREDIT_CARD" | "WALLET" | "CREDIT" | "TRANSACTION_ID";
  transactionId?: string;
};

type BookParams = {
  prebookId: string;
  holder: BookHolder;
  guests: BookGuest[];
  payment: BookPayment;
  clientReference?: string;
  metadata?: Record<string, unknown>;
  guestPayment?: Record<string, unknown>;
};

/** LiteAPI / find-places autocomplete */
export type Place = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  types: string[];
};

/** Normalized hotel row from search-hotel-rates edge function */
export type NormalizedHotel = {
  hotelId: string | null;
  name: string | null;
  image: string | null;
  address: string | null;
  city?: string | null;
  country?: string | null;
  starRating: number;
  reviewRating?: number;
  reviewCount?: number;
  price: number | null;
  currency: string;
};

export type HotelRateSearchParams = {
  placeId: string;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
  currency: string;
  guestNationality: string;
  limit?: number;
};

export const api = {
  getCountries: async () => {
    const { data, error } = await supabase.functions.invoke("countries");
    if (error) throw error;
    return data;
  },

  getCities: async (countryCode: string) => {
    const { data, error } = await supabase.functions.invoke(
      `cities?countryCode=${encodeURIComponent(countryCode)}`
    );
    if (error) throw error;
    return data;
  },

  /** Org repo: `places` edge function */
  getPlaces: async (query: string) => {
    const { data, error } = await supabase.functions.invoke(
      `places?textQuery=${encodeURIComponent(query)}`
    );
    if (error) throw error;
    return data;
  },

  /** Your deployed edge function name: find-places */
  findPlaces: async (textQuery: string): Promise<Place[]> => {
    const { data, error } = await supabase.functions.invoke(
      `find-places?textQuery=${encodeURIComponent(textQuery)}`
    );
    if (error) throw error;
    return data?.data ?? data ?? [];
  },

  getHotels: async (
    search: HotelSearchParams,
    options?: HotelSearchOptions
  ) => {
    const params = new URLSearchParams();

    if (search.placeId) {
      params.append("placeId", search.placeId);
    } else {
      const { countryCode, cityName } = search as {
        countryCode: string;
        cityName: string;
      };
      params.append("countryCode", encodeURIComponent(countryCode));
      params.append("cityName", encodeURIComponent(cityName));
    }

    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.offset) params.append("offset", String(options.offset));
    if (options?.language) params.append("language", options.language);
    if (options?.starRating) params.append("starRating", options.starRating);
    if (options?.minRating)
      params.append("minRating", String(options.minRating));

    const { data, error } = await supabase.functions.invoke(
      `list-hotels?${params.toString()}`
    );
    if (error) throw error;
    return data;
  },

  getFacilities: async () => {
    const { data, error } = await supabase.functions.invoke("list-facilities");
    if (error) throw error;
    return data;
  },

  getHotelDetails: async (hotelId: string) => {
    const { data, error } = await supabase.functions.invoke(
      `hotel-details?hotelId=${encodeURIComponent(hotelId)}`
    );
    if (error) throw error;
    return data;
  },

  /** Hotel listing: normalized rates from search-hotel-rates */
  searchHotelRates: async (params: HotelRateSearchParams) => {
    const { data, error } = await supabase.functions.invoke(
      "search-hotel-rates",
      {
        body: {
          placeId: params.placeId,
          checkin: params.checkin,
          checkout: params.checkout,
          adults: params.adults,
          rooms: params.rooms,
          currency: params.currency,
          guestNationality: params.guestNationality,
          limit: params.limit ?? 20,
          includeHotelData: true,
          maxRatesPerHotel: 1,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  /** Org: POST hotel-rate */
  getHotelRates: async (params: HotelRatesParams) => {
    const { data, error } = await supabase.functions.invoke("hotel-rate", {
      body: params,
      method: "POST",
    });
    if (error) throw error;
    return data;
  },

  getRatesPrebook: async (params: PrebookParams) => {
    const { data, error } = await supabase.functions.invoke("rates-prebook", {
      body: params,
      method: "POST",
    });
    if (error) throw error;
    return data;
  },

  getRatesBook: async (params: BookParams) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const clientReference =
      params.clientReference ??
      `${user?.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    const { data, error } = await supabase.functions.invoke("rates-book", {
      body: { ...params, clientReference },
      method: "POST",
    });
    if (error) throw error;
    return data;
  },

  getBooking: async (bookingId: string) => {
    const { data, error } = await supabase.functions.invoke(
      "bookings-retrieve",
      {
        body: { bookingId },
        method: "POST",
      }
    );
    if (error) throw error;
    return data;
  },

  getListBookings: async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("booking_id");

    if (error) throw error;
    return { data: { data } };
  },
};
