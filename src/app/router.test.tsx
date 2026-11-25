import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import QueryProvider from './QueryProvider'
import { appRoutes } from './router'
import { queryClient } from '../lib/queryClient'
import { currentUserQueryKey } from './AuthGuard'
import { settingsQueryKey } from '../pages/SettingsPage'
import { featuresQueryKey } from '../pages/FeaturesPage'
import { designsQueryKey } from '../pages/DesignsPage'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

const routes = [
  ['/login', 'Masuk'],
  ['/register', 'Buat akun'],
  ['/app', 'Dashboard'],
  ['/app/projects', 'Projects'],
  ['/app/projects/new', 'Create Project'],
  ['/app/projects/project-123', 'Project Details'],
  ['/app/features', 'Feature List'],
  ['/app/features/new', 'Create Feature'],
  ['/app/features/feature-123', 'Edit Feature'],
  ['/app/designs', 'Designs'],
  ['/app/designs/new', 'Create Design'],
  ['/app/designs/design-123', 'Edit Design'],
  ['/app/hosting', 'Hosting'],
  ['/app/hosting/new', 'Create Hosting Plan'],
  ['/app/hosting/hosting-123', 'Hosting Plan Details'],
  ['/app/maintenance', 'Maintenance'],
  ['/app/maintenance/new', 'Create Maintenance Plan'],
  ['/app/maintenance/maintenance-123', 'Maintenance Plan Details'],
  ['/app/quotations', 'Quotations'],
  ['/app/quotations/quotation-123', 'Quotation Details'],
  ['/app/settings', 'Settings'],
] as const

function renderRoute(path: string) {
  queryClient.clear()
  queryClient.setQueryData(currentUserQueryKey, { data: { id: 'user-1', name: 'Rina Anggraini', email: 'rina@example.com' } })
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return render(<QueryProvider><RouterProvider router={router} /></QueryProvider>)
}

describe('application routes', () => {
  it.each(routes)('opens %s', (path, title) => {
    renderRoute(path)

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  })

  it.each([
    ['/app/projects/project-123', 'project-123'],
    ['/app/hosting/hosting-123', 'hosting-123'],
    ['/app/maintenance/maintenance-123', 'maintenance-123'],
    ['/app/quotations/quotation-123', 'quotation-123'],
  ])('reads the route parameter for %s', (path, id) => {
    renderRoute(path)

    expect(screen.getByText(id)).toBeInTheDocument()
  })

  it('renders the feature editor route using its cached detail data', () => {
    renderRoute('/app/features/feature-123')
    expect(screen.getByRole('heading', { name: 'Edit Feature' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Feature')
  })

  it('renders the design editor route using its cached detail data', () => {
    renderRoute('/app/designs/design-123')
    expect(screen.getByRole('heading', { name: 'Edit Design' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Name/)).toHaveValue('Starter Design')
  })

  it('navigates between application routes', async () => {
    const user = userEvent.setup()
    renderRoute('/app')

    await user.click(screen.getByRole('link', { name: 'Projects' }))

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
  })

  it('renders the shared shell, all navigation, and the active route state', () => {
    renderRoute('/app/projects/project-123')

    expect(screen.getByRole('navigation', { name: 'Menu utama' })).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main', { name: '' })).toBeInTheDocument()
    for (const label of ['Dashboard', 'Projects', 'Features', 'Designs', 'Hosting', 'Maintenance', 'Quotations', 'Settings']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('opens the user menu and navigates to settings', async () => {
    const user = userEvent.setup()
    renderRoute('/app')
    await user.click(screen.getByRole('button', { name: 'Menu pengguna, Pengguna' }))

    expect(screen.getByRole('menuitem', { name: 'Profil & pengaturan' })).toHaveAttribute('href', '/app/settings')
    await user.click(screen.getByRole('menuitem', { name: 'Profil & pengaturan' }))
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('opens and closes the responsive navigation and supports desktop sidebar collapse', async () => {
    const user = userEvent.setup()
    renderRoute('/app')
    const trigger = screen.getByRole('button', { name: 'Buka navigasi' })
    await user.click(trigger)
    expect(screen.getByRole('button', { name: 'Tutup navigasi' })).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(screen.getByRole('button', { name: 'Tutup navigasi' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Tutup navigasi dengan backdrop' }))
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Tutup navigasi' }))
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Tutup navigasi' }))
    await user.click(trigger)
    await user.click(screen.getByRole('link', { name: 'Projects' }))
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buka navigasi' })).toHaveAttribute('aria-expanded', 'false')

    await user.click(screen.getByRole('button', { name: 'Ciutkan sidebar' }))
    expect(screen.getByRole('button', { name: 'Perluas sidebar' })).toBeInTheDocument()
  })

  it('renders the not found page for unknown paths', () => {
    renderRoute('/unknown/path')

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })

  it('shows the error preview route in development', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: 'Pratinjau error aplikasi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unknown Error/ })).toBeInTheDocument()
  })

  it('loads the component showcase route in development', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/components'] })
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: 'Itungitungan UI Component Showcase' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Button', level: 3 })).toBeInTheDocument()
  })

  it('loads the interactive application shell preview in development', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/app-shell'] })
    render(<QueryProvider><RouterProvider router={router} /></QueryProvider>)
    expect(await screen.findByRole('heading', { name: 'Preview Responsive Navigation' })).toBeInTheDocument()
    expect(screen.getByText('Rina Anggraini')).toBeInTheDocument()
    expect(screen.getByText('rina@contoh.id')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
    await user.click(screen.getByRole('button', { name: 'Sidebar collapsed' }))
    expect(screen.getByRole('button', { name: 'Perluas sidebar' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Projects' }))
    expect(router.state.location.pathname).toBe('/app/projects')
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
  })

  it('loads the login preview route in development', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/login-preview'] })
    render(<QueryProvider><RouterProvider router={router} /></QueryProvider>)
    expect(await screen.findByRole('heading', { name: 'Preview Login Page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Default' })).toBeInTheDocument()
  })

  it('loads the register preview route in development', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/register-preview'] })
    render(<QueryProvider><RouterProvider router={router} /></QueryProvider>)
    expect(await screen.findByRole('heading', { name: 'Preview Register Page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Password Mismatch' })).toBeInTheDocument()
  })

  it('loads the logout preview route in development', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/logout-preview'] })
    render(<QueryProvider><RouterProvider router={router} /></QueryProvider>)
    expect(await screen.findByRole('heading', { name: 'Preview Logout' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Network error' })).toBeInTheDocument()
  })

  it('provides the responsive navigation preview route only in development', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/responsive-navigation'] })
    render(<QueryProvider><RouterProvider router={router} /></QueryProvider>)
    expect(await screen.findByRole('heading', { name: 'Preview Responsive Navigation' })).toBeInTheDocument()
  })

  it('switches between all preview errors without navigating or reloading', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { name: 'Pratinjau error aplikasi' })

    const examples = [
      ['Unauthorized', 'Sesi Anda telah berakhir'],
      ['Forbidden', 'Akses ditolak'],
      ['Not Found', 'Proyek tidak ditemukan'],
      ['Conflict', 'Draft penawaran sudah tersedia'],
      ['Validation Error', 'Periksa kembali isian Anda'],
      ['Internal Server Error', 'Terjadi kesalahan di server'],
      ['Network Error', 'Tidak dapat terhubung ke server'],
      ['Unknown Error', 'Terjadi kesalahan'],
    ] as const

    for (const [buttonName, heading] of examples) {
      await user.click(screen.getByRole('button', { name: new RegExp(buttonName) }))
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe('/dev/error-preview')
    }
  })

  it('does not register the error preview route in production', async () => {
    vi.stubEnv('DEV', false)
    vi.resetModules()
    const { appRoutes: productionRoutes } = await import('./router')

    expect(productionRoutes.some((route) => route.path === '/dev/error-preview')).toBe(false)
    expect(productionRoutes.some((route) => route.path === '/dev/login-preview')).toBe(false)
    expect(productionRoutes.some((route) => route.path === '/dev/register-preview')).toBe(false)
    expect(productionRoutes.some((route) => route.path === '/dev/logout-preview')).toBe(false)
    expect(productionRoutes.some((route) => route.path === '/dev/components')).toBe(false)
    expect(productionRoutes.some((route) => route.path === '/dev/app-shell')).toBe(false)
    expect(productionRoutes.some((route) => route.path === '/dev/responsive-navigation')).toBe(false)

    const router = createMemoryRouter(productionRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })

  it('runs a retry action from the preview without leaving the page', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)
    await screen.findByRole('heading', { name: 'Pratinjau error aplikasi' })
    await user.click(screen.getByRole('button', { name: /Internal Server Error/ }))
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(screen.getByText('Percobaan ulang: 1')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dev/error-preview')
  })
})
