import { supabase } from "../lib/supabaseClient";
import type {
  SearchHotelRatesParams,
  SearchHotelsResponse,
  HotelRatesResponse,
  PrebookResponse,
  BookRequest,
  BookResponse,
  HotelDetail,
} from "../types/liteapi";

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

  /** Org repo: places edge function */
  getPlaces: async (query: string) => {
    const { data, error } = await supabase.functions.invoke(
      `places?textQuery=${encodeURIComponent(query)}`
    );
    if (error) throw error;
    return data;
  },

  /** List hotels by placeId or country/city (union param) */
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

  getHotelDetails: async (hotelId: string): Promise<HotelDetail> => {
    const { data, error } = await supabase.functions.invoke(
      `hotel-details?hotelId=${encodeURIComponent(hotelId)}`
    );
    if (error) throw error;
    return data?.data ?? data;
  },

  /** Search page: invokes search-hotels edge function */
  searchHotelRates: async (
    params: SearchHotelRatesParams
  ): Promise<SearchHotelsResponse> => {
    const { data, error } = await supabase.functions.invoke("search-hotels", {
      body: params,
    });
    if (error) throw error;
    return data;
  },

  /**
   * Org repo: POST /hotel-rate style payload to `hotel-rate` edge function.
   * (ApiTestPage uses this shape.)
   */
  getHotelRates: async (params: HotelRatesParams) => {
    const { data, error } = await supabase.functions.invoke("hotel-rate", {
      body: params,
      method: "POST",
    });
    if (error) throw error;
    return data;
  },

  /**
   * Convenience wrapper for `useHotelDetails`: single hotel via `search-hotel-rates`.
   */
  getHotelRatesForHotelId: async (
    hotelId: string,
    checkin: string,
    checkout: string,
    adults: number,
    currency: string,
    guestNationality: string
  ): Promise<HotelRatesResponse> => {
    const { data, error } = await supabase.functions.invoke(
      "search-hotel-rates",
      {
        body: {
          hotelIds: [hotelId],
          checkin,
          checkout,
          occupancies: [{ adults }],
          currency,
          guestNationality,
          includeHotelData: true,
          maxRatesPerHotel: 10,
        },
      }
    );
    if (error) throw error;
    return data;
  },

  prebookRate: async (offerId: string): Promise<PrebookResponse> => {
    const { data, error } = await supabase.functions.invoke("prebook-rate", {
      body: { offerId, usePaymentSdk: false },
    });
    if (error) throw error;
    return data;
  },

  /** Org repo: rates-prebook edge function */
  getRatesPrebook: async (params: PrebookParams) => {
    const { data, error } = await supabase.functions.invoke("rates-prebook", {
      body: params,
      method: "POST",
    });
    if (error) throw error;
    return data;
  },

  bookRate: async (
    params: BookRequest & {
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
    }
  ): Promise<BookResponse> => {
    const { data, error } = await supabase.functions.invoke("book-rate", {
      body: params,
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
