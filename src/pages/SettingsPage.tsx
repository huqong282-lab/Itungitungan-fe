import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, Button, ErrorState, FormField, FormSection, Input } from '../components/ui'
import { settingsApi, type Settings, type UpdateSettingsRequest } from '../lib/api/settings'
import { mapApplicationError } from '../lib/errors/errorMessages'
import './SettingsPage.css'

export const settingsQueryKey = ['settings'] as const

const settingsSchema = z.object({
  developerRate: z.number({ error: 'Wajib diisi.' }).finite().int('Masukkan bilangan bulat.').min(0, 'Nilai harus 0 atau lebih.'),
  workingHoursPerDay: z.number({ error: 'Wajib diisi.' }).finite().int('Masukkan bilangan bulat.').gt(0, 'Jam kerja harus lebih dari 0.'),
  buffer: z.number({ error: 'Wajib diisi.' }).finite().min(0, 'Persentase minimal 0%.').max(100, 'Persentase maksimal 100%.'),
  margin: z.number({ error: 'Wajib diisi.' }).finite().min(0, 'Persentase minimal 0%.').max(100, 'Persentase maksimal 100%.'),
  rush: z.number({ error: 'Wajib diisi.' }).finite().min(0, 'Persentase minimal 0%.').max(100, 'Persentase maksimal 100%.'),
  freeRevisionCount: z.number({ error: 'Wajib diisi.' }).finite().int('Masukkan bilangan bulat.').min(0, 'Nilai harus 0 atau lebih.'),
  additionalRevisionPrice: z.number({ error: 'Wajib diisi.' }).finite().int('Masukkan bilangan bulat.').min(0, 'Nilai harus 0 atau lebih.'),
})

type SettingsFormValues = z.infer<typeof settingsSchema>
type SettingsField = keyof Settings

const settingsFields: SettingsField[] = [
  'developerRate',
  'workingHoursPerDay',
  'buffer',
  'margin',
  'rush',
  'freeRevisionCount',
  'additionalRevisionPrice',
]

const fieldDefinitions: Array<{
  name: SettingsField
  label: string
  hint: string
  min: number
  max?: number
  step: number | 'any'
}> = [
  { name: 'developerRate', label: 'Developer Rate', hint: 'Tarif developer untuk setiap jam kerja.', min: 0, step: 1 },
  { name: 'workingHoursPerDay', label: 'Working Hours / Day', hint: 'Jumlah jam kerja dalam satu hari.', min: 1, step: 1 },
  { name: 'buffer', label: 'Buffer', hint: 'Cadangan waktu untuk hal tak terduga.', min: 0, max: 100, step: 'any' },
  { name: 'margin', label: 'Default Margin', hint: 'Persentase keuntungan di atas biaya.', min: 0, max: 100, step: 'any' },
  { name: 'rush', label: 'Default Rush', hint: 'Tambahan biaya untuk pekerjaan mendesak.', min: 0, max: 100, step: 'any' },
  { name: 'freeRevisionCount', label: 'Free Revision Count', hint: 'Jumlah revisi gratis untuk penawaran baru.', min: 0, step: 1 },
  { name: 'additionalRevisionPrice', label: 'Additional Revision Price', hint: 'Biaya untuk setiap revisi tambahan.', min: 0, step: 1 },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [saveSucceeded, setSaveSucceeded] = useState(false)
  const settingsQuery = useQuery({ queryKey: settingsQueryKey, queryFn: settingsApi.get })
  const { register, handleSubmit, reset, formState: { errors, dirtyFields, isDirty } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      developerRate: 0,
      workingHoursPerDay: 1,
      buffer: 0,
      margin: 0,
      rush: 0,
      freeRevisionCount: 0,
      additionalRevisionPrice: 0,
    },
  })
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateSettingsRequest) => settingsApi.update(payload),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(settingsQueryKey, { data })
      reset(data)
      setSaveSucceeded(true)
    },
  })

  useEffect(() => {
    if (settingsQuery.data && !isDirty) reset(settingsQuery.data.data)
  }, [isDirty, reset, settingsQuery.data])

  useEffect(() => {
    if (isDirty) setSaveSucceeded(false)
  }, [isDirty])

  const onSubmit = handleSubmit((values) => {
    const payload: UpdateSettingsRequest = {}
    for (const field of settingsFields) {
      if (dirtyFields[field]) payload[field] = values[field]
    }
    if (Object.keys(payload).length === 0) return
    setSaveSucceeded(false)
    updateMutation.mutate(payload)
  })

  if (settingsQuery.isPending) {
    return <section className="settings-page"><p className="settings-page__loading" role="status">Memuat pengaturan...</p></section>
  }

  if (settingsQuery.isError) {
    const error = mapApplicationError(settingsQuery.error)
    return (
      <section className="settings-page">
        <header className="settings-page__heading"><h1>Settings</h1></header>
        <ErrorState title={error.title} description={error.description} onRetry={() => { void settingsQuery.refetch() }} />
      </section>
    )
  }

  const saveError = updateMutation.error ? mapApplicationError(updateMutation.error) : null

  return (
    <section className="settings-page">
      <header className="settings-page__heading">
        <h1>Settings</h1>
        <p>Kelola nilai default yang digunakan untuk estimasi dan penawaran baru.</p>
      </header>

      <form className="settings-page__form" noValidate onSubmit={onSubmit}>
        <FormSection title="Tarif dan waktu kerja" description="Nilai dasar untuk menghitung biaya dan estimasi waktu." divider>
          <div className="settings-page__grid">
            {fieldDefinitions.slice(0, 2).map((field) => (
              <FormField key={field.name} label={field.label} required hint={field.hint} error={errors[field.name]?.message}>
                <Input type="number" min={field.min} step={field.step} disabled={updateMutation.isPending} {...register(field.name, { valueAsNumber: true })} />
              </FormField>
            ))}
          </div>
        </FormSection>

        <FormSection title="Harga default" description="Buffer waktu dan persentase harga untuk pekerjaan baru." divider>
          <div className="settings-page__grid">
            {fieldDefinitions.slice(2, 5).map((field) => (
              <FormField key={field.name} label={field.label} required hint={field.hint} error={errors[field.name]?.message}>
                <Input type="number" min={field.min} max={field.max} step={field.step} disabled={updateMutation.isPending} {...register(field.name, { valueAsNumber: true })} />
              </FormField>
            ))}
          </div>
        </FormSection>

        <FormSection title="Revisi" description="Atur revisi gratis dan biaya revisi tambahan." divider>
          <div className="settings-page__grid">
            {fieldDefinitions.slice(5).map((field) => (
              <FormField key={field.name} label={field.label} required hint={field.hint} error={errors[field.name]?.message}>
                <Input type="number" min={field.min} step={field.step} disabled={updateMutation.isPending} {...register(field.name, { valueAsNumber: true })} />
              </FormField>
            ))}
          </div>
        </FormSection>

        <div className="settings-page__actions">
          <div aria-live="polite">
            {isDirty && <p className="settings-page__dirty">Ada perubahan yang belum disimpan.</p>}
            {saveSucceeded && <Alert variant="success" title="Perubahan tersimpan">Pengaturan terbaru sudah disimpan.</Alert>}
            {saveError && <Alert variant="error" title={saveError.title}>{saveError.description}</Alert>}
          </div>
          <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending ? 'Menyimpan...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </section>
  )
}
