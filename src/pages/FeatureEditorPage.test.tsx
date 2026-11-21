import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router'
import FeatureEditorPage from './FeatureEditorPage'
import FeaturesPage from './FeaturesPage'
import { featuresApi, type FeatureDetail, type FeatureSummary } from '../lib/api/features'
import { ApiError } from '../lib/api/client'

vi.mock('../lib/api/features', () => ({ featuresApi: {
  list: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn(), get: vi.fn(),
} }))

const feature: FeatureDetail = { id: 'feature-a', name: 'Payment Gateway', description: 'Payment integration', category: 'Payment', baseEstimatedHours: 8, isActive: true, options: [] }
const summary: FeatureSummary = { id: feature.id, name: feature.name, description: feature.description, category: feature.category, baseEstimatedHours: feature.baseEstimatedHours, isActive: feature.isActive }
const listResponse = { data: [summary], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }

function Path() { const location = useLocation(); return <><span data-testid="path">{location.pathname}</span><Link to="/app/features/feature-b">Switch ID</Link></> }

function renderEditor(path: string, { withList = true }: { withList?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const listRoute = withList ? <Route path="/app/features" element={<><FeaturesPage /><Link to="/app/features/new">Create Feature</Link></>} /> : null
  const ui = render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Path /><Routes>
    <Route path="/app/features/new" element={<FeatureEditorPage mode="create" />} />
    <Route path="/app/features/:featureId" element={<FeatureEditorPage mode="edit" />} />
    {listRoute}
  </Routes></MemoryRouter></QueryClientProvider>)
  return { client, ...ui }
}

describe('FeatureEditorPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(featuresApi.get).mockResolvedValue({ data: feature })
    vi.mocked(featuresApi.list).mockResolvedValue(listResponse)
    vi.mocked(featuresApi.create).mockResolvedValue(undefined)
    vi.mocked(featuresApi.update).mockResolvedValue({ data: summary })
  })

  it('renders the create editor and validates required name and nonnegative integer hours', async () => {
    const user = userEvent.setup()
    renderEditor('/app/features/new')
    expect(screen.getByRole('heading', { name: 'Create Feature' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Nama fitur wajib diisi.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Base Estimated Hours/), { target: { value: '-1' } })
    await user.type(screen.getByLabelText(/^Name/), 'Reporting')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Nilai harus 0 atau lebih.')).toBeInTheDocument()
    expect(featuresApi.create).not.toHaveBeenCalled()
  })

  it('creates with the empty response, invalidates the feature list, and returns with success feedback', async () => {
    const user = userEvent.setup()
    renderEditor('/app/features/new')
    await user.type(screen.getByLabelText(/^Name/), 'Reporting')
    await user.type(screen.getByLabelText('Description'), 'Report generation')
    await user.type(screen.getByLabelText('Category'), 'Core')
    await user.clear(screen.getByLabelText(/^Base Estimated Hours/))
    await user.type(screen.getByLabelText(/^Base Estimated Hours/), '4')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(featuresApi.create).toHaveBeenCalledWith({ name: 'Reporting', description: 'Report generation', category: 'Core', baseEstimatedHours: 4 }))
    expect(await screen.findByTestId('path')).toHaveTextContent('/app/features')
    expect(await screen.findByText('Fitur berhasil dibuat.')).toBeInTheDocument()
    expect(featuresApi.list).toHaveBeenCalled()
  })

  it('preserves create input after a failed request and allows cancel navigation', async () => {
    const user = userEvent.setup()
    vi.mocked(featuresApi.create).mockRejectedValue(new TypeError('offline'))
    renderEditor('/app/features/new')
    const name = screen.getByLabelText(/^Name/)
    await user.type(name, 'Draft report')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
    expect(name).toHaveValue('Draft report')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(await screen.findByTestId('path')).toHaveTextContent('/app/features')
  })

  it('loads the feature by the URL ID and fills the edit form with its values', async () => {
    renderEditor('/app/features/feature-a', { withList: false })
    expect(screen.getByRole('status')).toHaveTextContent('Memuat data fitur')
    expect(await screen.findByRole('heading', { name: 'Edit Feature' })).toBeInTheDocument()
    expect(featuresApi.get).toHaveBeenCalledWith('feature-a')
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Payment Gateway')
    expect(screen.getByLabelText('Description')).toHaveValue('Payment integration')
    expect(screen.getByLabelText('Category')).toHaveValue('Payment')
    expect(screen.getByLabelText(/^Base Estimated Hours/)).toHaveValue(8)
  })

  it('does not submit an update while edit data is still loading', async () => {
    vi.mocked(featuresApi.get).mockReturnValue(new Promise(() => {}))
    renderEditor('/app/features/feature-a', { withList: false })
    expect(screen.getByRole('status')).toHaveTextContent('Memuat data fitur')
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(featuresApi.update).not.toHaveBeenCalled()
  })

  it('patches only changed fields using the route ID and returns to the refreshed list', async () => {
    const user = userEvent.setup()
    renderEditor('/app/features/feature-a')
    await screen.findByRole('heading', { name: 'Edit Feature' })
    const name = screen.getByLabelText(/^Name/)
    await user.clear(name)
    await user.type(name, 'Checkout')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(featuresApi.update).toHaveBeenCalledWith('feature-a', { name: 'Checkout' }))
    expect(await screen.findByTestId('path')).toHaveTextContent('/app/features')
    expect(await screen.findByText('Fitur berhasil diperbarui.')).toBeInTheDocument()
    expect(featuresApi.list).toHaveBeenCalled()
  })

  it('does not show an edit form when the feature does not exist', async () => {
    vi.mocked(featuresApi.get).mockRejectedValue(new ApiError(404, 'Feature not found', { error: { code: 'FEATURE_NOT_FOUND', message: 'Feature not found' } }, 'FEATURE_NOT_FOUND'))
    renderEditor('/app/features/missing', { withList: false })
    expect(await screen.findByText('Fitur tidak ditemukan')).toBeInTheDocument()
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
    expect(featuresApi.update).not.toHaveBeenCalled()
  })

  it('shows an access error when the edit detail request is unauthorized', async () => {
    vi.mocked(featuresApi.get).mockRejectedValue(new ApiError(401, 'Authentication required', { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 'UNAUTHORIZED'))
    renderEditor('/app/features/feature-a', { withList: false })
    expect(await screen.findByText('Sesi Anda telah berakhir')).toBeInTheDocument()
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument()
  })

  it('shows submit errors without clearing edit values', async () => {
    const user = userEvent.setup()
    vi.mocked(featuresApi.update).mockRejectedValue(new ApiError(500, 'Unexpected', { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Unexpected' } }, 'INTERNAL_SERVER_ERROR'))
    renderEditor('/app/features/feature-a', { withList: false })
    await screen.findByRole('heading', { name: 'Edit Feature' })
    const name = screen.getByLabelText(/^Name/)
    await user.clear(name)
    await user.type(name, 'Updated name')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Terjadi kesalahan di server')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Updated name')
    expect(featuresApi.update).toHaveBeenCalledWith('feature-a', { name: 'Updated name' })
  })

  it('uses distinct detail query data when the URL ID changes', async () => {
    vi.mocked(featuresApi.get).mockImplementation(async id => ({ data: { ...feature, id, name: `Feature ${id}` } }))
    renderEditor('/app/features/feature-a', { withList: false })
    await waitFor(() => expect(screen.getByLabelText(/^Name/)).toHaveValue('Feature feature-a'))
    await userEvent.setup().click(screen.getByRole('link', { name: 'Switch ID' }))
    expect(await screen.findByLabelText(/^Name/)).toHaveValue('Feature feature-b')
    expect(featuresApi.get).toHaveBeenCalledWith('feature-b')
  })
})
