import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { appRoutes } from './router'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
})

const routes = [
  ['/login', 'Login'],
  ['/register', 'Register'],
  ['/app', 'Dashboard'],
  ['/app/projects', 'Projects'],
  ['/app/projects/new', 'Create Project'],
  ['/app/projects/project-123', 'Project Details'],
  ['/app/features', 'Features'],
  ['/app/features/new', 'Create Feature'],
  ['/app/features/feature-123', 'Feature Details'],
  ['/app/designs', 'Designs'],
  ['/app/designs/new', 'Create Design'],
  ['/app/designs/design-123', 'Design Details'],
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
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('application routes', () => {
  it.each(routes)('opens %s', (path, title) => {
    renderRoute(path)

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
  })

  it.each([
    ['/app/projects/project-123', 'project-123'],
    ['/app/features/feature-123', 'feature-123'],
    ['/app/designs/design-123', 'design-123'],
    ['/app/hosting/hosting-123', 'hosting-123'],
    ['/app/maintenance/maintenance-123', 'maintenance-123'],
    ['/app/quotations/quotation-123', 'quotation-123'],
  ])('reads the route parameter for %s', (path, id) => {
    renderRoute(path)

    expect(screen.getByText(id)).toBeInTheDocument()
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

  it('opens and closes the mobile navigation and supports sidebar collapse', async () => {
    const user = userEvent.setup()
    renderRoute('/app')
    await user.click(screen.getByRole('button', { name: 'Buka navigasi' }))
    expect(screen.getByRole('button', { name: 'Tutup navigasi' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tutup navigasi' }))
    expect(screen.queryByRole('button', { name: 'Tutup navigasi' })).not.toBeInTheDocument()

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
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: 'Preview App Shell' })).toBeInTheDocument()
    expect(screen.getByText('Rina Anggraini')).toBeInTheDocument()
    expect(screen.getByText('rina@contoh.id')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sidebar collapsed' }))
    expect(screen.getByRole('button', { name: 'Perluas sidebar' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Projects' }))
    expect(router.state.location.pathname).toBe('/app/projects')
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('aria-current', 'page')
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
    expect(productionRoutes.some((route) => route.path === '/dev/components')).toBe(false)
    expect(productionRoutes.some((route) => route.path === '/dev/app-shell')).toBe(false)

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
