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

    getPlaces: async (query: string) => {
        const {data, error} = await supabase.functions.invoke(
            `places?textQuery=${encodeURIComponent(query)}`
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

        const {data, error} = await supabase.functions.invoke(`list-hotels?${params.toString()}`)
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
        const {data, error} = await supabase.functions.invoke("hotel-rate", {
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
        const {data: {user}} = await supabase.auth.getUser();
        // Generate a unique reference per booking: {userId}-{timestamp36}-{random5}
        // Embeds the user ID so GET /bookings?clientReference=... stays queryable by prefix.
        const clientReference = params.clientReference
            ?? `${user?.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

        const {data, error} = await supabase.functions.invoke("rates-book", {
            body: {...params, clientReference},
            method: "POST",
        });
        if (error) throw error;
        return data;
    },

    getBooking: async (bookingId: string) => {
        const {data, error} = await supabase.functions.invoke("bookings-retrieve", {
            body: {bookingId},
            method: "POST",
        });
        if (error) throw error;
        return data;
    },

    getListBookings: async () => {
        const {data, error} = await supabase
            .from("bookings")
            .select("booking_id")
        // .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;
        return {
            "data":
                {
                    data
                }

        };
    },
};