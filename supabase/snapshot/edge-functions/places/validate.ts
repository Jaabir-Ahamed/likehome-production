export function validateSearchParams(params: {
  textQuery: string | null
}) {
  if (!params.textQuery || params.textQuery.trim().length < 2) {
    throw new Error('textQuery is required and must be at least 2 characters')
  }
}
