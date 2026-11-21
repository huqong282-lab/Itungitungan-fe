import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router'
import FeaturesPage from './FeaturesPage'
import { featuresApi, type FeatureSummary } from '../lib/api/features'

vi.mock('../lib/api/features', () => ({ featuresApi: {
  list: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn(), get: vi.fn(),
} }))

const activeFeature: FeatureSummary = { id: 'feature-a', name: 'Authentication', description: 'User login', category: 'Core', baseEstimatedHours: 4, isActive: true }
const inactiveFeature: FeatureSummary = { id: 'feature-b', name: 'Legacy Search', description: 'Old search', category: 'Core', baseEstimatedHours: 2, isActive: false }
const pageResult = (data: FeatureSummary[] = [activeFeature], page = 1, total = data.length, totalPages = total ? 1 : 0) => ({ data, meta: { page, pageSize: 20, total, totalPages } })

function LocationDisplay() { const location = useLocation(); return <span data-testid="current-path">{location.pathname}</span> }

function Destination({ title }: { title: string }) { return <><h1>{title}</h1><Link to="/app/features">Back to features</Link></> }

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return { client, ...render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/app/features']}><LocationDisplay /><Routes><Route path="/app/features" element={<FeaturesPage />} /><Route path="/app/features/new" element={<Destination title="Create destination" />} /><Route path="/app/features/:featureId" element={<Destination title="Edit destination" />} /></Routes></MemoryRouter></QueryClientProvider>) }
}

describe('FeaturesPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(featuresApi.list).mockResolvedValue(pageResult())
    vi.mocked(featuresApi.setActive).mockResolvedValue({ data: { id: activeFeature.id, isActive: false } })
  })

  it('renders feature data, statuses, and only offers deactivate for active features', async () => {
    vi.mocked(featuresApi.list).mockResolvedValue(pageResult([activeFeature, inactiveFeature], 1, 2))
    renderPage()
    expect(await screen.findByText('Authentication')).toBeInTheDocument()
    expect(screen.getByText('User login')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Daftar fitur' })
    expect(within(table).getByText('Active')).toBeInTheDocument()
    expect(within(table).getByText('Inactive')).toBeInTheDocument()
    expect(within(table).getByText('4 jam')).toBeInTheDocument()
    const inactiveRow = screen.getByText('Legacy Search').closest('tr')!
    expect(within(inactiveRow).queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /hapus/i })).not.toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(featuresApi.list).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Memuat daftar fitur')
  })

  it('shows empty and search-empty states', async () => {
    vi.mocked(featuresApi.list).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } })
    renderPage()
    expect(await screen.findByText('Belum ada fitur')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari fitur' }), { target: { value: 'xyz' } })
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'xyz' }))
    expect(await screen.findByText('Tidak ada hasil pencarian')).toBeInTheDocument()
  })

  it('sends search and resets pagination when search changes', async () => {
    const user = userEvent.setup()
    vi.mocked(featuresApi.list).mockImplementation(async params => pageResult([activeFeature], params?.page ?? 1, 41, 3))
    renderPage()
    await screen.findByText('Authentication')
    await user.click(screen.getByRole('button', { name: 'Halaman 2' }))
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 }))
    await user.type(screen.getByRole('searchbox', { name: 'Cari fitur' }), 'Auth')
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'Auth' }))
  })

  it.each([['Active', true], ['Inactive', false]] as const)('filters %s status', async (label, isActive) => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Authentication')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter status' }), label.toLowerCase())
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, isActive }))
  })

  it('omits isActive for All and keeps the filter while paging', async () => {
    const user = userEvent.setup()
    vi.mocked(featuresApi.list).mockImplementation(async params => pageResult([activeFeature], params?.page ?? 1, 41, 3))
    renderPage()
    await screen.findByText('Authentication')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter status' }), 'inactive')
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, isActive: false }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter status' }), 'all')
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 }))
    await user.click(screen.getByRole('button', { name: 'Halaman 2' }))
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 }))
  })

  it('navigates to create and edit routes from the list', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Authentication')
    await user.click(screen.getByRole('button', { name: 'Tambah fitur' }))
    expect(screen.getByRole('heading', { name: 'Create destination' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Back to features' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('heading', { name: 'Edit destination' })).toBeInTheDocument()
    expect(screen.getByTestId('current-path')).toHaveTextContent('/app/features/feature-a')
  })

  it('deactivates an active feature using the status endpoint', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Authentication')
    await user.click(screen.getByRole('button', { name: 'Deactivate' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Nonaktifkan fitur?' })).getByRole('button', { name: 'Deactivate' }))
    await waitFor(() => expect(featuresApi.setActive).toHaveBeenCalledWith('feature-a', false))
    expect(await screen.findByText('Fitur berhasil dinonaktifkan.')).toBeInTheDocument()
  })

  it('shows a retryable network error', async () => {
    vi.mocked(featuresApi.list).mockRejectedValue(new TypeError('offline'))
    renderPage()
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
  })
})
