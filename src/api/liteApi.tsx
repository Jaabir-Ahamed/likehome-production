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

  getHotels: async (countryCode: string, cityName: string) => {
    const { data, error } = await supabase.functions.invoke(
      `list-hotels?countryCode=${encodeURIComponent(countryCode)}&cityName=${encodeURIComponent(cityName)}`
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

  searchHotelRates: async (
    params: SearchHotelRatesParams
  ): Promise<SearchHotelsResponse> => {
    const { data, error } = await supabase.functions.invoke("search-hotels", {
      body: params,
    });
    if (error) throw error;
    return data;
  },

  getHotelRates: async (
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
};
