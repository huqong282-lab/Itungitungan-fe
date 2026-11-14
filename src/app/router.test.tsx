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

  it('renders the not found page for unknown paths', () => {
    renderRoute('/unknown/path')

    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })

  it('shows the error preview route in development', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByRole('heading', { name: 'Permintaan tidak valid' })).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Pratinjau error aplikasi' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Unknown Error/ })).toBeInTheDocument()
  })

  it('switches between all preview errors without navigating or reloading', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)

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

    const router = createMemoryRouter(productionRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)
    expect(screen.getByRole('heading', { name: 'Page Not Found' })).toBeInTheDocument()
  })

  it('runs a retry action from the preview without leaving the page', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/dev/error-preview'] })
    render(<RouterProvider router={router} />)
    await user.click(screen.getByRole('button', { name: /Internal Server Error/ }))
    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))

    expect(screen.getByText('Percobaan ulang: 1')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/dev/error-preview')
  })
})
