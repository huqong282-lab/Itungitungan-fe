import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, Button, Checkbox, FormField, Input, Modal } from '../components/ui'
import { featuresApi, type FeatureOption, type FeatureOptionValue, type FeatureOptionValueRequest } from '../lib/api/features'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { featuresQueryKey } from './FeaturesPage'

const valueSchema = z.object({
  label: z.string().trim().min(1, 'Label wajib diisi.'),
  estimatedHours: z.number({ error: 'Masukkan bilangan bulat 0 atau lebih.' }).finite().int('Masukkan bilangan bulat.').min(0, 'Nilai harus 0 atau lebih.'),
  isDefault: z.boolean(),
  isActive: z.boolean(),
})
type ValueFormValues = z.infer<typeof valueSchema>

export default function FeatureValueEditor({ featureId, option, value, onClose, onSaved }: {
  featureId: string
  option: FeatureOption
  value: FeatureOptionValue | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const initial = useRef<ValueFormValues>({ label: value?.label ?? '', estimatedHours: value?.estimatedHours ?? 0, isDefault: value?.isDefault ?? false, isActive: value?.isActive ?? true })
  const form = useForm<ValueFormValues>({ resolver: zodResolver(valueSchema), mode: 'onBlur', reValidateMode: 'onChange', defaultValues: initial.current })

  useEffect(() => {
    const values = { label: value?.label ?? '', estimatedHours: value?.estimatedHours ?? 0, isDefault: value?.isDefault ?? false, isActive: value?.isActive ?? true }
    initial.current = values
    form.reset(values)
  }, [form, value])

  const mutation = useMutation({
    mutationFn: async (body: FeatureOptionValueRequest | { id: string; body: Partial<FeatureOptionValueRequest> }) => {
      if (!('id' in body)) {
        if (body.isDefault === true) {
          for (const other of option.values) {
            if (other.isDefault) await featuresApi.updateOptionValue(featureId, option.id, other.id, { isDefault: false })
          }
        }
        return featuresApi.createOptionValue(featureId, option.id, body)
      }
      // The backend contract has no atomic default-switch endpoint. Clear other
      // defaults first so the option never temporarily has two default values.
      if (body.body.isDefault === true) {
        for (const other of option.values) {
          if (other.id !== body.id && other.isDefault) {
            await featuresApi.updateOptionValue(featureId, option.id, other.id, { isDefault: false })
          }
        }
      }
      return featuresApi.updateOptionValue(featureId, option.id, body.id, body.body)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...featuresQueryKey, 'detail', featureId] })
      await queryClient.invalidateQueries({ queryKey: featuresQueryKey })
      onSaved(value ? 'Value berhasil diperbarui.' : 'Value berhasil dibuat.')
    },
  })

  const submit = form.handleSubmit(values => {
    const body: FeatureOptionValueRequest = { label: values.label.trim(), estimatedHours: values.estimatedHours, isDefault: values.isDefault, isActive: values.isActive }
    if (!value) { mutation.mutate(body); return }
    const update: Partial<FeatureOptionValueRequest> = {}
    if (body.label !== initial.current.label) update.label = body.label
    if (body.estimatedHours !== initial.current.estimatedHours) update.estimatedHours = body.estimatedHours
    if (body.isDefault !== initial.current.isDefault) update.isDefault = body.isDefault
    if (body.isActive !== initial.current.isActive) update.isActive = body.isActive
    if (Object.keys(update).length === 0) { onSaved('Tidak ada perubahan pada value.'); return }
    mutation.mutate({ id: value.id, body: update })
  })
  const error = mutation.error ? mapApplicationError(mutation.error) : null

  return <Modal open onClose={() => { if (!mutation.isPending) onClose() }} title={value ? 'Edit Feature Value' : 'Create Feature Value'} description={`Kelola value untuk option “${option.name}”.`} className="feature-value-editor" footer={<>
    <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button>
    <Button type="submit" form="feature-value-form" loading={mutation.isPending}>{mutation.isPending ? 'Saving...' : value ? 'Save' : 'Create Value'}</Button>
  </>}>
    <form id="feature-value-form" className="feature-value-editor__form" noValidate onSubmit={submit}>
      {error && <Alert variant="error" title={error.title}>{error.description}</Alert>}
      <FormField label="Label" required error={form.formState.errors.label?.message}><Input autoFocus disabled={mutation.isPending} {...form.register('label')} /></FormField>
      <FormField label="Estimated Hours" required hint="Masukkan bilangan bulat 0 atau lebih." error={form.formState.errors.estimatedHours?.message}><Input type="number" min={0} step={1} disabled={mutation.isPending} {...form.register('estimatedHours', { valueAsNumber: true })} /></FormField>
      <Checkbox disabled={mutation.isPending} {...form.register('isDefault')} label="Default untuk option ini" />
      <Checkbox disabled={mutation.isPending} {...form.register('isActive')} label="Active — tersedia untuk dipilih" />
    </form>
  </Modal>
}
