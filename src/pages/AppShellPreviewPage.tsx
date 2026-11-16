import { useState } from 'react'
import { useLocation } from 'react-router'
import { AppShell } from '../components/app-shell/AppShell'
import type { ShellUser } from '../components/app-shell/AppShell'
import { appNavigation } from '../components/app-shell/navigation'

const previewUser: ShellUser = { name: 'Rina Anggraini', email: 'rina@contoh.id' }

function AppShellPreviewPage() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const activeContent = appNavigation.find((item) => item.to === pathname)?.label ?? 'Dashboard'

  return (
    <AppShell user={previewUser} collapsed={collapsed} onCollapsedChange={setCollapsed} activePathOverride={pathname === '/dev/app-shell' ? '/app' : undefined}>
      <div className="app-shell-preview">
        <header className="app-shell-preview__heading">
          <h1>Preview App Shell</h1>
          <p>Pratinjau interaktif layout aplikasi Itungitungan dan navigasi responsif.</p>
        </header>
        <section className="app-shell-preview__card" aria-live="polite">
          <p className="app-shell-preview__eyebrow">Konten halaman</p>
          <h2>{activeContent}</h2>
          <p>Area ini mewakili halaman yang dirender oleh Outlet. Pilih menu di sidebar untuk melihat active navigation berubah.</p>
          <div className="app-shell-preview__actions">
            <button type="button" aria-pressed={!collapsed} onClick={() => setCollapsed(false)}>Sidebar expanded</button>
            <button type="button" aria-pressed={collapsed} onClick={() => setCollapsed(true)}>Sidebar collapsed</button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default AppShellPreviewPage
