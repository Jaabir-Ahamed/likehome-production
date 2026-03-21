# `hotels-rates`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/hotels-rates
- **Method:** POST
- **LiteAPI URL:** `https://api.liteapi.travel/v3.0/hotels/rates`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `hotels-rates` |
| HTTP method accepted | POST |
| Auth required | Supabase anon key (auto-sent by client) |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hotelIds` | `string[]` | Yes | Array of LiteAPI hotel IDs |
| `checkin` | `string` | Yes | Check-in date (YYYY-MM-DD) |
| `checkout` | `string` | Yes | Check-out date (YYYY-MM-DD) |
| `occupancies` | `Occupancy[]` | Yes | Array of occupancy objects |
| `occupancies[].adults` | `number` | Yes | Number of adults per room |
| `occupancies[].children` | `number[]` | No | Ages of children per room |
| `currency` | `string` | No | ISO 4217 currency code (default: `"USD"`) |
| `guestNationality` | `string` | No | ISO 3166-1 alpha-2 country code (default: `"US"`) |
| `timeout` | `number` | No | Upstream timeout in seconds (default: `10`) |

### Response Shape

```json
{
  "data": [
    {
      "hotelId": "string",
      "currency": "USD",
      "roomTypes": [
        {
          "offerId": "string",
          "name": "string",
          "rates": [{ "rateId": "string", "price": 0, ... }]
        }
      ]
    }
  ]
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing required fields (`hotelIds`, `checkin`, `checkout`, `occupancies`) |
| 405 | Wrong HTTP method (must be POST) |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.getHotelRates(params: HotelRatesParams): Promise<any>
```

```ts
type HotelRatesParams = {
  hotelIds: string[];
  checkin: string;       // YYYY-MM-DD
  checkout: string;      // YYYY-MM-DD
  occupancies: { adults: number; children?: number[] }[];
  currency?: string;
  guestNationality?: string;
};
```

### Example

```ts
const rates = await api.getHotelRates({
  hotelIds: ["lp24373", "lp1890"],
  checkin: "2026-04-01",
  checkout: "2026-04-05",
  occupancies: [{ adults: 2 }],
  currency: "USD",
  guestNationality: "US",
});
console.log(rates.data);
```
