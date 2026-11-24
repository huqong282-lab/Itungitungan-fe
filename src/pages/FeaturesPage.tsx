import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Alert, Badge, Button, EmptyState, ErrorState, Modal, Pagination, SearchInput, Table } from '../components/ui'
import { featuresApi, type FeatureListParams, type FeatureSummary } from '../lib/api/features'
import { mapApplicationError } from '../lib/errors/errorMessages'
import './FeaturesPage.css'

export const featuresQueryKey = ['features'] as const
const pageSize = 20
type StatusFilter = 'all' | 'active' | 'inactive'

export default function FeaturesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [deactivating, setDeactivating] = useState<FeatureSummary | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const message = (location.state as { featureSuccess?: unknown } | null)?.featureSuccess
    if (typeof message !== 'string') return
    setSuccessMessage(message)
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const params: FeatureListParams = {
    page,
    pageSize,
    ...(search ? { search } : {}),
    ...(filter === 'all' ? {} : { isActive: filter === 'active' }),
  }
  const listQuery = useQuery({ queryKey: [...featuresQueryKey, 'list', params], queryFn: () => featuresApi.list(params) })
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => featuresApi.setActive(id, false),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: featuresQueryKey })
      setDeactivating(null)
      setSuccessMessage('Fitur berhasil dinonaktifkan.')
    },
  })

  const beginCreate = () => navigate('/app/features/new')
  const beginEdit = (feature: FeatureSummary) => navigate(`/app/features/${encodeURIComponent(feature.id)}`)
  const setStatusFilter = (value: StatusFilter) => { setFilter(value); setPage(1) }
  const updateSearch = (value: string) => { setSearchInput(value); setPage(1) }

  if (listQuery.isPending) return <section className="features-page"><p className="features-page__loading" role="status">Memuat daftar fitur...</p></section>
  if (listQuery.isError) {
    const error = mapApplicationError(listQuery.error)
    return <section className="features-page"><header className="features-page__heading"><h1>Feature List</h1><p>Kelola katalog fitur untuk proyek Anda.</p></header>{successMessage && <Alert variant="success" title="Berhasil">{successMessage}</Alert>}<ErrorState title={error.title} description={error.description} onRetry={() => { void listQuery.refetch() }} /></section>
  }

  const { data, meta } = listQuery.data
  const deactivateError = deactivateMutation.error ? mapApplicationError(deactivateMutation.error) : null
  const columns = [
    { key: 'name', header: 'Nama fitur', render: (feature: FeatureSummary) => <div className="features-page__name"><strong>{feature.name}</strong><span>{feature.description || '—'}</span></div> },
    { key: 'category', header: 'Kategori', render: (feature: FeatureSummary) => feature.category || '—' },
    { key: 'hours', header: 'Estimasi dasar', render: (feature: FeatureSummary) => `${feature.baseEstimatedHours} jam` },
    { key: 'status', header: 'Status', render: (feature: FeatureSummary) => <Badge variant={feature.isActive ? 'success' : 'neutral'}>{feature.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: 'Aksi', render: (feature: FeatureSummary) => <div className="features-page__row-actions"><Button variant="outline" size="small" onClick={() => beginEdit(feature)}>Edit</Button>{feature.isActive && <Button variant="ghost" size="small" disabled={deactivateMutation.isPending} onClick={() => { setDeactivating(feature); deactivateMutation.reset() }}>Deactivate</Button>}</div> },
  ]

  return (
    <section className="features-page">
      <header className="features-page__heading"><div><h1>Feature List</h1><p>Kelola katalog fitur yang dapat digunakan pada proyek.</p></div><Button onClick={beginCreate}>Tambah fitur</Button></header>
      {successMessage && <Alert variant="success" title="Berhasil">{successMessage}</Alert>}
      <div className="features-page__toolbar">
        <SearchInput value={searchInput} onChange={updateSearch} placeholder="Cari nama, deskripsi, atau kategori..." aria-label="Cari fitur" />
        <label className="features-page__filter">Status<select value={filter} onChange={event => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filter status"><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
      </div>
      <div aria-live="polite" className="features-page__summary">{meta.total} fitur · Halaman {meta.page} dari {meta.totalPages}</div>
      <Table columns={columns} rows={data} getRowKey={feature => feature.id} caption="Daftar fitur" loading={listQuery.isFetching} emptyState={<EmptyState title={search ? 'Tidak ada hasil pencarian' : filter === 'all' ? 'Belum ada fitur' : `Tidak ada fitur ${filter === 'active' ? 'Active' : 'Inactive'}`} description={search ? 'Coba kata kunci lain.' : 'Tambahkan fitur untuk mulai mengelola katalog.'} action={!search && filter === 'all' ? <Button onClick={beginCreate}>Tambah fitur</Button> : undefined} />} />
      <footer className="features-page__pagination"><span>Menampilkan {meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.total)} dari {meta.total}</span>{meta.totalPages > 1 && <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />}</footer>

      <Modal open={Boolean(deactivating)} onClose={() => { if (!deactivateMutation.isPending) setDeactivating(null) }} title="Nonaktifkan fitur?" description={deactivating?.name} footer={<><Button variant="outline" disabled={deactivateMutation.isPending} onClick={() => setDeactivating(null)}>Batal</Button><Button variant="danger" loading={deactivateMutation.isPending} onClick={() => deactivating && deactivateMutation.mutate(deactivating.id)}>Deactivate</Button></>}>
        <p>Fitur ini tidak akan tersedia untuk proyek baru. Data proyek yang sudah menggunakannya tetap tersimpan.</p>
        {deactivateError && <div role="alert" className="features-page__form-error"><strong>{deactivateError.title}</strong><span>{deactivateError.description}</span></div>}
      </Modal>
    </section>
  )
}
