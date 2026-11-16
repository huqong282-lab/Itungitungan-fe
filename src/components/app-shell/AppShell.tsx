import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { appNavigation } from './navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import './app-shell.css'

export type ShellUser = { name?: string | null; email?: string | null }

type AppShellProps = {
  children: ReactNode
  user?: ShellUser | null
  initialCollapsed?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  activePathOverride?: string
}
export function AppShell({ children, user, initialCollapsed = false, collapsed: controlledCollapsed, onCollapsedChange, activePathOverride }: AppShellProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(initialCollapsed)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const activePath = activePathOverride ?? location.pathname
  const activeItem = [...appNavigation]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => item.to === '/app'
      ? activePath === item.to
      : activePath === item.to || activePath.startsWith(`${item.to}/`))

  const closeMobile = () => setMobileOpen(false)
  const toggleSidebar = () => {
    const next = !collapsed
    if (controlledCollapsed === undefined) setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  return (
    <div className={`app-shell${collapsed ? ' app-shell--collapsed' : ''}`}>
      {mobileOpen && <button type="button" className="app-shell__scrim" aria-label="Tutup navigasi" onClick={closeMobile} />}
      <Sidebar
        activePath={activePath}
        mobileOpen={mobileOpen}
        onNavigate={closeMobile}
      />
      <div className="app-shell__main">
        <Topbar
          user={user}
          activeLabel={activeItem?.label ?? 'Itungitungan'}
          onOpenNavigation={() => setMobileOpen(true)}
          onToggleSidebar={toggleSidebar}
          collapsed={collapsed}
        />
        <main className="app-shell__content" id="main-content">{children}</main>
      </div>
    </div>
  )
}

