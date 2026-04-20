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
    remarks?: string;
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
    checkin?: string;
    checkout?: string;
    holder: BookHolder;
    guests: BookGuest[];
    payment: BookPayment;
    clientReference?: string;
    existingBookingId?: string;
    metadata?: Record<string, unknown>;
    guestPayment?: Record<string, unknown>;
};

type AmendBookingParams = {
    firstName: string;
    lastName: string;
    email: string;
    remarks?: string;
};

type AlternativePrebooksOccupancy = {
    adults: number;
    children?: number[];
};

type AlternativePrebooksParams = {
    occupancies: AlternativePrebooksOccupancy[];
    checkin?: string;
    checkout?: string;
    refundableRatesOnly?: boolean;
    boardType?: string;
};

type RebookParams = {
    prebookId: string;
    existingBookingId: string;
};

type Profile = {
    id: string;
    email: string;
    full_name: string;
    reward_points: number;
    role: string;
    created_at: string;
    phone: string | null;
    location: string | null;
    date_of_birth: string | null;
    bio: string | null;
    avatar_url: string | null;
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
            .order('created_at', {ascending: false});
        if (error) throw error;
        return {data: data ?? []};
    },

    cancelBooking: async (bookingId: string) => {
        const {data, error} = await supabase.functions.invoke("cancel-booking", {
            body: {bookingId},
            method: "POST",
        });
        if (error) throw error;
        return data;
    },

    amendBooking: async (bookingId: string, params: AmendBookingParams) => {
        const {data, error} = await supabase.functions.invoke("bookings-amend", {
            body: {bookingId, ...params},
            method: "POST",
        });
        if (error) throw error;
        return data;
    },

    getAlternativePrebooks: async (bookingId: string, params: AlternativePrebooksParams) => {
        const {data, error} = await supabase.functions.invoke("booking-alternative-prebooks", {
            body: {bookingId, ...params},
            method: "POST",
        });
        if (error) throw error;
        return data;
    },

    getRatesRebook: async (params: RebookParams) => {
        const {data, error} = await supabase.functions.invoke("rates-rebook", {
            body: params,
            method: "POST",
        });
        if (error) throw error;
        return data;
    },
    // returns null if no session, throws error if supabase query fails, returns Profile if successful
    getProfile: async (): Promise<Profile | null> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
    
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            console.log('getProfile raw data:', data);
            if (error) throw error;
            return data as Profile;
    },
    // throws error if number is non-positive, if no session, or if supabase query fails. returns new total if successful
    addRewardPoints: async (points: number): Promise<number> => {
        if (points <= 0) throw new Error("Points to add must be a positive number.");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User must be logged in to earn reward points.");

        // This calls a Postgres function (already created) for a safe atomic increment.
        //function is --> increment_rewards_points(user_id uuid, amount integer)
        const { data, error } = await supabase.rpc("increment_reward_points", {
            user_id: user.id,
            amount: points,
        });

        if (error) throw error;
        return data as number; // returns new total
    },
    // throws error if number is non-positive, if no session, or if supabase query fails. returns new total if successful
    redeemRewardPoints: async (points: number): Promise<number> => {
        if (points <= 0) throw new Error("Points to redeem must be a positive number.");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User must be logged in to redeem reward points.");

        // This calls a Postgres function (already created) for a safe atomic decrement.
        //function is --> decrement_rewards_points(user_id uuid, amount integer)
        const { data, error } = await supabase.rpc("decrement_reward_points", {
            user_id: user.id,
            amount: points,
        });

        if (error) throw error; // note: DB function throws if insufficient points
        return data as number; // returns new total
    },
    // admin function. 
    setRewardPoints: async (points: number): Promise<number> => {
        if (points < 0) throw new Error("Reward points cannot be negative.");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User must be logged in.");

        const { data, error } = await supabase
            .from("profiles")
            .update({ reward_points: points })
            .eq("id", user.id)
            .select("reward_points")
            .single();

        if (error) throw error;
        return (data as { reward_points: number }).reward_points;
    },
};