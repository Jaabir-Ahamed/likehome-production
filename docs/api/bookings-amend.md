# `bookings-amend`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/put_bookings-bookingid-amend
- **Method:** PUT
- **LiteAPI URL:** `https://book.liteapi.travel/v3.0/bookings/{bookingId}/amend`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `bookings-amend` |
| HTTP method accepted | POST (wraps LiteAPI PUT) |
| Auth required | Supabase JWT (user must be logged in) |

### Request Body

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bookingId` | `string` | Yes | Unique identifier of the booking to amend |
| `firstName` | `string` | Yes | Updated first name of the booking holder |
| `lastName` | `string` | Yes | Updated last name of the booking holder |
| `email` | `string` | Yes | Updated email address of the booking holder |
| `remarks` | `string` | No | Optional remarks for the amendment (e.g. special requests) |

All three of `firstName`, `lastName`, and `email` must be provided together — LiteAPI requires the complete `holder` object. To fix only one field (e.g. email), supply the correct values for all three.

### How the edge function builds the LiteAPI body

The edge function converts the flat frontend fields into the nested shape LiteAPI expects:

```json
{
  "holder": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.org"
  },
  "remarks": "A quiet room please"
}
```

### Response Shape

LiteAPI returns an **amendment request** object (status starts as `PENDING`, not the final booking):

```json
{
  "id": 566,
  "bookingId": "D_hitGeNh",
  "userId": 927,
  "type": "UPDATE",
  "subType": "UPDATE_NAME_CHANGE",
  "status": "PENDING",
  "prebookId": "",
  "holderEmail": "john@example.org",
  "holderFirstName": "John",
  "holderLastName": "Doe",
  "holderPhone": null,
  "remarks": "A quiet room please",
  "guests": [],
  "createdBy": 2051,
  "createdAt": "2025-06-18T16:36:14.033Z",
  "updatedAt": "2025-06-18T16:36:14.033Z"
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | `bookingId` missing, or not all of `firstName`/`lastName`/`email` provided |
| 401 | Missing or invalid JWT |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.amendBooking(bookingId: string, params: AmendBookingParams): Promise<AmendResponse>

type AmendBookingParams = {
  firstName: string;   // required — full holder object sent to LiteAPI
  lastName: string;    // required
  email: string;       // required
  remarks?: string;
};
```

### Use Cases

| Scenario | What to do |
|----------|-----------|
| Fix a name typo | Send correct `firstName`/`lastName` with existing `email` |
| Update email | Send new `email` with existing `firstName`/`lastName` |
| Add remarks | Send existing name+email plus `remarks` |

### Example

```ts
const data = await api.amendBooking("D_hitGeNh", {
  firstName: "John",
  lastName: "Doe",
  email: "john.updated@example.org",
  remarks: "Ground floor room please",
});
// data.status === "PENDING" — amendment request created
console.log(data.holderEmail); // "john.updated@example.org"
```
