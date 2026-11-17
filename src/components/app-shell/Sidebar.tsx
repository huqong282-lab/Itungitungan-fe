import { Link } from 'react-router'
import type { RefObject, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { appNavigation } from './navigation'

type SidebarProps = {
  activePath: string
  mobileOpen: boolean
  onNavigate: () => void
  onClose: () => void
  closeButtonRef: RefObject<HTMLButtonElement | null>
}

export function Sidebar({ activePath, mobileOpen, onNavigate, onClose, closeButtonRef }: SidebarProps) {
  return (
    <aside
      id="app-navigation-drawer"
      className={`app-sidebar${mobileOpen ? ' app-sidebar--mobile-open' : ''}`}
      aria-label="Navigasi aplikasi"
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen ? 'true' : undefined}
      onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
        if (!mobileOpen || event.key !== 'Tab') return
        const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }}
    >
      <div className="app-sidebar__brand-row">
        <Link className="app-sidebar__brand" to="/app" onClick={onNavigate} aria-label="Itungitungan, Dashboard">
          <span className="app-sidebar__brand-mark" aria-hidden="true">i</span>
          <span className="app-sidebar__brand-name">Itungitungan</span>
        </Link>
        <button ref={closeButtonRef} type="button" className="app-sidebar__close" aria-label="Tutup navigasi" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </div>
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
