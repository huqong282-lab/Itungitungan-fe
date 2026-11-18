import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Calculator, Eye, EyeOff, FileText, LockKeyhole, Mail, Server, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { Alert, Button, FormField, Input, type InputProps } from '../components/ui'
import { ApiError, type ApiResponse } from '../lib/api/client'
import { authApi, type AuthUser, type LoginRequest } from '../lib/api/auth'
import { mapApplicationError } from '../lib/errors/errorMessages'
import './LoginPage.css'

export type LoginPreviewState = 'default' | 'validation' | 'loading' | 'invalid-credentials' | 'server-error' | 'network-error' | 'success'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi.').email('Masukkan alamat email yang valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

type LoginValues = z.infer<typeof loginSchema>
type LoginResponse = ApiResponse<{ user: Pick<AuthUser, 'id' | 'email'> }>

const previewErrors: Partial<Record<LoginPreviewState, ApiError | TypeError>> = {
  'invalid-credentials': new ApiError(401, 'Invalid credentials', { error: { code: 'INVALID_CREDENTIALS' } }, 'INVALID_CREDENTIALS'),
  'server-error': new ApiError(500, 'Internal server error', null),
  'network-error': new TypeError('Failed to fetch'),
}

type PasswordInputProps = InputProps & { visible: boolean; onToggle: () => void }

function EmailInput(inputProps: InputProps) {
  return (
    <span className="login-email-wrap">
      <Mail className="login-input-icon" aria-hidden="true" size={19} />
      <Input {...inputProps} type="email" autoComplete="email" placeholder="Masukkan email" />
    </span>
  )
}

function PasswordInput({ visible, onToggle, ...inputProps }: PasswordInputProps) {
  return (
    <span className="login-password-wrap">
      <LockKeyhole className="login-input-icon" aria-hidden="true" size={19} />
      <Input {...inputProps} type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Masukkan password" />
      <button
        className="login-password-toggle"
        type="button"
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={visible}
        onClick={onToggle}
      >
        {visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
      </button>
    </span>
  )
}

export default function LoginPage({ previewState }: { previewState?: LoginPreviewState }) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [previewNotice, setPreviewNotice] = useState('')
  const mutation = useMutation<LoginResponse, unknown, LoginRequest>({
    mutationFn: (body) => authApi.login(body),
    onSuccess: () => { void navigate('/app', { replace: true }) },
  })
  const { register, handleSubmit, setError, formState: { errors, isSubmitted } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  const isPreview = previewState !== undefined
  const previewValidation = previewState === 'validation'
  const isLoading = mutation.isPending || previewState === 'loading'
  const mappedError = mutation.error ? mapApplicationError(mutation.error) : previewErrors[previewState ?? 'default'] ? mapApplicationError(previewErrors[previewState ?? 'default']) : null

  useEffect(() => {
    if (!previewValidation) return
    setError('email', { type: 'manual', message: 'Masukkan alamat email yang valid.' })
    setError('password', { type: 'manual', message: 'Password wajib diisi.' })
  }, [previewValidation, setError])

  const submit = handleSubmit(async (values) => {
    if (isPreview) {
      if (previewState === 'success') setPreviewNotice('Simulasi berhasil. Tidak ada sesi yang dibuat dan halaman tidak dialihkan.')
      return
    }
    setPreviewNotice('')
    void mutation.mutateAsync(values).catch(() => undefined)
  })

  const emailRegistration = register('email')
  const passwordRegistration = register('password')
  const clearRequestError = () => { if (mutation.error) mutation.reset() }

  return (
    <main className="login-page">
      <section className="login-promo" aria-label="Tentang Itungitungan">
        <a className="login-brand" href="/login" aria-label="Itungitungan">
          <span className="login-brand__mark" aria-hidden="true"><Calculator size={23} strokeWidth={2.2} /></span>
          <span>Itungitungan</span>
        </a>
        <div className="login-promo__copy">
          <h1>Hitung estimasi, susun penawaran, tanpa ribet.</h1>
          <p>Kelola kebutuhan proyek web, biaya, hosting, dan maintenance dalam satu tempat.</p>
        </div>
        <div className="login-estimate" aria-label="Contoh ringkasan estimasi">
          <header><strong>Ringkasan Estimasi</strong><span>DRAFT</span></header>
          <dl>
            <div><dt>Subtotal</dt><dd>Rp5.700.000</dd></div>
            <div><dt>Margin 30%</dt><dd>+Rp1.710.000</dd></div>
            <div><dt>Rush Fee</dt><dd>Rp0</dd></div>
          </dl>
          <div className="login-estimate__final"><span>Final Price</span><strong>Rp7.410.000</strong><div>Timeline <b>7 hari</b></div></div>
        </div>
        <ul className="login-benefits">
          <li><span><Wallet size={22} /></span><div><strong>Estimasi biaya &amp; waktu</strong><p>Harga akhir dan timeline langsung terlihat.</p></div></li>
          <li><span><Server size={22} /></span><div><strong>Hosting &amp; maintenance</strong><p>Tambahkan layanan lanjutan ke setiap proyek.</p></div></li>
          <li><span><FileText size={22} /></span><div><strong>Penawaran untuk klien</strong><p>Rapi, siap kirim, tanpa biaya internal.</p></div></li>
        </ul>
        <p className="login-promo__footer">Itungitungan · Project Estimation &amp; Quotation</p>
      </section>

      <section className="login-side" aria-labelledby="login-title">
        <header className="login-mobile-brand">
          <a className="login-mobile-brand__mark" href="/login" aria-label="Itungitungan"><Calculator size={26} strokeWidth={2.2} /></a>
          <p className="login-mobile-brand__name">Itungitungan</p>
          <p className="login-mobile-brand__tagline">Masuk untuk mengelola estimasi &amp; penawaran proyek</p>
        </header>
        <section className="login-panel">
          <header className="login-card-heading">
            <h1 id="login-title">Masuk</h1>
            <p>Gunakan akun Anda untuk melanjutkan.</p>
          </header>

          <form className="login-form" onSubmit={submit} noValidate>
            {mappedError && <Alert className="login-alert" variant="error" title={mappedError.description} onDismiss={clearRequestError} />}
            {previewNotice && <Alert className="login-alert" variant="success" title="Login berhasil">{previewNotice}</Alert>}

            <FormField label="Email" htmlFor="login-email" required error={errors.email?.message}>
              <EmailInput
                {...emailRegistration}
                error={Boolean(errors.email)}
                onChange={(event) => { emailRegistration.onChange(event); clearRequestError(); setPreviewNotice('') }}
                onBlur={emailRegistration.onBlur}
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" required error={errors.password?.message}>
              <PasswordInput
                {...passwordRegistration}
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
                error={Boolean(errors.password)}
                onChange={(event) => { passwordRegistration.onChange(event); clearRequestError(); setPreviewNotice('') }}
                onBlur={passwordRegistration.onBlur}
              />
            </FormField>

            <Button className="login-submit" type="submit" size="large" loading={isLoading} disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </section>
        <p className="login-side__footer">Itungitungan · Project Estimation &amp; Quotation</p>
      </section>
      {isSubmitted && <span className="sr-only" aria-live="polite">Form login diperiksa</span>}
    </main>
  )
}
