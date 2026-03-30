# `cancel-booking`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/put_bookings-bookingid
- **Method:** PUT
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/bookings/{bookingId}`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `cancel-booking` |
| HTTP method accepted | POST (wraps LiteAPI PUT) |
| Auth required | Supabase anon key (auto-sent by client) |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingId` | `string` | Yes | Unique identifier of the booking to cancel |

### Response Shape

```json
{
  "data": {
    "bookingId": "string",
    "status": "CANCELLED | CANCELLED_WITH_CHARGES",
    "checkin": "YYYY-MM-DD",
    "checkout": "YYYY-MM-DD",
    "hotel": { "hotelId": "string", "name": "string" },
    "bookedRooms": [
      {
        "roomType": { "roomTypeId": "string", "name": "string" },
        "boardType": "string",
        "boardName": "string",
        "adults": 2,
        "children": 0
      }
    ],
    "cancellationPolicies": {
      "cancelPolicyInfos": [
        {
          "cancelTime": "ISO datetime",
          "amount": 0,
          "currency": "USD",
          "type": "string",
          "timezone": "string"
        }
      ],
      "refundableTag": "RFN | NRFN"
    },
    "price": 0,
    "currency": "USD"
  }
}
```

### Status Values

| Value | Meaning |
|-------|---------|
| `CANCELLED` | Full refund; no charges applied |
| `CANCELLED_WITH_CHARGES` | Non-refundable or past deadline; charges retained |

### `refundableTag` Values

| Value | Meaning |
|-------|---------|
| `RFN` | Refundable |
| `NRFN` | Non-refundable |

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing or invalid `bookingId` |
| 401 | Invalid API key |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.cancelBooking(bookingId: string): Promise<CancelBookingResponse>
```

### Example

```ts
const data = await api.cancelBooking("BK-12345");
console.log(data.data.status); // "CANCELLED" or "CANCELLED_WITH_CHARGES"
```
