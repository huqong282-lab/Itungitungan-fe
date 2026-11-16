import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { ShellUser } from './AppShell'
import { UserMenu } from './UserMenu'

type TopbarProps = {
  user?: ShellUser | null
  activeLabel: string
  collapsed: boolean
  onToggleSidebar: () => void
  onOpenNavigation: () => void
}

export function Topbar({ user, activeLabel, collapsed, onToggleSidebar, onOpenNavigation }: TopbarProps) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__leading">
        <button type="button" className="app-topbar__icon app-topbar__mobile-menu" aria-label="Buka navigasi" onClick={onOpenNavigation}>
          <Menu size={20} />
        </button>
        <button type="button" className="app-topbar__icon app-topbar__collapse" aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'} onClick={onToggleSidebar}>
          {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>
        <span className="app-topbar__title">{activeLabel}</span>
      </div>
      <UserMenu user={user} />
    </header>
  )
}
