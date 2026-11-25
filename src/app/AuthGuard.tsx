import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router'
import { authApi } from '../lib/api/auth'
import { ApiError } from '../lib/api/client'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { ErrorState } from '../components/ui/display'

export const currentUserQueryKey = ['auth', 'current-user'] as const

export function AuthGuard() {
  const queryClient = useQueryClient()
  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: authApi.getCurrentUser,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  })

  const isUnauthorized = currentUserQuery.error instanceof ApiError && currentUserQuery.error.status === 401
  useEffect(() => {
    if (isUnauthorized) queryClient.removeQueries({ queryKey: currentUserQueryKey, exact: true })
  }, [isUnauthorized, queryClient])

  if (currentUserQuery.isPending || currentUserQuery.isFetching) {
    return <p role="status" aria-live="polite">Memeriksa sesi...</p>
  }

  if (currentUserQuery.isError) {
    if (isUnauthorized) return <Navigate to="/login" replace />

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
