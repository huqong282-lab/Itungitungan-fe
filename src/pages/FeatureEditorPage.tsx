import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import { Alert, Button, ErrorState, FormField, Input, Textarea } from '../components/ui'
import { featuresApi, type FeatureCreateRequest, type FeatureOption, type FeatureSummary } from '../lib/api/features'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { featuresQueryKey } from './FeaturesPage'
import FeatureOptionEditor from './FeatureOptionEditor'
import FeatureValueEditor from './FeatureValueEditor'
import './FeatureEditorPage.css'

const featureSchema = z.object({
  name: z.string().trim().min(1, 'Nama fitur wajib diisi.'),
  description: z.string(),
  category: z.string(),
  baseEstimatedHours: z.number({ error: 'Masukkan bilangan bulat 0 atau lebih.' }).finite().int('Masukkan bilangan bulat.').min(0, 'Nilai harus 0 atau lebih.'),
})
type FeatureFormValues = z.infer<typeof featureSchema>
type FeatureUpdateRequest = Partial<FeatureCreateRequest>

function toRequest(values: FeatureFormValues): FeatureCreateRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    category: values.category.trim() || null,
    baseEstimatedHours: values.baseEstimatedHours,
  }
}

function toFormValues(feature: FeatureSummary): FeatureFormValues {
  return {
    name: feature.name,
    description: feature.description ?? '',
    category: feature.category ?? '',
    baseEstimatedHours: feature.baseEstimatedHours,
  }
}

export default function FeatureEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { featureId } = useParams<{ featureId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editingOption, setEditingOption] = useState<FeatureOption | null | undefined>(undefined)
  const [editingValue, setEditingValue] = useState<{ option: FeatureOption; value: FeatureOption['values'][number] | null } | null>(null)
  const [optionSuccess, setOptionSuccess] = useState('')
  const originalValues = useRef<FeatureFormValues | null>(null)
  const form = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { name: '', description: '', category: '', baseEstimatedHours: 0 },
  })

  const detailQuery = useQuery({
    queryKey: [...featuresQueryKey, 'detail', featureId],
    queryFn: () => featuresApi.get(featureId!),
    enabled: mode === 'edit' && Boolean(featureId),
  })
  const feature = detailQuery.data?.data
  useEffect(() => {
    if (mode !== 'edit' || !feature || feature.id !== featureId) return
    const values = toFormValues(feature)
    originalValues.current = values
    form.reset(values)
  }, [feature, featureId, form, mode])

  const mutation = useMutation<unknown, unknown, FeatureCreateRequest | { id: string; body: FeatureUpdateRequest }>({
    mutationFn: input => 'id' in input ? featuresApi.update(input.id, input.body) : featuresApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: featuresQueryKey })
      navigate('/app/features', {
        replace: true,
        state: { featureSuccess: mode === 'create' ? 'Fitur berhasil dibuat.' : 'Fitur berhasil diperbarui.' },
      })
    },
  })

  const submit = form.handleSubmit(values => {
    const body = toRequest(values)
    if (mode === 'create') {
      mutation.mutate(body)
      return
    }
    if (!featureId || !originalValues.current) return
    const initial = originalValues.current
    const update: FeatureUpdateRequest = {}
    if (body.name !== initial.name) update.name = body.name
    if (body.description !== (initial.description.trim() || null)) update.description = body.description
    if (body.category !== (initial.category.trim() || null)) update.category = body.category
    if (body.baseEstimatedHours !== initial.baseEstimatedHours) update.baseEstimatedHours = body.baseEstimatedHours
    if (Object.keys(update).length === 0) {
      navigate('/app/features', { replace: true, state: { featureSuccess: 'Tidak ada perubahan pada fitur.' } })
      return
    }
    mutation.mutate({ id: featureId, body: update })
  })

  if (mode === 'edit' && detailQuery.isPending) {
    return <section className="feature-editor"><p className="feature-editor__loading" role="status">Memuat data fitur...</p></section>
  }
  if (mode === 'edit' && detailQuery.isError) {
    const error = mapApplicationError(detailQuery.error)
    return <section className="feature-editor"><header className="feature-editor__heading"><h1>Edit Feature</h1></header><ErrorState title={error.title} description={error.description} onRetry={() => { void detailQuery.refetch() }} /><Button variant="outline" onClick={() => navigate('/app/features')}>Kembali ke Feature List</Button></section>
  }
  if (mode === 'edit' && (!feature || feature.id !== featureId)) {
    return <section className="feature-editor"><header className="feature-editor__heading"><h1>Edit Feature</h1></header><ErrorState title="Data fitur tidak tersedia" description="Muat ulang daftar fitur dan pilih fitur yang ingin diedit." /><Button variant="outline" onClick={() => navigate('/app/features')}>Kembali ke Feature List</Button></section>
  }

  const submitError = mutation.error ? mapApplicationError(mutation.error) : null

  return (
    <section className="feature-editor">
      <header className="feature-editor__heading"><h1>{mode === 'create' ? 'Create Feature' : 'Edit Feature'}</h1><p>{mode === 'create' ? 'Tambahkan fitur ke katalog Anda.' : 'Perbarui informasi fitur pada katalog Anda.'}</p></header>
      <form className="feature-editor__form" noValidate onSubmit={submit}>
        {submitError && <Alert variant="error" title={submitError.title}>{submitError.description}</Alert>}
        {optionSuccess && <Alert variant="success" title="Berhasil">{optionSuccess}</Alert>}
        <FormField label="Name" required error={form.formState.errors.name?.message}><Input autoFocus disabled={mutation.isPending} {...form.register('name')} /></FormField>
        <FormField label="Description" error={form.formState.errors.description?.message}><Textarea rows={4} disabled={mutation.isPending} {...form.register('description')} /></FormField>
        <FormField label="Category" error={form.formState.errors.category?.message}><Input disabled={mutation.isPending} {...form.register('category')} /></FormField>
        <FormField label="Base Estimated Hours" required hint="Masukkan bilangan bulat 0 atau lebih." error={form.formState.errors.baseEstimatedHours?.message}><Input type="number" min={0} step={1} disabled={mutation.isPending} {...form.register('baseEstimatedHours', { valueAsNumber: true })} /></FormField>
        <div className="feature-editor__actions"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => navigate('/app/features')}>Cancel</Button><Button type="submit" loading={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save'}</Button></div>
      </form>
      {mode === 'edit' && feature && <section className="feature-editor__options" aria-labelledby="feature-options-title">
        <header className="feature-editor__options-heading">
          <div><h2 id="feature-options-title">Options</h2><p>Atur pilihan yang dapat dikonfigurasi pada feature ini.</p></div>
          <Button type="button" onClick={() => { setOptionSuccess(''); setEditingOption(null) }}>Add Option</Button>
        </header>
        {feature.options.length === 0 ? <p className="feature-editor__options-empty">Belum ada option untuk feature ini.</p> : <ul className="feature-editor__option-list">
          {feature.options.map(option => <li key={option.id} className="feature-editor__option feature-editor__option--with-values">
            <div className="feature-editor__option-content"><div className="feature-editor__option-heading"><div><strong>{option.name}</strong><span>{option.selectionType === 'SINGLE' ? 'Satu pilihan' : 'Beberapa pilihan'}</span></div><div className="feature-editor__option-actions"><Button type="button" variant="outline" size="small" aria-label={`Edit ${option.name}`} onClick={() => { setOptionSuccess(''); setEditingOption(option) }}>Edit Option</Button><Button type="button" size="small" aria-label={`Add value to ${option.name}`} onClick={() => setEditingValue({ option, value: null })}>Add Value</Button></div></div>
              {option.values.length === 0 ? <p className="feature-editor__values-empty">Belum ada value untuk option ini.</p> : <ul className="feature-editor__value-list">{option.values.map(value => <li key={value.id} className={!value.isActive ? 'is-inactive' : ''}><div><strong>{value.label}</strong><span>{value.estimatedHours} jam{value.isDefault ? ' · Default' : ''}{!value.isActive ? ' · Nonaktif' : ''}</span></div><Button type="button" variant="outline" size="small" aria-label={`Edit ${value.label}`} onClick={() => setEditingValue({ option, value })}>Edit</Button></li>)}</ul>}
            </div>
          </li>)}
        </ul>}
      </section>}
      {featureId && editingOption !== undefined && <FeatureOptionEditor
        key={editingOption?.id ?? 'create'}
        featureId={featureId}
        option={editingOption}
        onClose={() => setEditingOption(undefined)}
        onSaved={message => { setEditingOption(undefined); setOptionSuccess(message) }}
      />}
      {featureId && editingValue && <FeatureValueEditor
        key={`${editingValue.option.id}:${editingValue.value?.id ?? 'create'}`}
        featureId={featureId}
        option={editingValue.option}
        value={editingValue.value}
        onClose={() => setEditingValue(null)}
        onSaved={message => { setEditingValue(null); setOptionSuccess(message) }}
      />}
    </section>
  )
}
