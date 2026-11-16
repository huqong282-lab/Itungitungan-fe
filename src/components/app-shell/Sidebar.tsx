import { Link } from 'react-router'
import { appNavigation } from './navigation'

type SidebarProps = {
  activePath: string
  mobileOpen: boolean
  onNavigate: () => void
}

export function Sidebar({ activePath, mobileOpen, onNavigate }: SidebarProps) {
  return (
    <aside className={`app-sidebar${mobileOpen ? ' app-sidebar--mobile-open' : ''}`} aria-label="Navigasi aplikasi">
      <Link className="app-sidebar__brand" to="/app" onClick={onNavigate} aria-label="Itungitungan, Dashboard">
        <span className="app-sidebar__brand-mark" aria-hidden="true">i</span>
        <span className="app-sidebar__brand-name">Itungitungan</span>
      </Link>
      <nav className="app-sidebar__nav" aria-label="Menu utama">
        <span className="app-sidebar__section-label">Menu</span>
        {appNavigation.map(({ label, to, icon: Icon }) => {
          const isActive = to === '/app'
            ? activePath === to
            : activePath === to || activePath.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`app-sidebar__link${isActive ? ' app-sidebar__link--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              title={label}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="app-sidebar__footer">
        <p>Workspace pribadi</p>
      </div>
    </aside>
  )
}
