const BASE_URL = Deno.env.get('LITEAPI_BASE_URL')
const API_KEY = Deno.env.get('LITEAPI_KEY')

if (!BASE_URL) throw new Error('LITEAPI_BASE_URL is not set')
if (!API_KEY) throw new Error('LITEAPI_KEY is not set')

export async function searchPlaces(params: {
  textQuery: string | null
  type?: string | null
  language?: string | null
  clientIP?: string | null
}) {
  const query = new URLSearchParams({
    textQuery: params.textQuery!,
  })

  if (params.type) query.append('type', params.type)
  if (params.language) query.append('language', params.language)
  if (params.clientIP) query.append('clientIP', params.clientIP)

  const response = await fetch(
    `${BASE_URL}/data/places?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        accept: 'application/json',
      },
    }
  )

  const text = await response.text()

  if (!response.ok) {
    throw new Error(`LiteAPI Error ${response.status}: ${text}`)
  }

  return JSON.parse(text)
}
