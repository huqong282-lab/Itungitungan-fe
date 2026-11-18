import { useState } from 'react'
import LoginPage, { type LoginPreviewState } from './LoginPage'

const states: { id: LoginPreviewState; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'validation', label: 'Validation Error' },
  { id: 'loading', label: 'Loading' },
  { id: 'invalid-credentials', label: 'Invalid Credential' },
  { id: 'server-error', label: 'Server Error' },
  { id: 'network-error', label: 'Network Error' },
  { id: 'success', label: 'Success' },
]

export default function LoginPreviewPage() {
  const [selected, setSelected] = useState<LoginPreviewState>('default')

  return (
    <div className="login-preview">
      <header className="login-preview__toolbar">
        <h1>Preview Login Page</h1>
        <p>Simulasi lokal memakai komponen halaman login yang sama. Tidak ada request API atau sesi yang dibuat.</p>
        <nav className="login-preview__states" aria-label="Pilih state preview">
          {states.map(({ id, label }) => (
            <button key={id} type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}>{label}</button>
          ))}
        </nav>
      </header>
      <LoginPage key={selected} previewState={selected} />
    </div>
  )
}
