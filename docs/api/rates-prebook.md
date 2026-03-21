# `rates-prebook`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/post_rates-prebook
- **Method:** POST
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/rates/prebook`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `rates-prebook` |
| HTTP method accepted | POST |
| Auth required | Supabase anon key (auto-sent by client) |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `offerId` | `string` | Yes | Unique identifier of the selected offer from search results |
| `usePaymentSdk` | `boolean` | Yes | Whether payment SDK fields are returned in the response |
| `voucherCode` | `string` | No | Optional discount/voucher code |
| `addons` | `array` | No | Additional services (uber, esimply, etc.) |
| `bedTypeIds` | `string[]` | No | Preferred bed type configurations |
| `includeCreditBalance` | `boolean` | No | Include credit line info in response |

### Response Shape

```json
{
  "data": {
    "prebookId": "string",
    "offerId": "string",
    "hotelId": "string",
    "checkin": "YYYY-MM-DD",
    "checkout": "YYYY-MM-DD",
    "currency": "string",
    "price": 0,
    "commission": 0,
    "roomTypes": [],
    "cancellationChanged": false,
    "boardChanged": false,
    "priceDifferencePercent": 0
  }
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing `offerId` or `usePaymentSdk` |
| 4002 | Invalid offerId or missing required fields (LiteAPI) |
| 4016 | Prebook timeout exceeded (LiteAPI) |
| 401 | Unauthorized — invalid API key |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.getRatesPrebook(params: PrebookParams): Promise<unknown>
```

### Example

```ts
const data = await api.getRatesPrebook({
  offerId: "offer_abc123",
  usePaymentSdk: false,
  voucherCode: "SAVE10",
});
// data.data.prebookId is used in the next booking step
console.log(data.data.prebookId);
```
