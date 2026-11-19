import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../lib/api/auth'
import { UserMenu } from './UserMenu'

vi.mock('../../lib/api/auth', () => ({ authApi: { logout: vi.fn() } }))
afterEach(() => cleanup())
beforeEach(() => vi.mocked(authApi.logout).mockReset())

function renderUserMenu(initialEntry = '/app', previewState?: 'closed' | 'open' | 'loading' | 'success' | 'error' | 'network-error') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const router = createMemoryRouter([
    { path: '/app', element: <><UserMenu user={{ name: 'Rina Anggraini', email: 'rina@example.com' }} previewState={previewState} /><h1>Dashboard</h1></> },
    { path: '/login', element: <h1>Masuk</h1> },
    { path: '/app/settings', element: <h1>Pengaturan</h1> },
  ], { initialEntries: [initialEntry] })
  render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
  return { queryClient, router }
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Menu pengguna, Rina Anggraini' }))
  return screen.getByRole('menu', { name: 'Menu pengguna' })
}

describe('UserMenu logout', () => {
  it('shows the existing menu and its logout action', async () => {
    const user = userEvent.setup()
    renderUserMenu()
    expect(screen.getByRole('button', { name: 'Menu pengguna, Rina Anggraini' })).toHaveAttribute('aria-expanded', 'false')
    await openMenu(user)
    expect(screen.getByRole('menuitem', { name: 'Profil & pengaturan' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Keluar' })).toBeInTheDocument()
  })

  it('waits for backend confirmation, clears private cache, and replaces the route', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    const { queryClient, router } = renderUserMenu()
    queryClient.setQueryData(['private', 'projects'], ['rahasia'])
    await openMenu(user)
    await user.click(screen.getByRole('menuitem', { name: 'Keluar' }))
    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(queryClient.getQueryData(['private', 'projects'])).toBeUndefined()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('shows loading and prevents duplicate logout calls', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.logout).mockImplementation(async () => { await new Promise((resolve) => setTimeout(resolve, 100)) })
    renderUserMenu()
    await openMenu(user)
    await user.click(screen.getByRole('menuitem', { name: 'Keluar' }))
    expect(await screen.findByRole('menuitem', { name: 'Memproses...' })).toBeDisabled()
    expect(authApi.logout).toHaveBeenCalledOnce()
    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })

  it.each([
    ['error', 'Ini bukan kesalahan Anda. Silakan coba lagi beberapa saat.'],
    ['network-error', 'Periksa koneksi internet Anda, lalu coba kembali.'],
  ] as const)('shows mapped %s preview without clearing session data or redirecting', async (previewState, message) => {
    const { queryClient, router } = renderUserMenu('/app', previewState)
    queryClient.setQueryData(['private', 'projects'], ['rahasia'])
    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app')
    expect(queryClient.getQueryData(['private', 'projects'])).toEqual(['rahasia'])
    expect(authApi.logout).not.toHaveBeenCalled()
  })

  it('does not call the API, clear cache, or navigate in preview mode', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.logout).mockResolvedValue(undefined)
    const { queryClient, router } = renderUserMenu('/app', 'open')
    queryClient.setQueryData(['private', 'profile'], 'private value')
    screen.getByRole('menu', { name: 'Menu pengguna' })
    await user.click(screen.getByRole('menuitem', { name: 'Keluar' }))
    await waitFor(() => expect(authApi.logout).not.toHaveBeenCalled())
    expect(queryClient.getQueryData(['private', 'profile'])).toBe('private value')
    expect(router.state.location.pathname).toBe('/app')
  })
})
