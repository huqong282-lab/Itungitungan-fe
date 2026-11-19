import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Calculator, Eye, EyeOff, FileText, LockKeyhole, Mail, Server, UserRound, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Alert, Button, FormField, Input, type InputProps } from '../components/ui'
import { ApiError, type ApiResponse } from '../lib/api/client'
import { authApi, type AuthUser, type RegisterRequest } from '../lib/api/auth'
import { mapApplicationError } from '../lib/errors/errorMessages'
import './RegisterPage.css'

export type RegisterPreviewState = 'default' | 'validation' | 'loading' | 'password-mismatch' | 'email-already-exists' | 'server-error' | 'network-error' | 'success'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(100, 'Nama maksimal 100 karakter.'),
  email: z.string().trim().min(1, 'Email wajib diisi.').max(254, 'Email maksimal 254 karakter.').email('Masukkan alamat email yang valid.'),
  password: z.string().min(1, 'Password wajib diisi.').min(8, 'Password minimal 8 karakter.').max(128, 'Password maksimal 128 karakter.'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
}).refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Konfirmasi password harus sama dengan password.' })

type RegisterValues = z.infer<typeof registerSchema>
type RegisterResponse = ApiResponse<{ user: AuthUser }>
type RegisterApiPayload = RegisterRequest

const previewErrors: Partial<Record<RegisterPreviewState, ApiError | TypeError>> = {
  'email-already-exists': new ApiError(409, 'Email is already registered', { error: { code: 'EMAIL_ALREADY_EXISTS' } }, 'EMAIL_ALREADY_EXISTS'),
  'server-error': new ApiError(500, 'Internal server error', null),
  'network-error': new TypeError('Failed to fetch'),
}

type PasswordInputProps = InputProps & { visible: boolean; onToggle: () => void; autoComplete: string; placeholder: string }
function NameInput(inputProps: InputProps) {
  return <span className="register-name-wrap"><UserRound className="register-input-icon" aria-hidden="true" size={19} /><Input {...inputProps} type="text" autoComplete="name" placeholder="Masukkan nama" /></span>
}
function EmailInput(inputProps: InputProps) {
  return <span className="register-email-wrap"><Mail className="register-input-icon" aria-hidden="true" size={19} /><Input {...inputProps} type="email" autoComplete="email" placeholder="Masukkan email" /></span>
}
function PasswordInput({ visible, onToggle, ...inputProps }: PasswordInputProps) {
  return <span className="register-password-wrap">
    <LockKeyhole className="register-input-icon" aria-hidden="true" size={19} />
    <Input {...inputProps} type={visible ? 'text' : 'password'} />
    <button className="register-password-toggle" type="button" aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={visible} onClick={onToggle}>
      {visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
    </button>
  </span>
}

export default function RegisterPage({ previewState }: { previewState?: RegisterPreviewState }) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [previewNotice, setPreviewNotice] = useState('')
  const valuesForPreview: RegisterValues | undefined = previewState === 'password-mismatch'
    ? { name: 'Rina Anggraini', email: 'rina@example.com', password: 'password123', confirmPassword: 'password456' }
    : previewState === 'validation'
      ? { name: '', email: 'email-tidak-valid', password: '', confirmPassword: '' }
      : undefined
  const mutation = useMutation<RegisterResponse, unknown, RegisterApiPayload>({
    mutationFn: async (body) => {
      const response = await authApi.register(body)
      if (!response?.data?.user?.id || !response.data.user.name || !response.data.user.email) {
        throw new Error('Respons registrasi tidak sesuai kontrak.')
      }
      const session = await authApi.getCurrentUser()
      if (session.data.id !== response.data.user.id) {
        throw new Error('Sesi registrasi belum aktif.')
      }
      return response
    },
    onSuccess: () => { void navigate('/app', { replace: true }) },
  })
  const { register, handleSubmit, formState: { errors, isSubmitted } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema), mode: 'onBlur', reValidateMode: 'onChange',
    defaultValues: valuesForPreview ?? { name: '', email: '', password: '', confirmPassword: '' },
  })
  const isPreview = previewState !== undefined
  const isLoading = mutation.isPending || previewState === 'loading'
  const previewError = previewErrors[previewState ?? 'default']
  const mappedError = mutation.error ? mapApplicationError(mutation.error) : previewError ? mapApplicationError(previewError) : null
  const requestErrorTitle = mappedError?.code === 'EMAIL_ALREADY_EXISTS'
    ? 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.'
    : previewState === 'email-already-exists'
      ? 'Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.'
      : mappedError?.description
  const showAlert = mappedError !== null

  const nameRegistration = register('name')
  const emailRegistration = register('email')
  const passwordRegistration = register('password')
  const confirmPasswordRegistration = register('confirmPassword')
  const clearRequestError = () => { if (mutation.error) mutation.reset(); setPreviewNotice('') }

  const submit = handleSubmit(async (values) => {
    if (isPreview) {
      if (previewState === 'success') setPreviewNotice('Simulasi berhasil. Sesi tidak dibuat dan halaman tidak dialihkan.')
      return
    }
    setPreviewNotice('')
    const payload: RegisterApiPayload = { name: values.name.trim(), email: values.email.trim(), password: values.password }
    void mutation.mutateAsync(payload).catch(() => undefined)
  })

  return <main className="register-page">
    <section className="register-promo" aria-label="Tentang Itungitungan">
      <Link className="register-brand" to="/register" aria-label="Itungitungan"><span className="register-brand__mark" aria-hidden="true"><Calculator size={23} strokeWidth={2.2} /></span><span>Itungitungan</span></Link>
      <div className="register-promo__copy"><h1>Hitung estimasi, susun penawaran, tanpa ribet.</h1><p>Kelola kebutuhan proyek web, biaya, hosting, dan maintenance dalam satu tempat.</p></div>
      <div className="register-estimate"><header><strong>Ringkasan Estimasi</strong><span>DRAFT</span></header><dl><div><dt>Subtotal</dt><dd>Rp5.700.000</dd></div><div><dt>Margin 30%</dt><dd>+Rp1.710.000</dd></div><div><dt>Rush Fee</dt><dd>Rp0</dd></div></dl><div className="register-estimate__final"><span>Final Price</span><strong>Rp7.410.000</strong><div>Timeline <b>7 hari</b></div></div></div>
      <ul className="register-benefits"><li><span><Wallet size={22} /></span><div><strong>Estimasi biaya &amp; waktu</strong><p>Harga akhir dan timeline langsung terlihat.</p></div></li><li><span><Server size={22} /></span><div><strong>Hosting &amp; maintenance</strong><p>Tambahkan layanan lanjutan ke setiap proyek.</p></div></li><li><span><FileText size={22} /></span><div><strong>Penawaran untuk klien</strong><p>Rapi, siap kirim, tanpa biaya internal.</p></div></li></ul>
      <p className="register-promo__footer">Itungitungan · Project Estimation &amp; Quotation</p>
    </section>
    <section className="register-side" aria-labelledby="register-title">
      <header className="register-mobile-brand"><span className="register-mobile-brand__mark" aria-hidden="true"><Calculator size={26} strokeWidth={2.2} /></span><p className="register-mobile-brand__name">Itungitungan</p><p className="register-mobile-brand__tagline">Buat akun untuk mulai mengelola estimasi &amp; penawaran proyek</p></header>
      <section className="register-panel">
        <header className="register-card-heading"><h1 id="register-title">Buat akun</h1><p>Daftar untuk mulai menggunakan Itungitungan.</p></header>
        <form className="register-form" onSubmit={submit} noValidate>
          {showAlert && <Alert className="register-alert" variant="error" title={requestErrorTitle} onDismiss={clearRequestError} />}
          {previewNotice && <Alert className="register-alert" variant="success" title="Registrasi berhasil">{previewNotice}</Alert>}
          <FormField label="Name" htmlFor="register-name" required error={errors.name?.message}>
            <NameInput {...nameRegistration} error={Boolean(errors.name)} onChange={(event) => { nameRegistration.onChange(event); clearRequestError() }} onBlur={nameRegistration.onBlur} />
          </FormField>
          <FormField label="Email" htmlFor="register-email" required error={errors.email?.message}>
            <EmailInput {...emailRegistration} error={Boolean(errors.email)} onChange={(event) => { emailRegistration.onChange(event); clearRequestError() }} onBlur={emailRegistration.onBlur} />
          </FormField>
          <FormField label="Password" htmlFor="register-password" required error={errors.password?.message}>
            <PasswordInput {...passwordRegistration} visible={showPassword} onToggle={() => setShowPassword((visible) => !visible)} autoComplete="new-password" placeholder="Masukkan password" error={Boolean(errors.password)} onChange={(event) => { passwordRegistration.onChange(event); clearRequestError() }} onBlur={passwordRegistration.onBlur} />
          </FormField>
          <FormField label="Confirm Password" htmlFor="register-confirm-password" required error={errors.confirmPassword?.message}>
            <PasswordInput {...confirmPasswordRegistration} visible={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} autoComplete="new-password" placeholder="Konfirmasi password" error={Boolean(errors.confirmPassword)} onChange={(event) => { confirmPasswordRegistration.onChange(event); clearRequestError() }} onBlur={confirmPasswordRegistration.onBlur} />
          </FormField>
          <Button className="register-submit" type="submit" size="large" loading={isLoading} disabled={isLoading}>{isLoading ? 'Memproses...' : 'Daftar'}</Button>
          <p className="register-login-link">Sudah punya akun? <Link to="/login">Masuk</Link></p>
        </form>
      </section>
      <p className="register-side__footer">Itungitungan · Project Estimation &amp; Quotation</p>
    </section>
    {isSubmitted && <span className="sr-only" aria-live="polite">Form registrasi diperiksa</span>}
  </main>
}
