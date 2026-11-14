import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from './auth'
import { designsApi } from './designs'
import { featuresApi } from './features'
import { hostingApi } from './hosting'
import { maintenanceApi } from './maintenance'
import { projectsApi } from './projects'
import { quotationsApi } from './quotations'

afterEach(() => vi.unstubAllGlobals())

function captureRequests() {
  const requests: Array<{ url: string; method: string | undefined }> = []
  vi.stubGlobal('fetch', vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    requests.push({ url: String(input), method: init?.method })
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }))
  return requests
}

describe('domain APIs', () => {
  it('routes authentication requests through the client using backend auth endpoints', async () => {
    const requests = captureRequests()
    await authApi.login({ email: 'dev@example.test', password: 'password' })
    await authApi.getCurrentUser()
    await authApi.logout()

    expect(requests).toEqual([
      { url: 'http://localhost:3000/api/auth/login', method: 'POST' },
      { url: 'http://localhost:3000/api/auth/me', method: 'GET' },
      { url: 'http://localhost:3000/api/auth/logout', method: 'POST' },
    ])
  })

  it('routes feature list, status, and option requests to contract paths', async () => {
    const requests = captureRequests()
    await featuresApi.list({ category: 'Payments' })
    await featuresApi.setActive('feature-1', false)
    await featuresApi.createOption('feature-1', { name: 'Tier', selectionType: 'SINGLE' })

    expect(requests.map(({ url, method }) => [url, method])).toEqual([
      ['http://localhost:3000/api/features?category=Payments', 'GET'],
      ['http://localhost:3000/api/features/feature-1/status', 'PATCH'],
      ['http://localhost:3000/api/features/feature-1/options', 'POST'],
    ])
  })

  it('routes design catalog operations to the backend design endpoints', async () => {
    const requests = captureRequests()
    await designsApi.get('design/1')
    await designsApi.create({ name: 'Brand', price: 100 })

    expect(requests.map(({ url, method }) => [url, method])).toEqual([
      ['http://localhost:3000/api/designs/design%2F1', 'GET'],
      ['http://localhost:3000/api/designs', 'POST'],
    ])
  })

  it('routes hosting and maintenance plan operations using their distinct route prefixes', async () => {
    const requests = captureRequests()
    await hostingApi.list({ page: 2 })
    await maintenanceApi.setActive('maintenance-1', true)

    expect(requests.map(({ url, method }) => [url, method])).toEqual([
      ['http://localhost:3000/api/hosting-plans?page=2', 'GET'],
      ['http://localhost:3000/api/maintenance-plans/maintenance-1/status', 'PATCH'],
    ])
  })

  it('routes project CRUD, nested relations, and calculation requests to the project API', async () => {
    const requests = captureRequests()
    await projectsApi.create({ clientName: 'Client', projectName: 'Website' })
    await projectsApi.replaceFeatureSelections('project-1', 'project-feature-1', [])
    await projectsApi.calculate('project-1')

    expect(requests.map(({ url, method }) => [url, method])).toEqual([
      ['http://localhost:3000/api/projects', 'POST'],
      ['http://localhost:3000/api/projects/project-1/features/project-feature-1/selections', 'PUT'],
      ['http://localhost:3000/api/projects/project-1/calculate', 'POST'],
    ])
  })

  it('routes quotation list, project draft creation, and PDF download to backend endpoints', async () => {
    const requests = captureRequests()
    await quotationsApi.list({ status: 'DRAFT', sort: 'createdAt', order: 'desc' })
    await quotationsApi.createDraft('project-1')
    await quotationsApi.downloadPdf('quotation-1')

    expect(requests.map(({ url, method }) => [url, method])).toEqual([
      ['http://localhost:3000/api/quotations?status=DRAFT&sort=createdAt&order=desc', 'GET'],
      ['http://localhost:3000/api/projects/project-1/quotations', 'POST'],
      ['http://localhost:3000/api/quotations/quotation-1/pdf', 'GET'],
    ])
  })
})
