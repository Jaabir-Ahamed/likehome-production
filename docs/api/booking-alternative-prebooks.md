# `booking-alternative-prebooks`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/post_bookings-bookingid-alternative-prebooks
- **Method:** POST
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/bookings/{bookingId}/alternative-prebooks`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `booking-alternative-prebooks` |
| HTTP method accepted | POST |
| Auth required | Yes — Supabase JWT (booking is user-scoped) |

### Request Body / Query Params

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingId` | `string` | Yes | The confirmed booking to amend |
| `occupancies` | `array` | Yes | New room occupancy details `[{ adults, children? }]` |
| `checkin` | `string` | Yes | New check-in date (YYYY-MM-DD) |
| `checkout` | `string` | Yes | New check-out date (YYYY-MM-DD) |
| `refundableRatesOnly` | `boolean` | No | If true, only return refundable alternative rates |

### Response Shape

```json
{
  "data": {
    "prebookId": "string",
    "hotelId": "string",
    "checkin": "YYYY-MM-DD",
    "checkout": "YYYY-MM-DD",
    "currency": "USD",
    "price": 250.00,
    "priceDifferencePercent": 5,
    "cancellationChanged": false,
    "boardChanged": false,
    "roomTypes": [
      {
        "rateId": "string",
        "name": "string",
        "maxOccupancy": 2,
        "adultCount": 2,
        "childCount": 0,
        "boardType": "RO",
        "boardName": "Room only",
        "retailRate": { "total": { "amount": 250.00, "currency": "USD" } },
        "cancellationPolicies": { "cancelPolicyInfos": [] },
        "taxesAndFees": {}
      }
    ]
  }
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing or invalid parameters (bookingId, occupancies) |
| 401 | Missing or invalid Authorization header |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.getAlternativePrebooks(bookingId: string, params: AlternativePrebooksParams): Promise<AlternativePrebooksResponse>
```

### Example

```ts
const data = await api.getAlternativePrebooks("BK-12345", {
  occupancies: [{ adults: 2 }],
  checkin: "2025-06-01",
  checkout: "2025-06-05",
  refundableRatesOnly: true,
});
// data.data.prebookId → use with the book endpoint to complete the amendment
console.log(data.data.priceDifferencePercent);
```
