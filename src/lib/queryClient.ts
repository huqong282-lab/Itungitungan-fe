import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

function logQueryError(error: Error) {
  if (import.meta.env.DEV) {
    console.error('TanStack Query error:', error)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: logQueryError,
  }),
  mutationCache: new MutationCache({
    onError: logQueryError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
})
