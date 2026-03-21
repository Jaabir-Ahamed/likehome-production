# `<function-name>`

## LiteAPI Reference

- **Docs:** https://docs.liteapi.travel/reference/<liteapi-path>
- **Method:** GET | POST
- **LiteAPI URL:** `https://api.liteapi.travel/v3.0/<liteapi-path>`

---

## Edge Function

### Path | Method | Auth
| Field | Value |
|-------|-------|
| Supabase function name | `<function-name>` |
| HTTP method accepted | GET \| POST |
| Auth required | Supabase anon key (auto-sent by client) |

### Request Body / Query Params

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `param1` | `string` | Yes | ... |
| `param2` | `number` | No | ... |

### Response Shape

```json
{
  "data": { ... }
}
```

### Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Missing or invalid parameters |
| 500 | Upstream LiteAPI error |

---

## Frontend Usage

### Method Signature

```ts
api.<methodName>(params: <ParamsType>): Promise<<ReturnType>>
```

### Example

```ts
const data = await api.<methodName>({
  param1: "value",
});
console.log(data);
```
