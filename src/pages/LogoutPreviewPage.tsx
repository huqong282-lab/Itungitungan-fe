import { useState } from 'react'
import { UserMenu, type LogoutPreviewState } from '../components/app-shell/UserMenu'
import '../components/app-shell/app-shell.css'
import './LogoutPreviewPage.css'

const states: { id: LogoutPreviewState; label: string }[] = [
  { id: 'closed', label: 'Normal' },
  { id: 'open', label: 'Dropdown terbuka' },
  { id: 'loading', label: 'Loading' },
  { id: 'success', label: 'Logout sukses' },
  { id: 'error', label: 'Server error' },
  { id: 'network-error', label: 'Network error' },
]

export default function LogoutPreviewPage() {
  const [selected, setSelected] = useState<LogoutPreviewState>('closed')
  return <main className="logout-preview">
    <header className="logout-preview__toolbar">
      <h1>Preview Logout</h1>
      <p>Gunakan User Menu yang sama dengan aplikasi. Simulasi tidak memanggil backend, mengubah sesi, atau mengalihkan halaman.</p>
      <nav className="logout-preview__states" aria-label="Pilih state logout">
        {states.map(({ id, label }) => <button key={id} type="button" aria-pressed={selected === id} onClick={() => setSelected(id)}>{label}</button>)}
      </nav>
    </header>
    <section className="logout-preview__stage" aria-label="Pratinjau App Shell">
      <header className="logout-preview__topbar"><strong>Itungitungan</strong><UserMenu key={selected} user={{ name: 'Rina Anggraini', email: 'rina@example.com' }} previewState={selected} /></header>
      <div className="logout-preview__content"><span>Dashboard</span><h2>Ringkasan proyek Anda</h2><p>Menu pengguna pada halaman aplikasi.</p></div>
    </section>
  </main>
}
