# `rates-rebook`

## LiteAPI Reference

- **Method:** POST
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/rates/rebook`

> No dedicated docs page exists. Verified via curl with sandbox key.

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `rates-rebook` |
| HTTP method accepted | POST |
| Auth required | Yes — Supabase JWT (financial action) |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prebookId` | `string` | Yes | Prebook session ID from `getAlternativePrebooks()` |
| `existingBookingId` | `string` | Yes | The original booking being replaced |

### Response Shape

```json
{
  "data": {
    "bookingId": "string",
    "status": "CONFIRMED",
    "checkin": "YYYY-MM-DD",
    "checkout": "YYYY-MM-DD",
    "price": 250.00,
    "currency": "USD"
  }
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing prebookId or existingBookingId |
| 401 | Missing or invalid Authorization header |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.getRatesRebook(params: RebookParams): Promise<RebookResponse>
```

### Example

```ts
// Step 1: get alternative prebook from existing booking
const alt = await api.getAlternativePrebooks("BK-12345", {
  occupancies: [{ adults: 2 }],
  checkin: "2025-08-01",
  checkout: "2025-08-05",
});
const prebookId = alt.data.prebookId;

// Step 2: rebook — cancels old booking, creates new one
const result = await api.getRatesRebook({
  prebookId,
  existingBookingId: "BK-12345",
});
console.log(result.data.bookingId); // new booking ID
```

### Curl (verified working)

```bash
curl --request POST \
  --url https://book.liteapi.travel/v3.0/rates/rebook \
  --header 'X-API-Key: <your-key>' \
  --header 'content-type: application/json' \
  --data '{ "prebookId": "ZQhMDQxTe", "existingBookingId": "DADa6LkoX" }'
```
