# `listbookings`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/listbookings
- **Method:** GET
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/bookings`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `listbookings` |
| HTTP method accepted | GET |
| Auth required | Supabase anon key (auto-sent by client) |

### Query Params

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientReference` | `string` | No* | Internal reference code (e.g. user ID) used when booking |
| `guestId` | `string` | No* | Unique identifier for a specific guest |
| `timeout` | `number` | No | Request timeout in seconds (default: 4) |

\* At least one of `clientReference` or `guestId` must be provided.

### Response Shape

```json
{
  "data": [
    {
      "bookingId": "BK123",
      "clientReference": "user-uuid",
      "supplierBookingId": "SUP456",
      "supplierBookingName": "Booking Name",
      "supplier": "SupplierName",
      "supplierId": 1,
      "feed": null,
      "status": "CONFIRMED",
      "hotelConfirmationCode": "CONF789",
      "checkin": "2026-04-01",
      "checkout": "2026-04-05",
      "hotel": { "hotelId": "lp123", "name": "Hotel Name" },
      "rooms": [
        {
          "roomType": "Deluxe Room",
          "boardType": "BB",
          "boardName": "Bed & Breakfast",
          "adults": 2,
          "children": [],
          "rate": { ... },
          "remarks": "",
          "guests": [{ "firstName": "John", "lastName": "Doe" }]
        }
      ]
    }
  ]
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing both `clientReference` and `guestId` |
| 401 | Invalid or missing API key |
| 500 | Upstream LiteAPI error or misconfigured secret |

---

## Frontend Usage

### Method Signature

```ts
api.getListBookings(params: ListBookingsParams): Promise<{ data: Booking[] }>
```

### Example

```ts
const result = await api.getListBookings({ clientReference: user.id });
console.log(result.data); // array of booking objects
```
