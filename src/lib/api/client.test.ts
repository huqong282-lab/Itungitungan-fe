import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiClient, request } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('central API client', () => {
  it('reads the configured base URL from Vite environment and trims trailing slashes', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.test/api///')
    vi.resetModules()

    const { apiBaseUrl: configuredUrl } = await import('./client')

    expect(configuredUrl).toBe('https://api.example.test/api')
  })

  it('uses the development API default when the environment value is empty', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.resetModules()

    return import('./client').then(({ apiBaseUrl: defaultUrl }) => {
      expect(defaultUrl).toBe(import.meta.env.DEV ? 'http://localhost:3000/api' : '')
    })
  })

  it('sends credentials, JSON headers, a JSON body, and caller headers', async () => {
    const fetchMock = mockFetch(new Response('{"data":{"id":"1"}}', { status: 201, headers: { 'Content-Type': 'application/json' } }))

    await apiClient.post('projects', { projectName: 'Example' }, { headers: { 'X-Request-Id': 'request-1' } })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(url).toBe('http://localhost:3000/api/projects')
    expect(init.credentials).toBe('include')
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"projectName":"Example"}')
    expect(headers.get('Accept')).toBe('application/json')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-Request-Id')).toBe('request-1')
  })

  it('does not set a JSON content type for FormData and preserves custom headers', async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }))
    const body = new FormData()
    body.set('file', 'content')

    await apiClient.post<void>('uploads', body, { headers: { 'X-Upload': 'true' } })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = new Headers(init.headers)
    expect(init.body).toBe(body)
    expect(headers.has('Content-Type')).toBe(false)
    expect(headers.get('X-Upload')).toBe('true')
  })

  it('serializes query parameters and supports all required HTTP methods', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } })))
    vi.stubGlobal('fetch', fetchMock)

    await apiClient.get('features', { query: { page: 2, isActive: true, search: 'payment' } })
    await apiClient.patch('features/feature-1', { name: 'Updated' })
    await apiClient.put('projects/project-1/design', { designId: 'design-1' })
    await apiClient.delete('projects/project-1/design')

    expect(fetchMock.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
      ['http://localhost:3000/api/features?page=2&isActive=true&search=payment', 'GET'],
      ['http://localhost:3000/api/features/feature-1', 'PATCH'],
      ['http://localhost:3000/api/projects/project-1/design', 'PUT'],
      ['http://localhost:3000/api/projects/project-1/design', 'DELETE'],
    ])
  })

  it('parses JSON response bodies', async () => {
    mockFetch(new Response('{"data":{"id":"project-1"}}', { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await expect(request('projects')).resolves.toEqual({ data: { id: 'project-1' } })
  })

  it('handles 204 and empty responses without attempting JSON parsing', async () => {
    mockFetch(new Response(null, { status: 204 }))
    await expect(request('projects/project-1/design', { method: 'DELETE' })).resolves.toBeUndefined()

    mockFetch(new Response('', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    await expect(request('empty')).resolves.toBeUndefined()
  })

  it('returns non-JSON response bodies as text', async () => {
    mockFetch(new Response('plain response', { status: 200, headers: { 'Content-Type': 'text/plain' } }))

    await expect(request<string>('text')).resolves.toBe('plain response')
  })

  it('parses PDF responses as Blob values', async () => {
    mockFetch(new Response('pdf-content', { status: 200, headers: { 'Content-Type': 'application/pdf' } }))

    const response = await request<Blob>('quotation.pdf')
    expect(response).toBeInstanceOf(Blob)
    await expect(response.text()).resolves.toBe('pdf-content')
  })

  it.each([400, 401, 500])('turns HTTP %i into an ApiError with the backend message and payload', async (status) => {
    const payload = { error: { code: 'REQUEST_ERROR', message: 'Backend message' } }
    mockFetch(new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } }))

    const error = await request('failure').catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      name: 'ApiError',
      status,
      message: 'Backend message',
      code: 'REQUEST_ERROR',
      payload,
    })
  })

  it('uses a fallback message when an HTTP error has no message', async () => {
    mockFetch(new Response('not json', { status: 503, headers: { 'Content-Type': 'text/plain' } }))

    await expect(request('failure')).rejects.toMatchObject({ message: 'Request failed with status 503' })
  })

  it('lets network errors reject to the caller unchanged', async () => {
    const networkError = new TypeError('Network unavailable')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError))

    await expect(request('unreachable')).rejects.toBe(networkError)
  })
})
