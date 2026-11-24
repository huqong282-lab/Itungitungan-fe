import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Alert, Button, FormField, Input, Modal, Select } from '../components/ui'
import { featuresApi, type FeatureOption, type FeatureOptionRequest } from '../lib/api/features'
import { mapApplicationError } from '../lib/errors/errorMessages'
import { featuresQueryKey } from './FeaturesPage'

const optionSchema = z.object({
  name: z.string().trim().min(1, 'Nama option wajib diisi.'),
  selectionType: z.custom<FeatureOption['selectionType']>(value => value === 'SINGLE' || value === 'MULTIPLE', 'Pilih selection type.'),
})
type OptionFormValues = z.infer<typeof optionSchema>

export default function FeatureOptionEditor({ featureId, option, onClose, onSaved }: {
  featureId: string
  option: FeatureOption | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const queryClient = useQueryClient()
  const initialValues = useRef<OptionFormValues>({ name: option?.name ?? '', selectionType: option?.selectionType ?? 'SINGLE' })
  const form = useForm<OptionFormValues>({
    resolver: zodResolver(optionSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: initialValues.current,
  })

  useEffect(() => {
    const values = { name: option?.name ?? '', selectionType: option?.selectionType ?? 'SINGLE' }
    initialValues.current = values
    form.reset(values)
  }, [form, option])

  const mutation = useMutation({
    mutationFn: (body: FeatureOptionRequest | { id: string; body: Partial<FeatureOptionRequest> }) =>
      'id' in body ? featuresApi.updateOption(featureId, body.id, body.body) : featuresApi.createOption(featureId, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...featuresQueryKey, 'detail', featureId] })
      await queryClient.invalidateQueries({ queryKey: featuresQueryKey })
      onSaved(option ? 'Option berhasil diperbarui.' : 'Option berhasil dibuat.')
    },
  })

  const submit = form.handleSubmit(values => {
    const body: FeatureOptionRequest = { name: values.name.trim(), selectionType: values.selectionType }
    if (!option) {
      mutation.mutate(body)
      return
    }
    const update: Partial<FeatureOptionRequest> = {}
    if (body.name !== initialValues.current.name) update.name = body.name
    if (body.selectionType !== initialValues.current.selectionType) update.selectionType = body.selectionType
    if (Object.keys(update).length === 0) {
      onSaved('Tidak ada perubahan pada option.')
      return
    }
    mutation.mutate({ id: option.id, body: update })
  })

  const error = mutation.error ? mapApplicationError(mutation.error) : null

  return <Modal
    open
    onClose={() => { if (!mutation.isPending) onClose() }}
    title={option ? 'Edit Option' : 'Create Option'}
    description={option ? 'Perbarui konfigurasi option pada feature ini.' : 'Tambahkan option pada feature ini.'}
    className="feature-option-editor"
    footer={<>
      <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancel</Button>
      <Button type="submit" form="feature-option-form" loading={mutation.isPending}>{mutation.isPending ? 'Saving...' : option ? 'Save' : 'Create Option'}</Button>
    </>}
  >
    <form id="feature-option-form" className="feature-option-editor__form" noValidate onSubmit={submit}>
      {error && <Alert variant="error" title={error.title}>{error.description}</Alert>}
      <FormField label="Name" required error={form.formState.errors.name?.message}>
        <Input autoFocus disabled={mutation.isPending} {...form.register('name')} />
      </FormField>
      <FormField label="Selection Type" required hint="SINGLE untuk satu pilihan, MULTIPLE untuk beberapa pilihan." error={form.formState.errors.selectionType?.message}>
        <Select disabled={mutation.isPending} options={[
          { value: 'SINGLE', label: 'SINGLE' },
          { value: 'MULTIPLE', label: 'MULTIPLE' },
        ]} {...form.register('selectionType')} />
      </FormField>
    </form>
  </Modal>
}
