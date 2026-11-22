import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { featuresApi, type FeatureOption } from '../lib/api/features'
import FeatureOptionEditor from './FeatureOptionEditor'

vi.mock('../lib/api/features', () => ({ featuresApi: {
  createOption: vi.fn(), updateOption: vi.fn(),
} }))

const optionA: FeatureOption = { id: 'option-a', name: 'Provider', selectionType: 'SINGLE', values: [] }
const optionB: FeatureOption = { id: 'option-b', name: 'Region', selectionType: 'MULTIPLE', values: [] }

function Harness({ initialOption = null }: { initialOption?: FeatureOption | null }) {
  const [option, setOption] = useState<FeatureOption | null>(initialOption)
  const [open, setOpen] = useState(true)
  const [saved, setSaved] = useState('')
  return <>
    <button type="button" onClick={() => { setOption(null); setSaved(''); setOpen(true) }}>Create mode</button>
    <button type="button" onClick={() => { setOption(optionA); setSaved(''); setOpen(true) }}>Edit A</button>
    <button type="button" onClick={() => { setOption(optionB); setSaved(''); setOpen(true) }}>Edit B</button>
    {saved && <p role="status">{saved}</p>}
    {open && <FeatureOptionEditor key={option?.id ?? 'create'} featureId="feature-a" option={option} onClose={() => setOpen(false)} onSaved={message => { setSaved(message); setOpen(false) }} />}
  </>
}

function renderEditor(option: FeatureOption | null = null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><Harness initialOption={option} /></QueryClientProvider>)
}

describe('FeatureOptionEditor', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(featuresApi.createOption).mockResolvedValue({ data: { id: 'option-new', name: 'Gateway', selectionType: 'SINGLE' } })
    vi.mocked(featuresApi.updateOption).mockResolvedValue({ data: { id: 'option-a', name: 'Provider', selectionType: 'MULTIPLE' } })
  })

  it('creates an option with SINGLE selection and shows success feedback', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.type(screen.getByLabelText(/^Name/), 'Gateway')
    await user.selectOptions(screen.getByLabelText(/^Selection Type/), 'SINGLE')
    await user.click(screen.getByRole('button', { name: 'Create Option' }))
    await waitFor(() => expect(featuresApi.createOption).toHaveBeenCalledWith('feature-a', { name: 'Gateway', selectionType: 'SINGLE' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Option berhasil dibuat.')
  })

  it('creates an option with MULTIPLE selection', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.type(screen.getByLabelText(/^Name/), 'Payment methods')
    await user.selectOptions(screen.getByLabelText(/^Selection Type/), 'MULTIPLE')
    await user.click(screen.getByRole('button', { name: 'Create Option' }))
    await waitFor(() => expect(featuresApi.createOption).toHaveBeenCalledWith('feature-a', { name: 'Payment methods', selectionType: 'MULTIPLE' }))
  })

  it('fills edit values and patches only changed fields', async () => {
    const user = userEvent.setup()
    renderEditor(optionA)
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Provider')
    expect(screen.getByLabelText(/^Selection Type/)).toHaveValue('SINGLE')
    await user.selectOptions(screen.getByLabelText(/^Selection Type/), 'MULTIPLE')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(featuresApi.updateOption).toHaveBeenCalledWith('feature-a', 'option-a', { selectionType: 'MULTIPLE' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Option berhasil diperbarui.')
  })

  it('validates required option name and avoids a request', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.click(screen.getByRole('button', { name: 'Create Option' }))
    expect(await screen.findByText('Nama option wajib diisi.')).toBeInTheDocument()
    expect(featuresApi.createOption).not.toHaveBeenCalled()
  })

  it('validates selection type against the supported contract values', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.type(screen.getByLabelText(/^Name/), 'Gateway')
    fireEvent.change(screen.getByLabelText(/^Selection Type/), { target: { value: 'INVALID' } })
    await user.click(screen.getByRole('button', { name: 'Create Option' }))
    expect(await screen.findByText('Pilih selection type.')).toBeInTheDocument()
    expect(featuresApi.createOption).not.toHaveBeenCalled()
  })

  it('disables controls while saving and shows API errors while preserving input', async () => {
    const user = userEvent.setup()
    let rejectRequest: (error: Error) => void = () => {}
    vi.mocked(featuresApi.createOption).mockImplementation(() => new Promise((_, reject) => { rejectRequest = reject }))
    renderEditor()
    const name = screen.getByLabelText(/^Name/)
    await user.type(name, 'Gateway')
    await user.click(screen.getByRole('button', { name: 'Create Option' }))
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    expect(name).toBeDisabled()
    rejectRequest(new TypeError('offline'))
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Gateway')
  })

  it('resets form state when switching between create and different edit options', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.type(screen.getByLabelText(/^Name/), 'Unsubmitted')
    await user.click(screen.getByRole('button', { name: 'Edit A' }))
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Provider')
    expect(screen.getByLabelText(/^Selection Type/)).toHaveValue('SINGLE')
    await user.click(screen.getByRole('button', { name: 'Edit B' }))
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Region')
    expect(screen.getByLabelText(/^Selection Type/)).toHaveValue('MULTIPLE')
    await user.click(screen.getByRole('button', { name: 'Create mode' }))
    expect(screen.getByLabelText(/^Name/)).toHaveValue('')
    expect(screen.getByLabelText(/^Selection Type/)).toHaveValue('SINGLE')
  })
})
