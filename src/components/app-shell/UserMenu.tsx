import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { ChevronDown, CircleUserRound, LogOut, Settings } from 'lucide-react'
import { Alert, Button } from '../ui'
import type { ShellUser } from './AppShell'
import { authApi } from '../../lib/api/auth'
import { ApiError } from '../../lib/api/client'
import { mapApplicationError } from '../../lib/errors/errorMessages'

export type LogoutPreviewState = 'closed' | 'open' | 'loading' | 'success' | 'error' | 'network-error'

const previewErrors: Partial<Record<LogoutPreviewState, ApiError | TypeError>> = {
  error: new ApiError(500, 'Internal server error', null),
  'network-error': new TypeError('Failed to fetch'),
}

export function UserMenu({ user, previewState }: { user?: ShellUser | null; previewState?: LogoutPreviewState }) {
  const [isOpen, setIsOpen] = useState(previewState !== undefined && previewState !== 'closed')
  const [previewSuccess, setPreviewSuccess] = useState(previewState === 'success')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const pendingRef = useRef(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const finishLogout = () => {
    queryClient.clear()
    void navigate('/login', { replace: true })
  }
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: finishLogout,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) finishLogout()
      else setIsLoggingOut(false)
    },
    onSettled: () => { pendingRef.current = false },
  })
  const name = user?.name?.trim() || 'Pengguna'
  const email = user?.email?.trim()
  const loading = isLoggingOut || logoutMutation.isPending || previewState === 'loading'
  const mappedError = logoutMutation.error
    ? mapApplicationError(logoutMutation.error)
    : previewErrors[previewState ?? 'closed'] ? mapApplicationError(previewErrors[previewState ?? 'closed']) : null
  const initials = name === 'Pengguna'
    ? 'P'
    : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase()

  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    return () => document.removeEventListener('pointerdown', closeOnOutside)
  }, [])

  return (
    <div className="app-user-menu" ref={root} onKeyDown={(event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }}>
      <button
        type="button"
        className="app-user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Menu pengguna${name ? `, ${name}` : ''}`}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="app-user-menu__avatar" aria-hidden="true">{initials}</span>
        <span className="app-user-menu__identity">
          <strong>{name}</strong>
          {email && <span>{email}</span>}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="app-user-menu__popover" role="menu" aria-label="Menu pengguna">
          <div className="app-user-menu__summary">
            <CircleUserRound size={18} aria-hidden="true" />
            <div><strong>{name}</strong>{email && <span>{email}</span>}</div>
          </div>
          <Link role="menuitem" to="/app/settings" onClick={() => setIsOpen(false)}>
            <Settings size={17} aria-hidden="true" /> Profil &amp; pengaturan
          </Link>
          {mappedError && <Alert className="app-user-menu__alert" variant="error" title={mappedError.title}>{mappedError.description}</Alert>}
          {previewSuccess && <Alert className="app-user-menu__alert" variant="success" title="Logout berhasil">Simulasi berhasil. Sesi dan cache tidak diubah, halaman tidak dialihkan.</Alert>}
          <Button
            className="app-user-menu__logout"
            variant="danger"
            size="medium"
            type="button"
            role="menuitem"
            loading={loading}
            disabled={loading}
            leadingIcon={!loading && <LogOut size={17} aria-hidden="true" />}
            onClick={() => {
              if (loading || pendingRef.current) return
              if (previewState !== undefined) {
                if (previewState === 'success') setPreviewSuccess(true)
                return
              }
              pendingRef.current = true
              setIsLoggingOut(true)
              logoutMutation.reset()
              logoutMutation.mutate()
            }}
          >
            {loading ? 'Memproses...' : 'Keluar'}
          </Button>
        </div>
      )}
    </div>
  )
}
