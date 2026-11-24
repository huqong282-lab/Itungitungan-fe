import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { featuresApi, type FeatureOption } from '../lib/api/features'
import FeatureValueEditor from './FeatureValueEditor'

vi.mock('../lib/api/features', () => ({ featuresApi: {
  createOptionValue: vi.fn(), updateOptionValue: vi.fn(),
} }))

const option: FeatureOption = { id: 'option-provider', name: 'Provider', selectionType: 'SINGLE', values: [
  { id: 'value-midtrans', label: 'Midtrans', estimatedHours: 8, isDefault: true, isActive: true },
] }

function renderEditor(value: FeatureOption['values'][number] | null = null, selectedOption = option) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}><FeatureValueEditor featureId="feature-payment" option={selectedOption} value={value} onClose={() => {}} onSaved={vi.fn()} /></QueryClientProvider>)
}

describe('FeatureValueEditor', () => {
  afterEach(cleanup)
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(featuresApi.createOptionValue).mockResolvedValue({ data: { id: 'value-new', featureOptionId: option.id, label: 'Xendit', estimatedHours: 10, isDefault: false, isActive: true } })
    vi.mocked(featuresApi.updateOptionValue).mockResolvedValue({ data: { id: 'value-midtrans', featureOptionId: option.id, label: 'Midtrans', estimatedHours: 8, isDefault: false, isActive: true } })
  })

  it('renders a value editor associated with its option and creates a value', async () => {
    const user = userEvent.setup()
    renderEditor()
    expect(screen.getByText('Kelola value untuk option “Provider”.')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Label/), 'Xendit')
    await user.clear(screen.getByLabelText(/^Estimated Hours/))
    await user.type(screen.getByLabelText(/^Estimated Hours/), '10')
    await user.click(screen.getByRole('button', { name: 'Create Value' }))
    await waitFor(() => expect(featuresApi.createOptionValue).toHaveBeenCalledWith('feature-payment', 'option-provider', { label: 'Xendit', estimatedHours: 10, isDefault: false, isActive: true }))
  })

  it('validates required label and nonnegative integer estimated hours', async () => {
    const user = userEvent.setup()
    renderEditor()
    await user.click(screen.getByRole('button', { name: 'Create Value' }))
    expect(await screen.findByText('Label wajib diisi.')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/^Label/), 'Bad value')
    await user.clear(screen.getByLabelText(/^Estimated Hours/))
    await user.type(screen.getByLabelText(/^Estimated Hours/), '-1')
    await user.click(screen.getByRole('button', { name: 'Create Value' }))
    expect(await screen.findByText('Nilai harus 0 atau lebih.')).toBeInTheDocument()
    expect(featuresApi.createOptionValue).not.toHaveBeenCalled()
  })

  it('patches only changed fields including active state', async () => {
    const user = userEvent.setup()
    renderEditor(option.values[0])
    expect(screen.getByLabelText(/^Label/)).toHaveValue('Midtrans')
    expect(screen.getByLabelText(/^Estimated Hours/)).toHaveValue(8)
    await user.clear(screen.getByLabelText(/^Label/))
    await user.type(screen.getByLabelText(/^Label/), 'Midtrans Core')
    await user.click(screen.getByRole('checkbox', { name: /Active/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(featuresApi.updateOptionValue).toHaveBeenCalledWith('feature-payment', 'option-provider', 'value-midtrans', { label: 'Midtrans Core', isActive: false }))
  })

  it('updates estimated hours and can make an existing value the option default', async () => {
    const user = userEvent.setup()
    const optionWithTwoValues: FeatureOption = { ...option, values: [...option.values, { id: 'value-xendit', label: 'Xendit', estimatedHours: 10, isDefault: false, isActive: true }] }
    renderEditor(optionWithTwoValues.values[1], optionWithTwoValues)
    await user.clear(screen.getByLabelText(/^Estimated Hours/))
    await user.type(screen.getByLabelText(/^Estimated Hours/), '12')
    await user.click(screen.getByRole('checkbox', { name: /Default/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(featuresApi.updateOptionValue).toHaveBeenCalledWith('feature-payment', 'option-provider', 'value-midtrans', { isDefault: false }))
    expect(featuresApi.updateOptionValue).toHaveBeenCalledWith('feature-payment', 'option-provider', 'value-xendit', { estimatedHours: 12, isDefault: true })
  })

  it('shows a saving state and disables fields during a pending request', async () => {
    const user = userEvent.setup()
    vi.mocked(featuresApi.createOptionValue).mockReturnValue(new Promise(() => {}))
    renderEditor()
    await user.type(screen.getByLabelText(/^Label/), 'Stripe')
    await user.click(screen.getByRole('button', { name: 'Create Value' }))
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    expect(screen.getByLabelText(/^Label/)).toBeDisabled()
  })

  it('clears the existing option default before setting a different value as default', async () => {
    const user = userEvent.setup()
    renderEditor(null)
    await user.type(screen.getByLabelText(/^Label/), 'Xendit')
    await user.click(screen.getByRole('checkbox', { name: /Default/ }))
    await user.click(screen.getByRole('button', { name: 'Create Value' }))
    await waitFor(() => expect(featuresApi.updateOptionValue).toHaveBeenCalledWith('feature-payment', 'option-provider', 'value-midtrans', { isDefault: false }))
    expect(featuresApi.createOptionValue).toHaveBeenCalledWith('feature-payment', 'option-provider', { label: 'Xendit', estimatedHours: 0, isDefault: true, isActive: true })
  })

  it('shows API errors and retains the entered label', async () => {
    const user = userEvent.setup()
    vi.mocked(featuresApi.createOptionValue).mockRejectedValue(new TypeError('offline'))
    renderEditor()
    const label = screen.getByLabelText(/^Label/)
    await user.type(label, 'Stripe')
    await user.click(screen.getByRole('button', { name: 'Create Value' }))
    expect(await screen.findByText('Tidak dapat terhubung ke server')).toBeInTheDocument()
    expect(label).toHaveValue('Stripe')
  })
})
