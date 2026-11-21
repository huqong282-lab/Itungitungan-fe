import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FeaturesPage, { featuresQueryKey } from './FeaturesPage'
import { featuresApi, type FeatureSummary } from '../lib/api/features'

vi.mock('../lib/api/features', () => ({ featuresApi: {
  list: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn(),
} }))

const activeFeature: FeatureSummary = { id: 'feature-a', name: 'Authentication', description: 'User login', category: 'Core', baseEstimatedHours: 4, isActive: true }
const inactiveFeature: FeatureSummary = { id: 'feature-b', name: 'Legacy Search', description: 'Old search', category: 'Core', baseEstimatedHours: 2, isActive: false }
const pageResult = (data: FeatureSummary[] = [activeFeature], page = 1, total = data.length, totalPages = total ? 1 : 0) => ({ data, meta: { page, pageSize: 20, total, totalPages } })

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return { client, ...render(<QueryClientProvider client={client}><FeaturesPage /></QueryClientProvider>) }
}

describe('FeaturesPage', () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(featuresApi.list).mockResolvedValue(pageResult())
    vi.mocked(featuresApi.create).mockResolvedValue(undefined)
    vi.mocked(featuresApi.update).mockResolvedValue({ data: activeFeature })
    vi.mocked(featuresApi.setActive).mockResolvedValue({ data: { id: activeFeature.id, isActive: false } })
  })

  it('renders feature data and status badges', async () => {
    vi.mocked(featuresApi.list).mockResolvedValue(pageResult([activeFeature, inactiveFeature], 1, 2))
    renderPage()
    expect(await screen.findByText('Authentication')).toBeInTheDocument()
    expect(screen.getByText('User login')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Daftar fitur' })
    expect(within(table).getByText('Active')).toBeInTheDocument()
    expect(within(table).getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('4 jam')).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    vi.mocked(featuresApi.list).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toHaveTextContent('Memuat daftar fitur')
  })

  it('shows an empty state and a distinct search empty state', async () => {
    vi.mocked(featuresApi.list).mockResolvedValue(pageResult([], 1, 0, 0))
    renderPage()
    expect(await screen.findByText('Belum ada fitur')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Cari fitur' }), { target: { value: 'xyz' } })
    await waitFor(() => expect(featuresApi.list).toHaveBeenLastCalledWith({ page: 1, pageSize: 20, search: 'xyz' }))
    expect(await screen.findByText('Tidak ada hasil pencarian')).toBeInTheDocument()
  })

  it('sends the search query and resets pagination when search changes', async () => {
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

  it('omits isActive for All and keeps filters when paging', async () => {
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

  it('submits create with empty response, then invalidates and refetches the list', async () => {
    const user = userEvent.setup()
    const { client } = renderPage()
    await screen.findByText('Authentication')
    await user.click(screen.getByRole('button', { name: 'Tambah fitur' }))
    const dialog = screen.getByRole('dialog', { name: 'Tambah fitur' })
    await user.type(within(dialog).getByLabelText(/^Nama fitur/), '  Reports  ')
    await user.type(within(dialog).getByLabelText(/^Deskripsi/), 'Monthly report')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
    await waitFor(() => expect(featuresApi.create).toHaveBeenCalledWith({ name: 'Reports', description: 'Monthly report', category: null, baseEstimatedHours: 0 }))
    await waitFor(() => expect(featuresApi.list).toHaveBeenCalledTimes(2))
    expect(client.getQueryData([...featuresQueryKey, 'list', { page: 1, pageSize: 20 }])).toEqual(pageResult())
    expect(await screen.findByText('Fitur berhasil dibuat.')).toBeInTheDocument()
  })

  it('keeps create input after a failed request', async () => {
    const user = userEvent.setup()
    vi.mocked(featuresApi.create).mockRejectedValue(new Error('network'))
    renderPage()
    await screen.findByText('Authentication')
    await user.click(screen.getByRole('button', { name: 'Tambah fitur' }))
    const dialog = screen.getByRole('dialog', { name: 'Tambah fitur' })
    await user.type(within(dialog).getByLabelText(/^Nama fitur/), 'Draft name')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
    expect(within(dialog).getByLabelText(/^Nama fitur/)).toHaveValue('Draft name')
    expect(within(dialog).getByRole('alert')).toBeInTheDocument()
  })

  it('edits a feature and refreshes the list', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Authentication')
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    const dialog = screen.getByRole('dialog', { name: 'Edit fitur' })
    const nameInput = within(dialog).getByLabelText(/^Nama fitur/)
    await user.clear(nameInput)
    await user.type(nameInput, 'User Access')
    await user.click(within(dialog).getByRole('button', { name: 'Simpan' }))
    await waitFor(() => expect(featuresApi.update).toHaveBeenCalledWith('feature-a', expect.objectContaining({ name: 'User Access' })))
    expect(await screen.findByText('Fitur berhasil diperbarui.')).toBeInTheDocument()
  })

  it('deactivates an active feature and sends isActive false', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Authentication')
    await user.click(screen.getByRole('button', { name: 'Deactivate' }))
    await user.click(within(screen.getByRole('dialog', { name: 'Nonaktifkan fitur?' })).getByRole('button', { name: 'Deactivate' }))
    await waitFor(() => expect(featuresApi.setActive).toHaveBeenCalledWith('feature-a', false))
    expect(await screen.findByText('Fitur berhasil dinonaktifkan.')).toBeInTheDocument()
  })

  it('shows a retryable error state', async () => {
    vi.mocked(featuresApi.list).mockRejectedValue(new TypeError('offline'))
    renderPage()
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument()
  })
})
