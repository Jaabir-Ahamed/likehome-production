import {createContext, useContext, useEffect, useState} from "react";
import {supabase} from "../../lib/supabaseClient";
import type {User} from "@supabase/supabase-js";

type AuthContextType = {
    user: User | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({data}) => {
            if (!mounted) return;
            setUser(data.session?.user ?? null);
            setLoading(false);
        });

        const {data: listener} = supabase.auth.onAuthStateChange(
            (_event, session) => {
                const nextUser = session?.user ?? null;

                setUser((prev) => {
                    if (prev?.id === nextUser?.id) return prev;
                    return nextUser;
                });

                setLoading(false);
            }
        );

        return () => {
            mounted = false;
            listener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{user, loading}}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);