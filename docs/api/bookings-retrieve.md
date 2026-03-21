# `bookings-retrieve`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/get_bookings-bookingid
- **Method:** GET
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/bookings/{bookingId}`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `bookings-retrieve` |
| HTTP method accepted | POST |
| Auth required | Supabase anon key (auto-sent by client) |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingId` | `string` | Yes | The booking ID returned from `rates-book` |

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
  }
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing required field: bookingId |
| 404 | Booking not found (LiteAPI) |
| 401 | Unauthorized — invalid API key |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.getBooking(bookingId: string): Promise<unknown>
```

### Example

```ts
const data = await api.getBooking("booking_abc123");
console.log(data.data.status, data.data.hotelConfirmationCode);
```
