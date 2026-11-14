export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
export type ApiResponse<TData> = { data: TData }
export type PaginatedResponse<TData> = ApiResponse<TData[]> & {
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export type ApiRequestOptions = Omit<RequestInit, 'body' | 'credentials' | 'method'> & {
  method?: ApiMethod
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
}

type BackendErrorPayload = {
  error?: {
    code?: string
    message?: string
  }
  message?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown
  readonly code?: string

  constructor(status: number, message: string, payload: unknown, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    this.code = code
  }
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL
export const apiBaseUrl = (configuredBaseUrl?.trim() || (import.meta.env.DEV ? 'http://localhost:3000/api' : '')).replace(/\/+$/, '')

function buildUrl(path: string, query?: ApiRequestOptions['query']) {
  const normalizedPath = path.replace(/^\/+/, '')
  const url = apiBaseUrl ? `${apiBaseUrl}/${normalizedPath}` : `/${normalizedPath}`
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) params.set(key, String(value))
  }

  const queryString = params.toString()
  return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url
}

function isRawBody(value: unknown): value is BodyInit {
  return typeof value === 'string'
    || (typeof Blob !== 'undefined' && value instanceof Blob)
    || (typeof FormData !== 'undefined' && value instanceof FormData)
    || (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams)
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value)
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) return undefined as T

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('application/pdf')) return await response.blob() as T

  const text = await response.text()
  if (!text) return undefined as T

  if (contentType.includes('json') || /^[\s]*[\[{]/.test(text)) {
    try {
      return JSON.parse(text) as T
    } catch {
      return text as T
    }
  }

  return text as T
}

function errorMessage(payload: unknown, status: number) {
  const candidate = payload as BackendErrorPayload | null
  return candidate?.error?.message
    ?? candidate?.message
    ?? `Request failed with status ${status}`
}

export async function request<TResponse>(path: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const { body, headers: suppliedHeaders, query, method = 'GET', ...requestOptions } = options
  const headers = new Headers(suppliedHeaders)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')

  let requestBody: BodyInit | undefined
  if (body !== undefined) {
    if (isRawBody(body)) {
      requestBody = body
    } else {
      requestBody = JSON.stringify(body)
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }
    }
  }

  const response = await fetch(buildUrl(path, query), {
    ...requestOptions,
    method,
    credentials: 'include',
    headers,
    ...(requestBody !== undefined ? { body: requestBody } : {}),
  })
  const payload = await parseResponse<unknown>(response)

  if (!response.ok) {
    const backendPayload = payload as BackendErrorPayload | null
    throw new ApiError(response.status, errorMessage(payload, response.status), payload, backendPayload?.error?.code)
  }

  return payload as TResponse
}

export const apiClient = {
  request,
  get: <TResponse>(path: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) => request<TResponse>(path, { ...options, method: 'GET' }),
  post: <TResponse>(path: string, body?: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) => request<TResponse>(path, { ...options, method: 'POST', body }),
  patch: <TResponse>(path: string, body: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) => request<TResponse>(path, { ...options, method: 'PATCH', body }),
  put: <TResponse>(path: string, body?: unknown, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) => request<TResponse>(path, { ...options, method: 'PUT', body }),
  delete: <TResponse>(path: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) => request<TResponse>(path, { ...options, method: 'DELETE' }),
}
