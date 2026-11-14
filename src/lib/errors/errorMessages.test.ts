import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { mapApplicationError } from './errorMessages'

describe('mapApplicationError', () => {
  it.each([
    [400, 'inline', 'Permintaan tidak valid'],
    [401, 'access-session', 'Sesi Anda telah berakhir'],
    [403, 'access-denied', 'Akses ditolak'],
    [404, 'not-found', 'Data tidak ditemukan'],
    [409, 'conflict', 'Terjadi konflik data'],
    [422, 'inline', 'Data tidak dapat diproses'],
    [500, 'server', 'Terjadi kesalahan di server'],
  ] as const)('maps HTTP %i to a friendly fallback', (status, kind, title) => {
    const originalError = new ApiError(status, 'private server details', null)
    const presentation = mapApplicationError(originalError)

    expect(presentation).toMatchObject({ status, kind, title, originalError })
    expect(presentation.description).not.toContain('private server details')
  })

  it('prioritizes a recognized backend error code over its status fallback', () => {
    const presentation = mapApplicationError(new ApiError(
      401,
      'Authentication failed',
      { error: { code: 'INVALID_CREDENTIALS', message: 'Email atau password salah' } },
    ))

    expect(presentation).toMatchObject({
      kind: 'inline',
      status: 401,
      code: 'INVALID_CREDENTIALS',
      title: 'Email atau kata sandi salah',
    })
  })

  it('uses the status fallback for an unknown backend code while retaining debug details', () => {
    const originalError = new ApiError(
      409,
      'private details',
      { error: { code: 'NEW_INTERNAL_CODE', message: 'private details' } },
    )
    const presentation = mapApplicationError(originalError)

    expect(presentation).toMatchObject({
      kind: 'conflict',
      code: 'NEW_INTERNAL_CODE',
      originalError,
      title: 'Terjadi konflik data',
    })
    expect(presentation.description).not.toContain('private details')
  })

  it('maps recognized backend domain codes to task-specific messages', () => {
    expect(mapApplicationError(new ApiError(409, '', null, 'DRAFT_QUOTATION_EXISTS'))).toMatchObject({
      kind: 'conflict',
      title: 'Draft penawaran sudah tersedia',
    })
    expect(mapApplicationError(new ApiError(422, '', null, 'QUOTATION_INVALID'))).toMatchObject({
      kind: 'inline',
      title: 'Penawaran belum dapat dibuat',
    })
  })

  it('maps fetch network failures and hides their technical messages', () => {
    const presentation = mapApplicationError(new TypeError('Failed to fetch'))

    expect(presentation).toMatchObject({
      kind: 'network',
      title: 'Tidak dapat terhubung ke server',
      description: 'Periksa koneksi internet Anda, lalu coba kembali.',
    })
    expect(presentation.description).not.toContain('Failed to fetch')
  })

  it('provides a safe fallback for unknown errors without showing the original message', () => {
    const presentation = mapApplicationError(new Error('database password leaked'))

    expect(presentation).toMatchObject({
      kind: 'unknown',
      title: 'Terjadi kesalahan',
      description: 'Terjadi sesuatu yang tidak terduga. Silakan coba lagi.',
    })
    expect(presentation.originalError).toBeInstanceOf(Error)
    expect(presentation.description).not.toContain('database password')
  })
})
