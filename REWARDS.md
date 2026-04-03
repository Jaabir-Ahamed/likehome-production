# Rewards System — Developer Guide

---

## 1. Supabase Setup (already done, but here just in case they're gone)

Before the context works, you need two Postgres functions in Supabase.
Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Atomically adds points. Returns the new total.
CREATE OR REPLACE FUNCTION increment_reward_points(user_id UUID, amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total INT;
BEGIN
  UPDATE profiles
    SET reward_points = reward_points + amount
    WHERE id = user_id
    RETURNING reward_points INTO new_total;
  RETURN new_total;
END;
$$;

-- Atomically deducts points. Raises an error if balance is insufficient.
CREATE OR REPLACE FUNCTION decrement_reward_points(user_id UUID, amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total INT;
BEGIN
  UPDATE profiles
    SET reward_points = reward_points - amount
    WHERE id = user_id AND reward_points >= amount
    RETURNING reward_points INTO new_total;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient reward points.';
  END IF;

  RETURN new_total;
END;
$$;
```

> Using `SECURITY DEFINER` + `RETURNING` ensures the update and read are
> atomic — no race conditions if two requests come in at the same time.

---

## 2. Register the Provider

Wrap `RewardsProvider` in your root layout so every page has access.
Open `src/app/layouts/RootLayout.tsx` and add it alongside `CurrencyProvider`:

```tsx
import { CurrencyProvider } from '../contexts/CurrencyContext';
import { RewardsProvider } from '../contexts/RewardsContext';

export function RootLayout() {
  return (
    <CurrencyProvider>
      <RewardsProvider>
        <Outlet />  {/* or whatever your layout renders */}
      </RewardsProvider>
    </CurrencyProvider>
  );
}
```

---

## 3. Using `useRewards()` in a Page

```tsx
import { useRewards } from '../contexts/RewardsContext';

export function ProfilePage() {
  const { points, loading, error } = useRewards();

  if (loading) return <p>Loading points...</p>;
  if (error)   return <p>Error: {error}</p>;

  return <p>You have {points ?? 0} reward points.</p>;
}
```

---

## 4. Full API Reference

All values come from `useRewards()`:

| Name | Type | Description |
|---|---|---|
| `points` | `number \| null` | Current balance. `null` = not loaded yet |
| `loading` | `boolean` | True during any async operation |
| `error` | `string \| null` | Last error message, or null |
| `addPoints(n)` | `async (n: number) => number \| null` | Award points after a booking |
| `redeemPoints(n)` | `async (n: number) => number \| null` | Deduct points at checkout |
| `refreshPoints()` | `async () => void` | Re-fetch balance from DB |
| `pointsToDollars(n)` | `(n: number) => number` | 100 pts → $1.00 |
| `dollarsToPoints(n)` | `(n: number) => number` | $1 spent → 10 pts |
| `canAfford(n)` | `(n: number) => boolean` | true if balance >= n |

---

## 5. Reward Rates

Both rates live in `REWARDS_CONFIG` at the top of `RewardsContext.tsx`.
Change them there and the whole app updates automatically.

| Action | Rate |
|---|---|
| Earning (booking) | 10 points per $1 spent |
| Redeeming | 100 points = $1 discount |

---

## 6. Common Patterns

### Award points after a confirmed booking

```tsx
import { useRewards } from '../contexts/RewardsContext';

const { addPoints, dollarsToPoints } = useRewards();

// Inside your booking confirmation handler:
const handleBookingConfirmed = async (bookingTotal: number) => {
  const pointsEarned = dollarsToPoints(bookingTotal); // e.g. $150 → 1500 pts
  const newTotal = await addPoints(pointsEarned);
  console.log(`Booking confirmed! Earned ${pointsEarned} pts. New total: ${newTotal}`);
};
```

### Apply a points discount at checkout

```tsx
const { points, redeemPoints, pointsToDollars, canAfford } = useRewards();

const MAX_REDEEMABLE = 1000; // cap redemption at 1000 pts per booking

const handleApplyRewards = async () => {
  if (!canAfford(MAX_REDEEMABLE)) {
    alert(`You need at least ${MAX_REDEEMABLE} points to apply this discount.`);
    return;
  }
  const discount = pointsToDollars(MAX_REDEEMABLE); // → $10.00
  const newTotal = await redeemPoints(MAX_REDEEMABLE);
  if (newTotal !== null) {
    applyDiscountToOrder(discount);
  }
};
```

### Display a points badge in the navbar

```tsx
const { points, loading } = useRewards();

return (
  <span className="text-sm font-medium">
    {loading ? '...' : `${points ?? 0} pts`}
  </span>
);
```

### Show a dollar equivalent

```tsx
const { points, pointsToDollars } = useRewards();

const dollarValue = pointsToDollars(points ?? 0);
return <p>Your points are worth ${dollarValue.toFixed(2)}</p>;
```

---

## 7. Lower-Level API (without the context)

If you need rewards logic outside a React component (e.g., in a utility
function or a non-component file), you can call `api` directly:

```ts
import { api } from '../../api/liteApi';

const profile = await api.getProfile();         // full profile row
await api.addRewardPoints(500);                 // returns new total
await api.redeemRewardPoints(200);              // throws if insufficient
await api.setRewardPoints(0);                   // hard-set (admin/testing)
```

---

## 8. Error Handling Notes

- `redeemPoints()` in the context checks balance **before** hitting the DB, so you get a fast local error.
- The DB function `decrement_reward_points` is a second safety net — it will throw if two redemptions race.
- All context methods set `error` on failure and return `null` — you don't need try/catch at the call site unless you want custom handling.
