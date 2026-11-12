import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { appRoutes } from './router'

afterEach(cleanup)

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
})
