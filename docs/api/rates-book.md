# `rates-book`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/post_rates-book
- **Method:** POST
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/rates/book`
- **See also:** https://docs.liteapi.travel/reference/post_rates-prebook (must prebook first)

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `rates-book` |
| HTTP method accepted | POST |
| Auth required | Supabase anon key (auto-sent by client) |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prebookId` | `string` | Yes | ID returned from the prebook step |
| `holder` | `object` | Yes | Payment-responsible party: `firstName`, `lastName`, `email`, `phone` |
| `guests` | `array` | Yes | Each guest: `occupancyNumber`, `firstName`, `lastName`, `email` |
| `payment` | `object` | Yes | `method`: `"ACC_CREDIT_CARD"`, `"WALLET"`, `"CREDIT"`, or `"TRANSACTION_ID"` (+ `transactionId`) |
| `clientReference` | `string` | No | Client-defined reference ID for tracking |
| `metadata` | `object` | No | Fraud detection data (ip, country, platform, device_id, etc.) |
| `guestPayment` | `object` | No | Merchant-of-record payment details |

### Response Shape

```json
{
  "data": {
    "bookingId": "string",
    "status": "CONFIRMED",
    "hotelConfirmationCode": "string",
    "checkin": "YYYY-MM-DD",
    "checkout": "YYYY-MM-DD",
    "hotel": { "hotelId": "string", "name": "string" },
    "bookedRooms": [],
    "holder": {},
    "cancellationPolicies": {}
  },
  "guestLevel": 0,
  "sandbox": true
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing required fields |
| 4002 | Invalid prebookId or validation failure (LiteAPI) |
| 4010 | Rate data validation failed (LiteAPI) |
| 4000 | Missing or unsupported payment method (LiteAPI) |
| 2013 | Booking failed — provider response unsuccessful (LiteAPI) |
| 401 | Unauthorized — invalid API key |
| 500 | Upstream LiteAPI error |

---

## Side Effects

When called from the frontend via `api.getRatesBook()`:

1. **`clientReference` auto-populated** — if the caller does not pass `clientReference`, the authenticated user's Supabase `user.id` is used. This tags the booking on the LiteAPI side for future retrieval.
2. **Booking persisted locally** — on a successful response, `data.data.bookingId` is inserted into the `public.bookings` table (`booking_id` column). The `user_id` column is auto-populated by the table's `auth.uid()` default. This insert is best-effort; errors are not surfaced to the caller.

---

## Frontend Usage

### Method Signature

```ts
api.getRatesBook(params: BookParams): Promise<unknown>
```

### Example

```ts
const data = await api.getRatesBook({
  prebookId: "prebook_xyz789",
  holder: { firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "+14155552671" },
  guests: [{ occupancyNumber: 1, firstName: "Jane", lastName: "Doe", email: "jane@example.com" }],
  payment: { method: "CREDIT" },
});
console.log(data.data.bookingId, data.data.status);
```
