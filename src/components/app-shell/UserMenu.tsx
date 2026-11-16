import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, CircleUserRound, Settings } from 'lucide-react'
import type { ShellUser } from './AppShell'

export function UserMenu({ user }: { user?: ShellUser | null }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const name = user?.name?.trim() || 'Pengguna'
  const email = user?.email?.trim()
  const initials = name === 'Pengguna'
    ? 'P'
    : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase()

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [])

  return (
    <div className="app-user-menu" ref={root} onKeyDown={(event) => {
      if (event.key === 'Escape') setOpen(false)
    }}>
      <button
        type="button"
        className="app-user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu pengguna${name ? `, ${name}` : ''}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="app-user-menu__avatar" aria-hidden="true">{initials}</span>
        <span className="app-user-menu__identity">
          <strong>{name}</strong>
          {email && <span>{email}</span>}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="app-user-menu__popover" role="menu" aria-label="Menu pengguna">
          <div className="app-user-menu__summary">
            <CircleUserRound size={18} aria-hidden="true" />
            <div><strong>{name}</strong>{email && <span>{email}</span>}</div>
          </div>
          <Link role="menuitem" to="/app/settings" onClick={() => setOpen(false)}>
            <Settings size={17} aria-hidden="true" /> Profil &amp; pengaturan
          </Link>
        </div>
      )}
    </div>
  )
}
