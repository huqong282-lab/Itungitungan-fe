import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { settingsApi, type Settings } from '../lib/api/settings'
import { appRoutes } from '../app/router'
import SettingsPage, { settingsQueryKey } from './SettingsPage'

const savedSettings: Settings = {
  developerRate: 75_000,
  workingHoursPerDay: 8,
  buffer: 20,
  margin: 30,
  rush: 10,
  freeRevisionCount: 2,
  additionalRevisionPrice: 150_000,
}

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 }, mutations: { retry: false } } })
}

function renderSettings(settings?: Settings) {
  const queryClient = createQueryClient()
  if (settings) queryClient.setQueryData(settingsQueryKey, { data: settings })
  const result = render(<QueryClientProvider client={queryClient}><SettingsPage /></QueryClientProvider>)
  return { ...result, queryClient }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('SettingsPage', () => {
  it('renders the settings page and loads settings from the API', async () => {
    const getSettings = vi.spyOn(settingsApi, 'get').mockResolvedValue({ data: savedSettings })
    renderSettings()

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(await screen.findByDisplayValue('75000')).toBeInTheDocument()
    expect(getSettings).toHaveBeenCalledOnce()
  })

  it('displays every setting returned by the backend', async () => {
    vi.spyOn(settingsApi, 'get').mockResolvedValue({ data: savedSettings })
    renderSettings()

    for (const value of ['75000', '8', '20', '30', '10', '2', '150000']) {
      expect(await screen.findByDisplayValue(value)).toBeInTheDocument()
    }
    expect(screen.queryByLabelText(/currency/i)).not.toBeInTheDocument()
  })

  it('shows a loading state while GET is pending', () => {
    vi.spyOn(settingsApi, 'get').mockReturnValue(new Promise(() => undefined))
    renderSettings()

    expect(screen.getByRole('status')).toHaveTextContent('Memuat pengaturan...')
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('shows an error state when GET fails and can be retried', async () => {
    const getSettings = vi.spyOn(settingsApi, 'get')
      .mockRejectedValueOnce(new ApiError(500, 'Internal server error', null))
      .mockResolvedValue({ data: savedSettings })
    const user = userEvent.setup()
    renderSettings()

    expect(await screen.findByRole('heading', { name: 'Terjadi kesalahan di server' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByDisplayValue('75000')).toBeInTheDocument()
    expect(getSettings).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['Developer Rate', '-1', 'Nilai harus 0 atau lebih.'],
    ['Working Hours / Day', '0', 'Jam kerja harus lebih dari 0.'],
    ['Working Hours / Day', '-1', 'Jam kerja harus lebih dari 0.'],
    ['Buffer', '-1', 'Persentase minimal 0%.'],
    ['Buffer', '101', 'Persentase maksimal 100%.'],
    ['Default Margin', '-1', 'Persentase minimal 0%.'],
    ['Default Margin', '101', 'Persentase maksimal 100%.'],
    ['Default Rush', '-1', 'Persentase minimal 0%.'],
    ['Default Rush', '101', 'Persentase maksimal 100%.'],
    ['Free Revision Count', '-1', 'Nilai harus 0 atau lebih.'],
    ['Free Revision Count', '1.5', 'Masukkan bilangan bulat.'],
    ['Additional Revision Price', '-1', 'Nilai harus 0 atau lebih.'],
    ['Additional Revision Price', '1.5', 'Masukkan bilangan bulat.'],
  ])('validates %s value %s', async (label, value, message) => {
    const update = vi.spyOn(settingsApi, 'update').mockResolvedValue({ data: savedSettings })
    const user = userEvent.setup()
    renderSettings(savedSettings)

    const input = screen.getByLabelText(new RegExp(label))
    await user.clear(input)
    await user.type(input, value)
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })

  it('accepts decimal values for percentage fields supported as Numbers by the backend', async () => {
    const update = vi.spyOn(settingsApi, 'update').mockResolvedValue({ data: { ...savedSettings, buffer: 12.5 } })
    const user = userEvent.setup()
    renderSettings(savedSettings)

    await user.clear(screen.getByLabelText(/Buffer/))
    await user.type(screen.getByLabelText(/Buffer/), '12.5')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith({ buffer: 12.5 }))
    expect(await screen.findByText('Pengaturan terbaru sudah disimpan.')).toBeInTheDocument()
  })

  it('requires all fields to be populated', async () => {
    const update = vi.spyOn(settingsApi, 'update').mockResolvedValue({ data: savedSettings })
    const user = userEvent.setup()
    renderSettings(savedSettings)
    await user.clear(screen.getByLabelText(/Developer Rate/))
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Wajib diisi.')).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })

  it('sends only changed fields and syncs the cache after a successful save', async () => {
    const update = vi.spyOn(settingsApi, 'update').mockResolvedValue({ data: { ...savedSettings, buffer: 25 } })
    const user = userEvent.setup()
    const { queryClient } = renderSettings(savedSettings)
    const saveButton = screen.getByRole('button', { name: 'Save Changes' })
    expect(saveButton).toBeDisabled()

    const buffer = screen.getByLabelText(/Buffer/)
    await user.clear(buffer)
    await user.type(buffer, '25')
    expect(screen.getByText('Ada perubahan yang belum disimpan.')).toBeInTheDocument()
    await user.click(saveButton)

    await waitFor(() => expect(update).toHaveBeenCalledWith({ buffer: 25 }))
    expect(await screen.findByText('Pengaturan terbaru sudah disimpan.')).toBeInTheDocument()
    expect(buffer).toHaveValue(25)
    expect(queryClient.getQueryData(settingsQueryKey)).toEqual({ data: { ...savedSettings, buffer: 25 } })
    expect(saveButton).toBeDisabled()
  })

  it('does not overwrite dirty input when cached settings refetch', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderSettings(savedSettings)
    const buffer = screen.getByLabelText(/Buffer/)
    await user.clear(buffer)
    await user.type(buffer, '25')

    queryClient.setQueryData(settingsQueryKey, { data: { ...savedSettings, buffer: 35 } })

    expect(buffer).toHaveValue(25)
    expect(screen.getByText('Ada perubahan yang belum disimpan.')).toBeInTheDocument()
  })

  it('shows saving state and prevents multiple submissions', async () => {
    let resolveUpdate: ((response: { data: Settings }) => void) | undefined
    const update = vi.spyOn(settingsApi, 'update').mockImplementation(() => new Promise((resolve) => { resolveUpdate = resolve }))
    const user = userEvent.setup()
    renderSettings(savedSettings)

    await user.clear(screen.getByLabelText(/Buffer/))
    await user.type(screen.getByLabelText(/Buffer/), '25')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    const savingButton = await screen.findByRole('button', { name: 'Menyimpan...' })
    expect(savingButton).toBeDisabled()
    expect(screen.getByLabelText(/Buffer/)).toBeDisabled()
    expect(update).toHaveBeenCalledOnce()
    resolveUpdate?.({ data: { ...savedSettings, buffer: 25 } })
    expect(await screen.findByText('Pengaturan terbaru sudah disimpan.')).toBeInTheDocument()
  })

  it('keeps user input and shows an error when PATCH fails', async () => {
    vi.spyOn(settingsApi, 'update').mockRejectedValue(new ApiError(500, 'Server error', null))
    const user = userEvent.setup()
    renderSettings(savedSettings)

    const buffer = screen.getByLabelText(/Buffer/)
    await user.clear(buffer)
    await user.type(buffer, '25')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Terjadi kesalahan di server')).toBeInTheDocument()
    expect(buffer).toHaveValue(25)
    expect(screen.queryByText('Pengaturan terbaru sudah disimpan.')).not.toBeInTheDocument()
  })

  it('loads the saved values again after a page reload', async () => {
    let backendSettings = savedSettings
    const getSettings = vi.spyOn(settingsApi, 'get').mockImplementation(async () => ({ data: backendSettings }))
    vi.spyOn(settingsApi, 'update').mockImplementation(async (payload) => {
      backendSettings = { ...backendSettings, ...payload }
      return { data: backendSettings }
    })
    const user = userEvent.setup()
    const firstRender = renderSettings()
    await screen.findByDisplayValue('75000')
    await user.clear(screen.getByLabelText(/Buffer/))
    await user.type(screen.getByLabelText(/Buffer/), '25')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))
    await screen.findByText('Pengaturan terbaru sudah disimpan.')
    firstRender.unmount()

    renderSettings()
    expect(await screen.findByDisplayValue('25')).toBeInTheDocument()
    expect(getSettings).toHaveBeenCalledTimes(2)
  })

  it('keeps the real settings route behind AuthGuard', async () => {
    const getCurrentUser = vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(new ApiError(401, 'Unauthorized', null))
    const getSettings = vi.spyOn(settingsApi, 'get')
    const queryClient = createQueryClient()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/app/settings'] })
    render(<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>)

    expect(await screen.findByRole('heading', { name: 'Masuk' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(getCurrentUser).toHaveBeenCalledOnce()
    expect(getSettings).not.toHaveBeenCalled()
  })
})
