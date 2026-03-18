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

type HotelRatesParams = {
    hotelIds: string[];
    checkin: string;
    checkout: string;
    occupancies: { adults: number; children?: number[] }[];
    currency?: string;
    guestNationality?: string;
};

export type Place = {
    placeId: string;
    displayName: string;
    formattedAddress: string;
    types: string[];
};

export type NormalizedHotel = {
    hotelId: string | null;
    name: string | null;
    image: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    starRating: number;
    reviewRating: number;
    reviewCount: number;
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
            const { countryCode, cityName } = search as { countryCode: string; cityName: string };
            params.append('countryCode', encodeURIComponent(countryCode))
            params.append('cityName', encodeURIComponent(cityName))
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
    },

    findPlaces: async (textQuery: string): Promise<Place[]> => {
        const { data, error } = await supabase.functions.invoke(
            `find-places?textQuery=${encodeURIComponent(textQuery)}`
        );
        if (error) throw error;
        return data?.data ?? data ?? [];
    },

    searchHotelRates: async (params: HotelRateSearchParams) => {
        const {data, error} = await supabase.functions.invoke(
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
};