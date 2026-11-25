import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import DesignEditorPage from './DesignEditorPage'
import DesignsPage, { designsQueryKey } from './DesignsPage'
import { designsApi, type Design } from '../lib/api/designs'

vi.mock('../lib/api/designs', () => ({ designsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), setActive: vi.fn() } }))

const design: Design = { id: 'design-a', name: 'Premium UI', description: 'Custom interface', price: 1500000, isActive: true }
const listResult = { data: [design], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }
let client: QueryClient

function renderEditor(path = '/app/designs/new') {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/app/designs" element={<><DesignsPage /><Link to="/app/designs/new">New</Link></>} />
    <Route path="/app/designs/new" element={<DesignEditorPage mode="create" />} />
    <Route path="/app/designs/:designId" element={<DesignEditorPage mode="edit" />} />
  </Routes></MemoryRouter></QueryClientProvider>)
}

describe('DesignEditorPage', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(designsApi.get).mockResolvedValue({ data: design })
    vi.mocked(designsApi.list).mockResolvedValue(listResult)
  })

  it('renders create fields and validates a blank name', async () => {
    renderEditor()
    expect(screen.getByRole('heading', { name: 'Create Design' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Price/)).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Nama design wajib diisi.')).toBeInTheDocument()
    expect(designsApi.create).not.toHaveBeenCalled()
  })

  it('validates price as a non-negative integer', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.type(screen.getByLabelText(/^Name/), 'New design')
    fireEvent.change(screen.getByLabelText(/^Price/), { target: { value: '-1' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Harga tidak boleh kurang dari 0.')).toBeInTheDocument()
    expect(designsApi.create).not.toHaveBeenCalled()
  })

  it('creates a design, invalidates list data, and shows success on the list', async () => {
    const user = userEvent.setup()
    vi.mocked(designsApi.create).mockResolvedValue({ data: design })
    renderEditor()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await user.type(screen.getByLabelText(/^Name/), 'New design')
    await user.type(screen.getByLabelText('Description'), '  New description  ')
    fireEvent.change(screen.getByLabelText(/^Price/), { target: { value: '250000' } })
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Design berhasil dibuat.')
    expect(designsApi.create).toHaveBeenCalledWith({ name: 'New design', description: 'New description', price: 250000 })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: designsQueryKey })
  })

  it('shows a create API error', async () => {
    const user = userEvent.setup()
    vi.mocked(designsApi.create).mockRejectedValue(new TypeError('offline'))
    renderEditor()
    await user.type(screen.getByLabelText(/^Name/), 'New design')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
  })

  it('fills initial values from API and saves only changed fields', async () => {
    const user = userEvent.setup()
    vi.mocked(designsApi.update).mockResolvedValue({ data: { ...design, name: 'Updated UI' } })
    renderEditor('/app/designs/design-a')
    expect(await screen.findByRole('heading', { name: 'Edit Design' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Premium UI')
    expect(screen.getByLabelText('Description')).toHaveValue('Custom interface')
    expect(screen.getByLabelText(/^Price/)).toHaveValue(1500000)
    await user.clear(screen.getByLabelText(/^Name/))
    await user.type(screen.getByLabelText(/^Name/), 'Updated UI')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Design berhasil diperbarui.')
    expect(designsApi.update).toHaveBeenCalledWith('design-a', { name: 'Updated UI' })
  })

  it('shows an edit API error and returns to the list on cancel', async () => {
    const user = userEvent.setup()
    vi.mocked(designsApi.update).mockRejectedValue(new TypeError('offline'))
    renderEditor('/app/designs/design-a')
    await screen.findByDisplayValue('Premium UI')
    await user.clear(screen.getByLabelText(/^Name/))
    await user.type(screen.getByLabelText(/^Name/), 'Updated UI')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Kembali ke Design List' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Designs' })).toBeInTheDocument())
  })
})
