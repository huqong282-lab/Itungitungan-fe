import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../lib/api/auth'
import LoginPage from './LoginPage'
import LoginPreviewPage from './LoginPreviewPage'

vi.mock('../lib/api/auth', () => ({ authApi: { login: vi.fn() } }))

afterEach(() => cleanup())
beforeEach(() => vi.mocked(authApi.login).mockReset())

function renderLogin(initialEntry = '/login') {
  const queryClient = new QueryClient({ mutationCache: new MutationCache({ onError: () => undefined }), defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const router = createMemoryRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/app', element: <h1>Dashboard</h1> },
    { path: '/dev/login-preview', element: <LoginPreviewPage /> },
  ], { initialEntries: [initialEntry] })
  render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
  return { router }
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /Email/ }), 'rina@example.com')
  await user.type(screen.getByLabelText(/Password/), 'secret')
}

describe('LoginPage', () => {
  it('shows field validation and does not call the API for empty or invalid values', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByText('Email wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Password wajib diisi.')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()

    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'invalid-email')
    expect(await screen.findByText('Masukkan alamat email yang valid.')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
  })

  it('submits the backend payload and navigates only after successful login', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockResolvedValue({ data: { user: { id: 'user-1', email: 'rina@example.com' } } })
    const { router } = renderLogin()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Masuk' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith({ email: 'rina@example.com', password: 'secret' })
    expect(router.state.location.pathname).toBe('/app')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('toggles password visibility accessibly', async () => {
    const user = userEvent.setup()
    renderLogin()
    const password = screen.getByLabelText(/Password/)
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Tampilkan password' }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Sembunyikan password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('renders preview states without calling the API or navigating', async () => {
    const user = userEvent.setup()
    const { router } = renderLogin('/dev/login-preview')
    await user.click(screen.getByRole('button', { name: 'Invalid Credential' }))
    expect(screen.getByText('Periksa kembali email dan kata sandi Anda.')).toBeInTheDocument()
    expect(authApi.login).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Server Error' }))
    expect(screen.getByText('Ini bukan kesalahan Anda. Silakan coba lagi beberapa saat.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Validation Error' }))
    expect(screen.getByText('Masukkan alamat email yang valid.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Loading' }))
    expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled()
    expect(authApi.login).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Network Error' }))
    expect(screen.getByText('Periksa koneksi internet Anda, lalu coba kembali.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dev/login-preview')
    expect(authApi.login).not.toHaveBeenCalled()
  })
})
