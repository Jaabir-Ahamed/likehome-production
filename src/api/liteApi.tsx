import {supabase} from "../lib/supabaseClient";


type HotelSearchOptions = {
    limit?: number;
    offset?: number;
    language?: string;
    starRating?: string;
    minRating?: number;
}

type HotelSearchParams =
    | { placeId: string; countryCode?: never; cityName?: never }
    | { countryCode: string; cityName: string; placeId?: never }

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

    getHotels: async (search: HotelSearchParams, options?: HotelSearchOptions) => {
        const params = new URLSearchParams()

        if (search.placeId) {
            params.append('placeId', search.placeId)
        } else {
            params.append('countryCode', encodeURIComponent(search.countryCode))
            params.append('cityName', encodeURIComponent(search.cityName))
        }

        if (options?.limit) params.append('limit', String(options.limit))
        if (options?.offset) params.append('offset', String(options.offset))
        if (options?.language) params.append('language', options.language)
        if (options?.starRating) params.append('starRating', options.starRating)
        if (options?.minRating) params.append('minRating', String(options.minRating))

        const fn = search.placeId ? 'list-hotels-by-placeid' : 'list-hotels'

        const {data, error} = await supabase.functions.invoke(`${fn}?${params.toString()}`)
        if (error) throw error
        return data
    },

    getFacilities: async () => {
        const {data, error} = await supabase.functions.invoke("list-facilities");
        if (error) throw error;
        return data;
    },

    getHotelDetails: async (hotelId: string) => {
        const {data, error} = await supabase.functions.invoke(
            `hotel-details?hotelId=${encodeURIComponent(hotelId)}`
        )
        if (error) throw error
        return data
    }
};