import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../../api/liteApi';
import { supabase } from '../../lib/supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RewardsContextType {
    /** Current reward points balance. null = not yet loaded. */
    points: number | null;

    /** True while any rewards operation is in-flight. */
    loading: boolean;

    /** Last error from any rewards operation, or null. */
    error: string | null;

    /**
     * Award points to the user. Call this after a confirmed booking.
     * @param amount - Positive integer points to add.
     * @returns The new points total, or null if the operation failed.
     *
     * @example
     *   const newTotal = await addPoints(150);
     */
    addPoints: (amount: number) => Promise<number | null>;

    /**
     * Redeem points (deduct from balance). Call this at checkout when
     * the user applies a reward discount.
     * @param amount - Positive integer points to deduct.
     * @returns The new points total, or null if insufficient balance or error.
     *
     * @example
     *   const newTotal = await redeemPoints(500);
     */
    redeemPoints: (amount: number) => Promise<number | null>;

    /**
     * Manually re-fetch points from the database.
     * Useful after navigating to a page that displays points.
     */
    refreshPoints: () => Promise<void>;

    /**
     * Converts a points balance into a dollar discount value.
     * Default rate: 100 points = $1.00
     *
     * @example
     *   pointsToDollars(500) // → 5.00
     */
    pointsToDollars: (points: number) => number;

    /**
     * Calculates how many points a booking price should earn.
     * Default rate: $1 spent = 10 points
     *
     * @example
     *   dollarsToPoints(150) // → 1500
     */
    dollarsToPoints: (dollars: number) => number;

    /**
     * Returns true if the user has enough points to cover the given amount.
     *
     * @example
     *   canAfford(500) // → true if points >= 500
     */
    canAfford: (amount: number) => boolean;

    /**
     * Max integer points that can be redeemed toward a bill without exceeding its total,
     * capped by the current balance (100 pts = $1 off by default).
     */
    maxRedeemableForAmount: (billAmount: number) => number;
}

// ─── Rewards Configuration ────────────────────────────────────────────────────
// Centralised here so teammates only need to change one place.

const REWARDS_CONFIG = {
    /** Points earned per dollar spent on a booking */
    POINTS_PER_DOLLAR: 10,

    /** Dollar value of each point when redeeming */
    DOLLARS_PER_POINT: 0.01, // 100 points = $1
} as const;

// ─── Context ──────────────────────────────────────────────────────────────────

export const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RewardsProvider({ children }: { children: ReactNode }) {
    const [points, setPoints] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load points whenever auth state changes (login, logout, page refresh)
    useEffect(() => {
        const fetchPoints = async () => {
            setLoading(true);
            setError(null);
            try {
                const profile = await api.getProfile();
                setPoints(profile ? profile.reward_points : null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load reward points.');
                setPoints(null);
            } finally {
                setLoading(false);
            }
        };

        // Run immediately on mount
        fetchPoints();

        // Re-run when the user logs in or out
        const { data: authListener } = supabase.auth.onAuthStateChange(() => {
            fetchPoints();
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const refreshPoints = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const profile = await api.getProfile();
            setPoints(profile ? profile.reward_points : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to refresh reward points.');
        } finally {
            setLoading(false);
        }
    }, []);

    const addPoints = useCallback(async (amount: number): Promise<number | null> => {
        setLoading(true);
        setError(null);
        try {
            const newTotal = await api.addRewardPoints(amount);
            setPoints(newTotal);
            return newTotal;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add reward points.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const redeemPoints = useCallback(async (amount: number): Promise<number | null> => {
        if (points !== null && points < amount) {
            setError(`Insufficient points. You have ${points} but tried to redeem ${amount}.`);
            return null;
        }
        setLoading(true);
        setError(null);
        try {
            const newTotal = await api.redeemRewardPoints(amount);
            setPoints(newTotal);
            return newTotal;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to redeem reward points.');
            return null;
        } finally {
            setLoading(false);
        }
    }, [points]);

    // ── Pure utility helpers (no async, no side effects) ──────────────────────

    const pointsToDollars = useCallback((pts: number): number => {
        return parseFloat((pts * REWARDS_CONFIG.DOLLARS_PER_POINT).toFixed(2));
    }, []);

    const dollarsToPoints = useCallback((dollars: number): number => {
        return Math.floor(dollars * REWARDS_CONFIG.POINTS_PER_DOLLAR);
    }, []);

    const canAfford = useCallback((amount: number): boolean => {
        return points !== null && points >= amount;
    }, [points]);

    const maxRedeemableForAmount = useCallback((billAmount: number): number => {
        if (points === null || billAmount <= 0) return 0;
        const capByBill = Math.floor(billAmount / REWARDS_CONFIG.DOLLARS_PER_POINT + 1e-9);
        return Math.min(points, capByBill);
    }, [points]);

    return (
        <RewardsContext.Provider value={{
            points,
            loading,
            error,
            addPoints,
            redeemPoints,
            refreshPoints,
            pointsToDollars,
            dollarsToPoints,
            canAfford,
            maxRedeemableForAmount,
        }}>
            {children}
        </RewardsContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRewards() {
    const context = useContext(RewardsContext);
    if (context === undefined) {
        throw new Error('useRewards must be used within a RewardsProvider.');
    }
    return context;
}
