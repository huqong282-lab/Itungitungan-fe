import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../lib/api/auth'
import RegisterPage from './RegisterPage'
import RegisterPreviewPage from './RegisterPreviewPage'

vi.mock('../lib/api/auth', () => ({ authApi: { register: vi.fn(), getCurrentUser: vi.fn() } }))
afterEach(() => cleanup())
beforeEach(() => {
  vi.mocked(authApi.register).mockReset()
  vi.mocked(authApi.getCurrentUser).mockReset()
})

function renderRegister(initialEntry = '/register') {
  const queryClient = new QueryClient({ mutationCache: new MutationCache({ onError: () => undefined }), defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const router = createMemoryRouter([
    { path: '/register', element: <RegisterPage /> },
    { path: '/login', element: <h1>Masuk</h1> },
    { path: '/app', element: <h1>Dashboard</h1> },
    { path: '/dev/register-preview', element: <RegisterPreviewPage /> },
  ], { initialEntries: [initialEntry] })
  render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)
  return { router }
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup> = userEvent.setup()) {
  await user.type(screen.getByRole('textbox', { name: /Name/ }), 'Rina Anggraini')
  await user.type(screen.getByRole('textbox', { name: /Email/ }), 'rina@example.com')
  await user.type(screen.getByLabelText(/^Password/), 'securepass')
  await user.type(screen.getByLabelText(/^Confirm Password/), 'securepass')
  return user
}

describe('RegisterPage', () => {
  it('validates required fields, email format, password policy, and password match before requesting', async () => {
    const user = userEvent.setup()
    renderRegister()
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByText('Nama wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Password wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Konfirmasi password wajib diisi.')).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()

    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'Rina')
    await user.type(screen.getByRole('textbox', { name: /Email/ }), 'not-an-email')
    await user.type(screen.getByLabelText(/^Password/), 'short')
    await user.type(screen.getByLabelText(/^Confirm Password/), 'other')
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByText('Masukkan alamat email yang valid.')).toBeInTheDocument()
    expect(screen.getByText('Password minimal 8 karakter.')).toBeInTheDocument()
    expect(screen.getByText('Konfirmasi password harus sama dengan password.')).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()
  })

  it('sends only the backend payload and redirects after the contract response succeeds', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.register).mockResolvedValue({ data: { user: { id: 'user-1', name: 'Rina Anggraini', email: 'rina@example.com' } } })
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({ data: { id: 'user-1', name: 'Rina Anggraini', email: 'rina@example.com', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' } })
    const { router } = renderRegister()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(authApi.register).toHaveBeenCalledWith({ name: 'Rina Anggraini', email: 'rina@example.com', password: 'securepass' })
    expect(authApi.getCurrentUser).toHaveBeenCalledOnce()
    expect(router.state.location.pathname).toBe('/app')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('toggles both password fields and navigates back to login', async () => {
    const user = userEvent.setup()
    renderRegister()
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText(/^Confirm Password/)).toHaveAttribute('type', 'password')
    await user.click(screen.getAllByRole('button', { name: 'Tampilkan password' })[0])
    expect(screen.getByLabelText(/^Password/)).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('link', { name: 'Masuk' }))
    expect(screen.getByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
  })

  it('previews all simulated outcomes without API calls or redirect', async () => {
    const user = userEvent.setup()
    const { router } = renderRegister('/dev/register-preview')
    await user.click(screen.getByRole('button', { name: 'Validation Error' }))
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByText('Masukkan alamat email yang valid.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Password Mismatch' }))
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByText('Konfirmasi password harus sama dengan password.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Email Already Exists' }))
    expect(await screen.findByText('Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Server Error' }))
    expect(await screen.findByText('Ini bukan kesalahan Anda. Silakan coba lagi beberapa saat.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Network Error' }))
    expect(await screen.findByText('Periksa koneksi internet Anda, lalu coba kembali.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Loading' }))
    expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Success' }))
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Daftar' }))
    expect(await screen.findByText('Simulasi berhasil. Sesi tidak dibuat dan halaman tidak dialihkan.')).toBeInTheDocument()
    expect(authApi.register).not.toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/dev/register-preview')
  })
})


