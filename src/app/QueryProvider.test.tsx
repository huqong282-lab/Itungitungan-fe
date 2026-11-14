import { useMutation, useQuery } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import QueryProvider from './QueryProvider'
import { queryClient } from '../lib/queryClient'

afterEach(() => {
  cleanup()
  queryClient.clear()
  vi.restoreAllMocks()
})

function QueryResult() {
  const query = useQuery({
    queryKey: ['query-provider-test'],
    queryFn: async () => 'Query data loaded',
  })

  if (query.isPending) return <p>Loading</p>
  if (query.isError) return <p>{query.error.message}</p>

  return <p>{query.data}</p>
}

function QueryErrorResult() {
  const query = useQuery({
    queryKey: ['query-provider-error-test'],
    queryFn: async () => {
      throw new Error('Query failed')
    },
    retry: false,
  })

  if (query.isError) return <p>{query.error.message}</p>
  return <p>Loading</p>
}

describe('QueryProvider', () => {
  it('provides TanStack Query and renders data returned by useQuery', async () => {
    render(
      <QueryProvider>
        <QueryResult />
      </QueryProvider>,
    )

    expect(await screen.findByText('Query data loaded')).toBeInTheDocument()
  })

  it('uses the configured default query and mutation options', () => {
    expect(queryClient.getDefaultOptions()).toMatchObject({
      queries: {
        staleTime: 60_000,
        gcTime: 300_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    })
  })

  it('logs query errors globally while keeping the error available to the component', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <QueryProvider>
        <QueryErrorResult />
      </QueryProvider>,
    )

    expect(await screen.findByText('Query failed')).toBeInTheDocument()
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('TanStack Query error:', expect.any(Error))
    })
  })

  it('logs mutation errors globally without preventing the app from rendering', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function MutationErrorResult() {
      const mutation = useMutation({
        mutationFn: async () => {
          throw new Error('Mutation failed')
        },
      })

      return (
        <div>
          <button onClick={() => mutation.mutate()}>Run mutation</button>
          {mutation.isError && <p>{mutation.error.message}</p>}
        </div>
      )
    }

    const user = userEvent.setup()
    render(
      <QueryProvider>
        <MutationErrorResult />
      </QueryProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Run mutation' }))
    expect(await screen.findByText('Mutation failed')).toBeInTheDocument()
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('TanStack Query error:', expect.any(Error))
    })
  })
})
