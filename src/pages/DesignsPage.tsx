import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Badge, Button, EmptyState, ErrorState, Pagination, SearchInput, Table } from '../components/ui'
import { designsApi, type Design, type DesignListParams } from '../lib/api/designs'
import { mapApplicationError } from '../lib/errors/errorMessages'
import './DesignsPage.css'

export const designsQueryKey = ['designs'] as const
const pageSize = 20
type StatusFilter = 'all' | 'active' | 'inactive'
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

export default function DesignsPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])
  const params: DesignListParams = {
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(filter === 'all' ? {} : { isActive: filter === 'active' }),
  }
  const listQuery = useQuery({
    queryKey: [...designsQueryKey, 'list', params],
    queryFn: () => designsApi.list(params),
  })

  const updateSearch = (value: string) => {
    setSearchInput(value)
    setPage(1)
  }
  const setStatusFilter = (value: StatusFilter) => { setFilter(value); setPage(1) }
  const beginCreate = () => navigate('/app/designs/new')

  if (listQuery.isPending) return <section className="designs-page"><p className="designs-page__loading" role="status">Memuat daftar desain...</p></section>
  if (listQuery.isError) {
    const error = mapApplicationError(listQuery.error)
    return <section className="designs-page"><header className="designs-page__heading"><div><h1>Designs</h1><p>Kelola katalog desain untuk proyek Anda.</p></div><Button onClick={beginCreate}>Create Design</Button></header><ErrorState title={error.title} description={error.description} onRetry={() => { void listQuery.refetch() }} /></section>
  }

  const { data, meta } = listQuery.data
  const columns = [
    { key: 'name', header: 'Nama desain', render: (design: Design) => <div className="designs-page__name"><strong>{design.name}</strong><span>{design.description || '—'}</span></div> },
    { key: 'price', header: 'Harga', render: (design: Design) => currency.format(design.price) },
    { key: 'status', header: 'Status', render: (design: Design) => <Badge variant={design.isActive ? 'success' : 'neutral'}>{design.isActive ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <section className="designs-page">
      <header className="designs-page__heading"><div><h1>Designs</h1><p>Kelola katalog desain untuk proyek Anda.</p></div><Button onClick={beginCreate}>Create Design</Button></header>
      <div className="designs-page__toolbar">
        <SearchInput value={searchInput} onChange={updateSearch} placeholder="Cari nama atau deskripsi desain..." aria-label="Cari desain" />
        <label className="designs-page__filter">Status<select value={filter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter status"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>
      <div aria-live="polite" className="designs-page__summary">{meta.total} desain · Halaman {meta.page} dari {meta.totalPages}</div>
      <Table columns={columns} rows={data} getRowKey={design => design.id} caption="Daftar desain" loading={listQuery.isFetching} emptyState={<EmptyState title={search ? 'Tidak ada hasil pencarian' : filter === 'all' ? 'Belum ada desain' : `Tidak ada desain ${filter === 'active' ? 'Active' : 'Inactive'}`} description={search ? 'Coba kata kunci lain.' : 'Tambahkan desain untuk mulai mengelola katalog.'} action={!search && filter === 'all' ? <Button onClick={beginCreate}>Create Design</Button> : undefined} />} />
      <footer className="designs-page__pagination"><span>Menampilkan {meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)} dari {meta.total}</span>{meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}</footer>
    </section>
  )
}
