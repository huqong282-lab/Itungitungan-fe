import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import DesignsPage from './DesignsPage'
import { designsApi, type Design } from '../lib/api/designs'

vi.mock('../lib/api/designs', () => ({ designsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn() } }))

const design: Design = { id: 'design-a', name: 'Premium UI', description: 'Custom interface', price: 1500000, isActive: true }
const inactiveDesign: Design = { id: 'design-b', name: 'Legacy Theme', description: null, price: 500000, isActive: false }
const result = (data: Design[] = [design], page = 1, total = data.length, totalPages = total ? 1 : 0) => ({ data, meta: { page, pageSize: 20, total, totalPages } })

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/app/designs']}><Routes>
    <Route path="/app/designs" element={<DesignsPage />} />
    <Route path="/app/designs/new" element={<><h1>Create Design destination</h1><Link to="/app/designs">Back</Link></>} />
  </Routes></MemoryRouter></QueryClientProvider>)
}

describe('DesignsPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(designsApi.list).mockResolvedValue(result())
  })

  it('renders the title, design fields, price and status from the API', async () => {
    vi.mocked(designsApi.list).mockResolvedValue(result([design, inactiveDesign], 1, 2))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Designs' })).toBeInTheDocument()
    expect(await screen.findByText('Premium UI')).toBeInTheDocument()
    expect(screen.getByText('Custom interface')).toBeInTheDocument()
    expect(screen.getByText(/1\.500\.000/)).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Daftar desain' })
    expect(within(table).getByText('Active')).toBeInTheDocument()
    expect(within(table).getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('Legacy Theme').parentElement).toHaveTextContent('—')
    expect(designsApi.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
  })

  it('shows a loading state', () => {
    vi.mocked(designsApi.list).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Memuat daftar desain')
  })

  it('shows an empty state with create navigation', async () => {
    vi.mocked(designsApi.list).mockResolvedValue(result([]))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByText('Belum ada desain')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Create Design' })[0])
    expect(screen.getByRole('heading', { name: 'Create Design destination' })).toBeInTheDocument()
  })

  it('sends search and status filters to the list API', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Premium UI')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari desain' }), { target: { value: 'Brand' } })
    await waitFor(() => expect(designsApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'Brand' }), { timeout: 1000 })
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter status' }), 'inactive')
    await waitFor(() => expect(designsApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'Brand', isActive: false }))
  })

  it('shows an API error and retry action', async () => {
    vi.mocked(designsApi.list).mockRejectedValue(new TypeError('offline'))
    renderPage()
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
  })
})
