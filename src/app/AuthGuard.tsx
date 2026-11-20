import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { ErrorState } from '../components/ui/display'

export const currentUserQueryKey = ['auth', 'current-user'] as const

export function AuthGuard() {
  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: authApi.getCurrentUser,
  })

  if (currentUserQuery.isPending) {
    return <p role="status" aria-live="polite">Memeriksa sesi...</p>
  }

  if (currentUserQuery.isError) {
    if (currentUserQuery.error instanceof ApiError && currentUserQuery.error.status === 401) {
      return <Navigate to="/login" replace />
    }

    const error = mapApplicationError(currentUserQuery.error)
    return (
      <main>
        <ErrorState
          title={error.title}
          description={error.description}
          onRetry={() => { void currentUserQuery.refetch() }}
        />
      </main>
    )
  }

  return <Outlet />
}
