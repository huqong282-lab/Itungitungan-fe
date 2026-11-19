import { useState } from 'react'
import RegisterPage, { type RegisterPreviewState } from './RegisterPage'

const states: { id: RegisterPreviewState; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'validation', label: 'Validation Error' },
  { id: 'loading', label: 'Loading' },
  { id: 'password-mismatch', label: 'Password Mismatch' },
  { id: 'email-already-exists', label: 'Email Already Exists' },
  { id: 'server-error', label: 'Server Error' },
  { id: 'network-error', label: 'Network Error' },
  { id: 'success', label: 'Success' },
]

export default function RegisterPreviewPage() {
  const [selected, setSelected] = useState<RegisterPreviewState>('default')
  return <div className="register-preview">
    <header className="register-preview__toolbar"><h1>Preview Register Page</h1><p>Simulasi lokal memakai form registrasi yang sama. Tidak ada request API, akun, atau sesi yang dibuat.</p>
      <nav className="register-preview__states" aria-label="Pilih state preview">{states.map(({ id, label }) => <button key={id} type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}>{label}</button>)}</nav>
    </header>
    <RegisterPage key={selected} previewState={selected} />
  </div>
}
