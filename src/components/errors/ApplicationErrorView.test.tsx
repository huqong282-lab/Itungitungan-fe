import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api/client'
import { mapApplicationError } from '../../lib/errors/errorMessages'
import { ApplicationErrorView } from './ApplicationErrorView'

afterEach(cleanup)

describe('ApplicationErrorView', () => {
  it('shows friendly error text without leaking backend details', () => {
    const error = mapApplicationError(new ApiError(500, 'secret stack trace', {
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'secret stack trace' },
    }))

    render(<ApplicationErrorView error={error} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Terjadi kesalahan di server' })).toBeInTheDocument()
    expect(screen.queryByText(/secret stack trace/)).not.toBeInTheDocument()
  })

  it('renders different reusable components for access, not found, and conflict errors', () => {
    const { rerender } = render(<ApplicationErrorView error={mapApplicationError(new ApiError(401, '', null))} />)
    expect(screen.getByRole('link', { name: 'Masuk kembali' })).toHaveAttribute('href', '/login')

    rerender(<ApplicationErrorView error={mapApplicationError(new ApiError(404, '', null))} />)
    expect(screen.getByRole('heading', { name: 'Data tidak ditemukan' })).toBeInTheDocument()

    rerender(<ApplicationErrorView error={mapApplicationError(new ApiError(409, '', null))} />)
    expect(screen.getByRole('heading', { name: 'Terjadi konflik data' })).toBeInTheDocument()
  })

  it('renders field error details for validation when the caller supplies them', () => {
    render(
      <ApplicationErrorView
        error={mapApplicationError(new ApiError(422, '', null))}
        fieldErrors={[{ label: 'Email', value: 'invalid', message: 'Format email tidak valid' }]}
      />,
    )

    expect(screen.getByRole('textbox', { name: /Email/ })).toHaveValue('invalid')
    expect(screen.getByText('Format email tidak valid')).toBeInTheDocument()
  })

  it('calls the retry action when the caller supplies one', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()
    render(<ApplicationErrorView error={mapApplicationError(new ApiError(500, '', null))} onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('renders safely when the source error has no message', () => {
    render(<ApplicationErrorView error={mapApplicationError(new ApiError(400, '', null))} />)

    expect(screen.getByText('Periksa kembali data yang dimasukkan, lalu coba lagi.')).toBeInTheDocument()
  })
})
