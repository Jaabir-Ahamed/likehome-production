import {supabase} from "../lib/supabaseClient";

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
};