import { useEffect, useState } from 'react'
import { Badge, EmptyState, ErrorState, Pagination, SearchInput, Table } from '../components/ui'
import { hostingApi, type HostingListParams, type HostingPlan } from '../lib/api/hosting'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { useQuery } from '@tanstack/react-query'
import './HostingPage.css'

export const hostingQueryKey = ['hosting-plans'] as const
const pageSize = 20
type StatusFilter = 'all' | 'active' | 'inactive'
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const billingPeriodLabels: Record<HostingPlan['billingPeriod'], string> = {
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
  ONE_TIME: 'One time',
}

export default function HostingPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const params: HostingListParams = {
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(filter === 'all' ? {} : { isActive: filter === 'active' }),
  }
  const listQuery = useQuery({ queryKey: [...hostingQueryKey, 'list', params], queryFn: () => hostingApi.list(params) })
  const updateSearch = (value: string) => { setSearchInput(value); setPage(1) }
  const updateFilter = (value: StatusFilter) => { setFilter(value); setPage(1) }

  if (listQuery.isPending) return <section className="hosting-page"><header className="hosting-page__heading"><h1>Hosting List</h1><p>Daftar paket hosting Anda.</p></header><p className="hosting-page__loading" role="status">Memuat daftar hosting...</p></section>
  if (listQuery.isError) {
    const error = mapApplicationError(listQuery.error)
    return <section className="hosting-page"><header className="hosting-page__heading"><h1>Hosting List</h1><p>Daftar paket hosting Anda.</p></header><ErrorState title={error.title} description={error.description} onRetry={() => { void listQuery.refetch() }} /></section>
  }

  const { data, meta } = listQuery.data
  const columns = [
    { key: 'provider', header: 'Provider', render: (hosting: HostingPlan) => hosting.provider || '—' },
    { key: 'name', header: 'Plan', render: (hosting: HostingPlan) => hosting.name || '—' },
    { key: 'internalCost', header: 'Internal Cost', render: (hosting: HostingPlan) => currency.format(hosting.internalCost) },
    { key: 'clientPrice', header: 'Client Price', render: (hosting: HostingPlan) => currency.format(hosting.clientPrice) },
    { key: 'billingPeriod', header: 'Billing Period', render: (hosting: HostingPlan) => billingPeriodLabels[hosting.billingPeriod] ?? hosting.billingPeriod },
    { key: 'status', header: 'Status', render: (hosting: HostingPlan) => <Badge variant={hosting.isActive ? 'success' : 'neutral'}>{hosting.isActive ? 'Active' : 'Inactive'}</Badge> },
  ]

  return <section className="hosting-page">
    <header className="hosting-page__heading"><div><h1>Hosting List</h1><p>Daftar paket hosting Anda.</p></div></header>
    <div className="hosting-page__toolbar">
      <SearchInput value={searchInput} onChange={updateSearch} placeholder="Cari provider atau plan..." aria-label="Cari hosting" />
      <label className="hosting-page__filter">Status<select value={filter} onChange={event => updateFilter(event.target.value as StatusFilter)} aria-label="Filter status"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div>
    <div aria-live="polite" className="hosting-page__summary">{meta.total} hosting · Halaman {meta.page} dari {meta.totalPages}</div>
    <Table columns={columns} rows={data} getRowKey={hosting => hosting.id} caption="Daftar hosting" loading={listQuery.isFetching} emptyState={<EmptyState title={search ? 'Tidak ada hasil pencarian' : filter === 'all' ? 'Belum ada hosting' : `Tidak ada hosting ${filter === 'active' ? 'Active' : 'Inactive'}`} description={search ? 'Coba kata kunci lain.' : 'Paket hosting yang Anda miliki akan muncul di sini.'} />} />
    <footer className="hosting-page__pagination"><span>Menampilkan {meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)} dari {meta.total}</span>{meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}</footer>
  </section>
}
