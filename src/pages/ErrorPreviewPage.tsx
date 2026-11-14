import { useState } from 'react'
import { ApiError } from '../lib/api/client'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { ApplicationErrorView } from '../components/errors/ApplicationErrorView'

const errorSamples = [
  {
    id: '400', label: 'Bad Request', status: '400', code: 'REQUEST_ERROR',
    error: new ApiError(400, 'Invalid calculation request', { error: { code: 'REQUEST_ERROR', message: 'Invalid calculation request' } }, 'REQUEST_ERROR'),
  },
  {
    id: '401', label: 'Unauthorized', status: '401', code: 'UNAUTHORIZED',
    error: new ApiError(401, 'Authentication required', { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 'UNAUTHORIZED'),
  },
  {
    id: '403', label: 'Forbidden', status: '403', code: 'PERMISSION_DENIED',
    error: new ApiError(403, 'Permission denied', { error: { code: 'PERMISSION_DENIED', message: 'Permission denied' } }, 'PERMISSION_DENIED'),
  },
  {
    id: '404', label: 'Not Found', status: '404', code: 'PROJECT_NOT_FOUND',
    error: new ApiError(404, 'Project not found', { error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } }, 'PROJECT_NOT_FOUND'),
  },
  {
    id: '409', label: 'Conflict', status: '409', code: 'DRAFT_QUOTATION_EXISTS',
    error: new ApiError(409, 'A draft quotation already exists for this project', { error: { code: 'DRAFT_QUOTATION_EXISTS', message: 'A draft quotation already exists for this project' } }, 'DRAFT_QUOTATION_EXISTS'),
  },
  {
    id: '422', label: 'Validation Error', status: '422', code: 'VALIDATION_ERROR',
    error: new ApiError(422, 'Validation failed', { error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } }, 'VALIDATION_ERROR'),
  },
  {
    id: '500', label: 'Internal Server Error', status: '500', code: 'INTERNAL_SERVER_ERROR',
    error: new ApiError(500, 'Internal server error', { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } }, 'INTERNAL_SERVER_ERROR'),
  },
  {
    id: 'network', label: 'Network Error', status: 'Network', code: '—',
    error: new TypeError('Failed to fetch'),
  },
  {
    id: 'unknown', label: 'Unknown Error', status: '—', code: 'UNKNOWN',
    error: new Error('Internal debugging details should stay hidden from users.'),
  },
] as const

function ErrorPreviewPage() {
  const [selectedId, setSelectedId] = useState<string>(errorSamples[0].id)
  const [retryCount, setRetryCount] = useState(0)
  const selected = errorSamples.find((sample) => sample.id === selectedId) ?? errorSamples[0]
  const presentation = mapApplicationError(selected.error)

  return (
    <main className="min-h-screen bg-background px-page-mobile py-8 sm:px-page sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-brand-primary">Development Preview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Pratinjau error aplikasi</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">
            Pilih kondisi untuk melihat komponen error yang digunakan aplikasi. Pesan dan tampilannya berasal dari error mapping produksi.
          </p>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Pilih jenis error" className="rounded-card border border-border bg-surface p-4 shadow-sm">
            <h2 className="mb-3 px-2 text-sm font-semibold text-text-primary">Jenis error</h2>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
              {errorSamples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  aria-pressed={selected.id === sample.id}
                  onClick={() => {
                    setSelectedId(sample.id)
                    setRetryCount(0)
                  }}
                  className={`flex min-h-11 items-center justify-between gap-2 rounded-medium border px-3 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${selected.id === sample.id ? 'border-brand-primary bg-brand-primary-subtle font-semibold text-brand-primary' : 'border-transparent text-text-secondary hover:border-border hover:bg-background'}`}
                >
                  <span>{sample.label}</span>
                  <span className="shrink-0 font-mono text-xs">{sample.status}</span>
                </button>
              ))}
            </div>
          </nav>

          <section aria-label="Area preview" className="min-w-0 rounded-card border border-border bg-surface p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Komponen yang dipilih</p>
                <h2 className="mt-1 text-lg font-semibold text-text-primary">{selected.label}</h2>
              </div>
              <span className="rounded-full bg-background px-3 py-1 font-mono text-xs text-text-secondary">
                {selected.status}{selected.code !== '—' ? ` · ${selected.code}` : ''}
              </span>
            </div>

            <div className="flex min-h-[360px] items-center justify-center rounded-large border border-border bg-background p-4 sm:min-h-[440px] sm:p-8">
              <div className="w-full">
                <ApplicationErrorView
                  error={presentation}
                  onRetry={() => setRetryCount((count) => count + 1)}
                  fieldErrors={selected.id === '422' ? [
                    { label: 'Nama', value: '', message: 'Nama wajib diisi' },
                    { label: 'Email', value: 'dewi@contoh', message: 'Format email tidak valid' },
                  ] : undefined}
                />
              </div>
            </div>

            <p aria-live="polite" className="mt-4 text-right text-xs text-text-muted">
              Percobaan ulang: {retryCount}
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

export default ErrorPreviewPage
