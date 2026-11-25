import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HostingPage from './HostingPage'
import { hostingApi, type HostingPlan } from '../lib/api/hosting'

const hosting: HostingPlan = { id: 'hosting-1', provider: 'Railway', name: 'Hobby', internalCost: 12000, clientPrice: 25000, billingPeriod: 'YEARLY', isActive: true }
const result = (data: HostingPlan[] = [hosting]) => ({ data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: data.length ? 1 : 0 } })

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } })
  return { client, ...render(<QueryClientProvider client={client}><HostingPage /></QueryClientProvider>) }
}

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('HostingPage', () => {
  it('shows loading state while requesting hosting data', async () => {
    vi.spyOn(hostingApi, 'list').mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Memuat daftar hosting')
  })

  it('renders backend data, all required columns, prices, billing period and status', async () => {
    vi.spyOn(hostingApi, 'list').mockResolvedValue(result())
    renderPage()
    expect(await screen.findByText('Railway')).toBeInTheDocument()
    for (const heading of ['Provider', 'Plan', 'Internal Cost', 'Client Price', 'Billing Period', 'Status']) expect(screen.getByRole('columnheader', { name: heading })).toBeInTheDocument()
    expect(screen.getByText('Hobby')).toBeInTheDocument()
    expect(screen.getByText(/Rp\s12\.000/)).toBeInTheDocument()
    expect(screen.getByText(/Rp\s25\.000/)).toBeInTheDocument()
    expect(screen.getByText('Yearly')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Active' })).toBeInTheDocument()
  })

  it('shows empty state when the backend returns no hosting plans', async () => {
    vi.spyOn(hostingApi, 'list').mockResolvedValue(result([]))
    renderPage()
    expect(await screen.findByText('Belum ada hosting')).toBeInTheDocument()
  })

  it('shows an error and retries the request successfully', async () => {
    const user = userEvent.setup()
    const list = vi.spyOn(hostingApi, 'list').mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(result())
    renderPage()
    expect(await screen.findByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Railway')).toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('sends search and status filter to the hosting list API', async () => {
    const user = userEvent.setup()
    const list = vi.spyOn(hostingApi, 'list').mockResolvedValue(result())
    renderPage()
    await screen.findByText('Railway')
    await user.type(screen.getByRole('searchbox', { name: 'Cari hosting' }), 'Railway')
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'Railway' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter status' }), 'inactive')
    await waitFor(() => expect(list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'Railway', isActive: false }))
  })

  it('uses backend pagination metadata to move to the next page', async () => {
    const user = userEvent.setup()
    const list = vi.spyOn(hostingApi, 'list').mockImplementation(async params => ({ data: params?.page === 2 ? [{ ...hosting, id: 'hosting-2', provider: 'DigitalOcean' }] : [hosting], meta: { page: params?.page ?? 1, pageSize: 20, total: 21, totalPages: 2 } }))
    renderPage()
    await screen.findByText('Railway')
    await user.click(screen.getByRole('button', { name: 'Halaman berikutnya' }))
    expect(await screen.findByText('DigitalOcean')).toBeInTheDocument()
    expect(list).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 })
  })
})
