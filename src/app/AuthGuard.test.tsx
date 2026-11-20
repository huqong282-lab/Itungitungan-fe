import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { AuthGuard } from './AuthGuard'

const userResponse = { data: { id: 'user-1', name: 'Rina Anggraini', email: 'rina@example.com', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } }

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } })
  const router = createMemoryRouter([
    { path: '/login', element: <h1>Masuk</h1> },
    { path: '/register', element: <h1>Buat akun</h1> },
    {
      path: '/app', element: <AuthGuard />, children: [{ element: <Outlet />, children: [
        { index: true, element: <h1>Dashboard</h1> },
        { path: 'projects/:projectId', element: <h1>Project Details</h1> },
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

  it.each([['/login', 'Masuk'], ['/register', 'Buat akun']])('leaves public route %s accessible', (path, heading) => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser')
    renderAt(path)
    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('shows a retryable error and does not redirect for a network error', async () => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(new TypeError('Failed to fetch'))
    const { router } = renderAt('/app')

    expect(await screen.findByRole('heading', { name: 'Tidak dapat terhubung ke server' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app')
    expect(screen.queryByRole('heading', { name: 'Masuk' })).not.toBeInTheDocument()
    expect(getCurrentUser).toHaveBeenCalledOnce()
  })

  it('reuses the session check when moving between nested routes', async () => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(userResponse)
    const { router } = renderAt('/app')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    await router.navigate('/app/projects/project-1')
    expect(await screen.findByRole('heading', { name: 'Project Details' })).toBeInTheDocument()
    expect(getCurrentUser).toHaveBeenCalledOnce()
  })
})
