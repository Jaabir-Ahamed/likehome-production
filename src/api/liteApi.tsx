import { supabase } from "../lib/supabaseClient";

export interface SearchHotelRatesParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  currency?: string;
  guestNationality?: string;
}

export interface SearchHotelRatesResponse {
  data?: Array<{
    hotelId?: string;
    hotel?: {
      name?: string;
      main_photo?: string;
      address?: string;
      city?: string;
      country?: string;
      rating?: number;
      reviewCount?: number;
      stars?: number;
    };
    roomTypes?: Array<{
      name?: string;
      offerId?: string;
      rates?: Array<{
        retailRate?: { total?: Array<{ amount?: number; currency?: string }> };
        commission?: Array<{ amount?: number; currency?: string }>;
      }>;
    }>;
  }>;
  error?: string;
}

export const api = {
    getCountries: async () => {
        const {data, error} = await supabase.functions.invoke("countries");
        if (error) throw error;
        return data;
    },

    getCities: async (countryCode: string) => {
        const {data, error} = await supabase.functions.invoke(
            `cities?countryCode=${encodeURIComponent(countryCode)}`
        );
        if (error) throw error;
        return data;
    },

    getHotels: async (countryCode: string, cityName: string) => {
        const {data, error} = await supabase.functions.invoke(
            `list-hotels?countryCode=${encodeURIComponent(countryCode)}&cityName=${encodeURIComponent(cityName)}`
        );
        if (error) throw error;
        return data;
    },

    getFacilities: async () => {
        const {data, error} = await supabase.functions.invoke("list-facilities");
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

    searchHotelRates: async (params: SearchHotelRatesParams): Promise<SearchHotelRatesResponse> => {
        const { data, error } = await supabase.functions.invoke("search-hotels", {
            body: {
                location: params.location,
                checkIn: params.checkIn,
                checkOut: params.checkOut,
                guests: params.guests ?? 2,
                currency: params.currency ?? "USD",
                guestNationality: params.guestNationality ?? "US",
            },
        });
        if (error) throw error;
        return data ?? { data: [] };
    },
};