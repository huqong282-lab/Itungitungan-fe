import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import { Alert, Button, ErrorState, FormField, Input, Textarea } from '../components/ui'
import { designsApi, type Design, type DesignRequest } from '../lib/api/designs'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { designsQueryKey } from './DesignsPage'
import './DesignEditorPage.css'

const designSchema = z.object({
  name: z.string().trim().min(1, 'Nama design wajib diisi.'),
  description: z.string(),
  price: z.number({ error: 'Masukkan harga sebagai bilangan bulat 0 atau lebih.' }).finite().safe().int('Harga harus berupa bilangan bulat.').min(0, 'Harga tidak boleh kurang dari 0.'),
})
type DesignFormValues = z.infer<typeof designSchema>

function toRequest(values: DesignFormValues): DesignRequest {
  return { name: values.name.trim(), description: values.description.trim() || null, price: values.price }
}

function toFormValues(design: Design): DesignFormValues {
  return { name: design.name, description: design.description ?? '', price: design.price }
}

export default function DesignEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { designId } = useParams<{ designId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const originalValues = useRef<DesignFormValues | null>(null)
  const form = useForm<DesignFormValues>({
    resolver: zodResolver(designSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { name: '', description: '', price: 0 },
  })

  const detailQuery = useQuery({
    queryKey: [...designsQueryKey, 'detail', designId],
    queryFn: () => designsApi.get(designId!),
    enabled: mode === 'edit' && Boolean(designId),
  })
  const design = detailQuery.data?.data
  useEffect(() => {
    if (mode !== 'edit' || !design || design.id !== designId) return
    const values = toFormValues(design)
    originalValues.current = values
    form.reset(values)
  }, [design, designId, form, mode])

  const mutation = useMutation({
    mutationFn: (input: DesignRequest | { id: string; body: Partial<DesignRequest> }) =>
      'id' in input ? designsApi.update(input.id, input.body) : designsApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designsQueryKey })
      navigate('/app/designs', {
        replace: true,
        state: { designSuccess: mode === 'create' ? 'Design berhasil dibuat.' : 'Design berhasil diperbarui.' },
      })
    },
  })

  const submit = form.handleSubmit(values => {
    const body = toRequest(values)
    if (mode === 'create') {
      mutation.mutate(body)
      return
    }
    if (!designId || !originalValues.current) return
    const initial = toRequest(originalValues.current)
    const update: Partial<DesignRequest> = {}
    if (body.name !== initial.name) update.name = body.name
    if (body.description !== initial.description) update.description = body.description
    if (body.price !== initial.price) update.price = body.price
    if (Object.keys(update).length === 0) {
      navigate('/app/designs', { replace: true, state: { designSuccess: 'Tidak ada perubahan pada design.' } })
      return
    }
    mutation.mutate({ id: designId, body: update })
  })

  if (mode === 'edit' && detailQuery.isPending) return <section className="design-editor"><p className="design-editor__loading" role="status">Memuat data design...</p></section>
  if (mode === 'edit' && detailQuery.isError) {
    const error = mapApplicationError(detailQuery.error)
    return <section className="design-editor"><header className="design-editor__heading"><h1>Edit Design</h1></header><ErrorState title={error.title} description={error.description} onRetry={() => { void detailQuery.refetch() }} /><Button variant="outline" onClick={() => navigate('/app/designs')}>Kembali ke Design List</Button></section>
  }
  if (mode === 'edit' && (!design || design.id !== designId)) {
    return <section className="design-editor"><header className="design-editor__heading"><h1>Edit Design</h1></header><ErrorState title="Data design tidak tersedia" description="Muat ulang daftar design dan pilih design yang ingin diedit." /><Button variant="outline" onClick={() => navigate('/app/designs')}>Kembali ke Design List</Button></section>
  }

  const submitError = mutation.error ? mapApplicationError(mutation.error) : null
  return (
    <section className="design-editor">
      <header className="design-editor__heading"><h1>{mode === 'create' ? 'Create Design' : 'Edit Design'}</h1><p>{mode === 'create' ? 'Tambahkan design ke katalog Anda.' : 'Perbarui informasi design pada katalog Anda.'}</p></header>
      <form className="design-editor__form" noValidate onSubmit={submit}>
        {submitError && <Alert variant="error" title={submitError.title}>{submitError.description}</Alert>}
        <FormField label="Name" required error={form.formState.errors.name?.message}><Input autoFocus disabled={mutation.isPending} {...form.register('name')} /></FormField>
        <FormField label="Description" error={form.formState.errors.description?.message}><Textarea rows={4} disabled={mutation.isPending} {...form.register('description')} /></FormField>
        <FormField label="Price" required hint="Masukkan bilangan bulat 0 atau lebih." error={form.formState.errors.price?.message}><Input type="number" min={0} step={1} disabled={mutation.isPending} {...form.register('price', { valueAsNumber: true })} /></FormField>
        <div className="design-editor__actions"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => navigate('/app/designs')}>Kembali ke Design List</Button><Button type="submit" loading={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button></div>
      </form>
    </section>
  )
}
