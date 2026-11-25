import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { AuthGuard, currentUserQueryKey } from './AuthGuard'

const userResponse = { data: { id: 'user-1', name: 'Rina Anggraini', email: 'rina@example.com', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } }

function renderAt(path: string, seedSession = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } })
  if (seedSession) client.setQueryData(currentUserQueryKey, userResponse)
  const router = createMemoryRouter([
    { path: '/login', element: <h1>Masuk</h1> },
    { path: '/register', element: <h1>Buat akun</h1> },
    {
      path: '/app', element: <AuthGuard />, children: [{ element: <Outlet />, children: [
        { index: true, element: <h1>Dashboard</h1> },
        { path: 'projects/:projectId', element: <h1>Project Details</h1> },
        { path: 'features', element: <h1>Feature List</h1> },
        { path: 'features/:featureId/options/:optionId/values/:valueId', element: <h1>Feature Value Details</h1> },
        { path: 'designs', element: <h1>Design List</h1> },
        { path: 'designs/:designId', element: <h1>Design Details</h1> },
        { path: 'hosting', element: <h1>Hosting List</h1> },
      ] }],
    },
  ], { initialEntries: [path] })

  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>)
  return { router, client }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AuthGuard', () => {
  it('allows a valid session to access /app', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(userResponse)
    renderAt('/app')

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it.each([
    ['/app/features', 'Feature List'],
    ['/app/features/feature-1/options/option-1/values/value-1', 'Feature Value Details'],
    ['/app/designs', 'Design List'],
    ['/app/designs/design-1', 'Design Details'],
    ['/app/hosting', 'Hosting List'],
  ])('protects nested route %s with a verified session', async (path, title) => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(userResponse)
    const { router } = renderAt(path)
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(path)
    expect(getCurrentUser).toHaveBeenCalledOnce()
  })

  it('redirects a 401 session to login, including nested routes', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(new ApiError(401, 'Unauthorized', null))
    const { router } = renderAt('/app/projects/project-1')

    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.queryByRole('heading', { name: 'Project Details' })).not.toBeInTheDocument()
  })

  it('does not render the authenticated page while checking the session', async () => {
    let resolveSession: ((value: typeof userResponse) => void) | undefined
    vi.spyOn(authApi, 'getCurrentUser').mockImplementation(() => new Promise((resolve) => { resolveSession = resolve }))
    renderAt('/app')

    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa sesi...')
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
    resolveSession?.(userResponse)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('does not trust a cached session and blocks protected content during revalidation', async () => {
    let resolveSession: ((value: typeof userResponse) => void) | undefined
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockImplementation(() => new Promise((resolve) => { resolveSession = resolve }))
    renderAt('/app', true)

    expect(screen.getByRole('status')).toHaveTextContent('Memeriksa sesi...')
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
    expect(getCurrentUser).toHaveBeenCalledOnce()
    resolveSession?.(userResponse)
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it.each([['/login', 'Masuk'], ['/register', 'Buat akun']])('leaves public route %s accessible', (path, heading) => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser')
    renderAt(path)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('shows a retryable error and does not redirect for a network error', async () => {
    const user = userEvent.setup()
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(userResponse)
    const { router } = renderAt('/app')

    expect(await screen.findByRole('heading', { name: 'Tidak dapat terhubung ke server' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app')
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument()
    expect(getCurrentUser).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })

  it('shows a retryable server error without redirecting to login', async () => {
    const user = userEvent.setup()
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockRejectedValueOnce(new ApiError(500, 'Server error', null)).mockResolvedValueOnce(userResponse)
    const { router } = renderAt('/app')
    expect(await screen.findByRole('heading', { name: 'Terjadi kesalahan di server' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app')
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })

  it('reuses the session check when moving between nested routes', async () => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(userResponse)
    const { router } = renderAt('/app')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    await router.navigate('/app/projects/project-1')
    expect(await screen.findByRole('heading', { name: 'Project Details' })).toBeInTheDocument()
    expect(getCurrentUser).toHaveBeenCalledOnce()
  })

  it('redirects and removes the cached session when it expires', async () => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser')
      .mockResolvedValueOnce(userResponse)
      .mockRejectedValueOnce(new ApiError(401, 'Unauthorized', null))
    const { router, client } = renderAt('/app')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    await client.invalidateQueries({ queryKey: currentUserQueryKey })
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
    expect(client.getQueryData(currentUserQueryKey)).toBeUndefined()
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })
})
