import type { ErrorPresentation } from '../../lib/errors/errorMessages'
import {
  AccessError,
  ConflictAlert,
  InlineFormError,
  NotFoundError,
  ServerNetworkError,
  UnknownError,
} from './ErrorComponents'

export type ApplicationErrorViewProps = {
  error: ErrorPresentation
  onRetry?: () => void
  fieldErrors?: Array<{ label: string; value: string; message: string }>
}

export function ApplicationErrorView({ error, onRetry, fieldErrors }: ApplicationErrorViewProps) {
  switch (error.kind) {
    case 'inline':
      return <InlineFormError error={error} fields={fieldErrors} />
    case 'access-session':
    case 'access-denied':
      return <AccessError error={error} onRetry={onRetry} />
    case 'not-found':
      return <NotFoundError error={error} onRetry={onRetry} />
    case 'conflict':
      return <ConflictAlert error={error} onRetry={onRetry} />
    case 'server':
    case 'network':
      return <ServerNetworkError error={error} onRetry={onRetry} />
    case 'unknown':
      return <UnknownError error={error} onRetry={onRetry} />
  }
}
