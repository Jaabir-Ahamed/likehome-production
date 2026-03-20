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

type PrebookParams = {
    offerId: string;
    usePaymentSdk: boolean;
    voucherCode?: string;
    addons?: {
        addon: string;
        value?: number;
        currency?: string;
        addonDetails?: { packageId?: string; destinationCode?: string; startDate?: string; endDate?: string };
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
    },

    getHotelRates: async (params: HotelRatesParams) => {
        const {data, error} = await supabase.functions.invoke("hotels-rates", {
            body: params,
            method: "POST",
        })
        if (error) throw error
        return data
    },

    getRatesPrebook: async (params: PrebookParams) => {
        const {data, error} = await supabase.functions.invoke("rates-prebook", {
            body: params,
            method: "POST",
        });
        if (error) throw error;
        return data;
    },

    getRatesBook: async (params: BookParams) => {
        const {data, error} = await supabase.functions.invoke("rates-book", {
            body: params,
            method: "POST",
        });
        if (error) throw error;
        return data;
    },
};