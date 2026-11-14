import {
  AlertCircle,
  ArrowLeft,
  CircleHelp,
  FileWarning,
  RefreshCw,
  SearchX,
  ServerCrash,
  ShieldAlert,
  ShieldX,
  WifiOff,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ErrorPresentation } from '../../lib/errors/errorMessages'

type ErrorViewProps = {
  error: ErrorPresentation
  onRetry?: () => void
  children?: ReactNode
}

type ErrorField = { label: string; value: string; message: string }

type InlineFormErrorProps = ErrorViewProps & {
  fields?: ErrorField[]
}

function StatusMeta({ error }: { error: ErrorPresentation }) {
  if (error.status === undefined) return null

  return (
    <p className="mt-3 font-mono text-xs text-text-muted" aria-label={`HTTP ${error.status}`}>
      HTTP {error.status}
    </p>
  )
}

function RetryButton({ onRetry, children = 'Coba lagi' }: { onRetry?: () => void; children?: ReactNode }) {
  if (!onRetry) return null

  return (
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-medium bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
    >
      <RefreshCw aria-hidden="true" size={16} />
      {children}
    </button>
  )
}

export function InlineFormError({ error, fields, children }: InlineFormErrorProps) {
  const validation = error.status === 422 || error.code === 'VALIDATION_ERROR'

  return (
    <section
      role="alert"
      className={`rounded-large border border-l-4 p-4 shadow-sm ${validation ? 'border-error-border border-l-error bg-error-subtle' : 'border-warning-border border-l-warning bg-warning-subtle'}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle aria-hidden="true" className={validation ? 'mt-0.5 shrink-0 text-error' : 'mt-0.5 shrink-0 text-warning'} size={20} />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-text-primary">{error.title}</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{error.description}</p>
          {fields?.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.label} className="block text-sm font-medium text-text-primary">
                  {field.label}
                  <input
                    readOnly
                    aria-invalid="true"
                    value={field.value}
                    className="mt-1 block min-h-11 w-full rounded-medium border border-error px-3 py-2 font-normal text-text-primary outline-none"
                  />
                  <span className="mt-1 block text-xs font-medium text-error">{field.message}</span>
                </label>
              ))}
            </div>
          ) : null}
          {children}
          <StatusMeta error={error} />
        </div>
      </div>
    </section>
  )
}

export function AccessError({ error, onRetry }: ErrorViewProps) {
  const sessionExpired = error.kind === 'access-session'

  return sessionExpired ? (
    <section role="alert" className="mx-auto w-full max-w-lg rounded-large border border-border bg-surface-elevated p-6 shadow-popover">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-warning-subtle text-warning">
          <ShieldAlert aria-hidden="true" size={22} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{error.title}</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">{error.description}</p>
          <StatusMeta error={error} />
          <a href="/login" className="mt-5 inline-flex min-h-10 items-center justify-center rounded-medium bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
            Masuk kembali
          </a>
        </div>
      </div>
    </section>
  ) : (
    <section role="alert" className="mx-auto flex w-full max-w-xl flex-col items-center rounded-large border border-border bg-surface p-7 text-center shadow-sm sm:p-10">
      <span className="grid size-14 place-items-center rounded-full bg-error-subtle text-error">
        <ShieldX aria-hidden="true" size={28} />
      </span>
      <p className="mt-4 font-mono text-5xl font-bold tracking-tight text-error">{error.status ?? '403'}</p>
      <h2 className="mt-3 text-xl font-semibold text-text-primary">{error.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{error.description}</p>
      <StatusMeta error={error} />
      <a href="/app" className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-medium border border-border-strong px-4 py-2 text-sm font-semibold text-text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
        <ArrowLeft aria-hidden="true" size={16} />
        Kembali ke daftar
      </a>
      {onRetry ? <div className="mt-3"><RetryButton onRetry={onRetry} /></div> : null}
    </section>
  )
}

export function NotFoundError({ error, onRetry }: ErrorViewProps) {
  return (
    <section role="alert" className="mx-auto flex w-full max-w-xl flex-col items-center rounded-large border border-border bg-surface p-7 text-center sm:p-10">
      <SearchX aria-hidden="true" className="text-warning" size={36} />
      <p className="mt-3 font-mono text-5xl font-bold tracking-tight text-warning">{error.status ?? '404'}</p>
      <h2 className="mt-3 text-xl font-semibold text-text-primary">{error.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{error.description}</p>
      <StatusMeta error={error} />
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/app" className="inline-flex min-h-10 items-center gap-2 rounded-medium border border-border-strong px-4 py-2 text-sm font-semibold text-text-primary hover:bg-background">
          <ArrowLeft aria-hidden="true" size={16} />
          Kembali ke daftar
        </a>
        <RetryButton onRetry={onRetry} />
      </div>
    </section>
  )
}

export function ConflictAlert({ error, onRetry }: ErrorViewProps) {
  return (
    <section role="alert" className="rounded-large border border-l-4 border-warning-border border-l-warning bg-warning-subtle p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <FileWarning aria-hidden="true" className="mt-0.5 shrink-0 text-warning" size={20} />
        <div className="flex-1">
          <h2 className="font-semibold text-text-primary">{error.title}</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{error.description}</p>
          <StatusMeta error={error} />
          <div className="mt-4"><RetryButton onRetry={onRetry} /></div>
        </div>
      </div>
    </section>
  )
}

export function ServerNetworkError({ error, onRetry }: ErrorViewProps) {
  const network = error.kind === 'network'
  const Icon = network ? WifiOff : ServerCrash

  return (
    <section role="alert" className="mx-auto flex w-full max-w-xl flex-col items-center rounded-large border border-border bg-surface p-7 text-center sm:p-10">
      <span className="grid size-14 place-items-center rounded-full bg-error-subtle text-error">
        <Icon aria-hidden="true" size={28} />
      </span>
      {error.status !== undefined ? <p className="mt-4 font-mono text-5xl font-bold tracking-tight text-error">{error.status}</p> : null}
      <h2 className="mt-4 text-xl font-semibold text-text-primary">{error.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{error.description}</p>
      <StatusMeta error={error} />
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <RetryButton onRetry={onRetry} />
        <a href="/app" className="inline-flex min-h-10 items-center gap-2 rounded-medium border border-border-strong px-4 py-2 text-sm font-semibold text-text-primary hover:bg-background">
          <ArrowLeft aria-hidden="true" size={16} />
          Kembali ke daftar
        </a>
      </div>
    </section>
  )
}

export function UnknownError({ error, onRetry }: ErrorViewProps) {
  return (
    <section role="alert" className="mx-auto flex w-full max-w-xl flex-col items-center rounded-large border border-border bg-surface p-7 text-center sm:p-10">
      <CircleHelp aria-hidden="true" className="text-text-muted" size={36} />
      <h2 className="mt-4 text-xl font-semibold text-text-primary">{error.title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{error.description}</p>
      <div className="mt-6"><RetryButton onRetry={onRetry} /></div>
    </section>
  )
}
