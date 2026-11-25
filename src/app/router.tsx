import { createBrowserRouter, type RouteObject } from 'react-router'
import ApplicationLayout from './ApplicationLayout'
import RoutePlaceholderPage, { NotFoundPage } from '../pages/RoutePlaceholderPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import { AuthGuard } from './AuthGuard'
import SettingsPage from '../pages/SettingsPage'
import FeaturesPage from '../pages/FeaturesPage'
import FeatureEditorPage from '../pages/FeatureEditorPage'
import DesignsPage from '../pages/DesignsPage'
import DesignEditorPage from '../pages/DesignEditorPage'
import HostingPage from '../pages/HostingPage'

export const appRoutes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/app',
    element: <AuthGuard />,
    children: [
      {
        element: <ApplicationLayout />,
        children: [
      { index: true, element: <RoutePlaceholderPage title="Dashboard" /> },
      { path: 'projects', element: <RoutePlaceholderPage title="Projects" /> },
      {
        path: 'projects/new',
        element: <RoutePlaceholderPage title="Create Project" />,
      },
      {
        path: 'projects/:projectId',
        element: <RoutePlaceholderPage title="Project Details" />,
      },
      { path: 'features', element: <FeaturesPage /> },
      {
        path: 'features/new',
        element: <FeatureEditorPage mode="create" />,
      },
      {
        path: 'features/:featureId',
        element: <FeatureEditorPage mode="edit" />,
      },
      { path: 'designs', element: <DesignsPage /> },
      {
        path: 'designs/new',
        element: <DesignEditorPage mode="create" />,
      },
      {
        path: 'designs/:designId',
        element: <DesignEditorPage mode="edit" />,
      },
      { path: 'hosting', element: <HostingPage /> },
      {
        path: 'hosting/new',
        element: <RoutePlaceholderPage title="Create Hosting Plan" />,
      },
      {
        path: 'hosting/:hostingId',
        element: <RoutePlaceholderPage title="Hosting Plan Details" />,
      },
      {
        path: 'maintenance',
        element: <RoutePlaceholderPage title="Maintenance" />,
      },
      {
        path: 'maintenance/new',
        element: <RoutePlaceholderPage title="Create Maintenance Plan" />,
      },
      {
        path: 'maintenance/:maintenanceId',
        element: <RoutePlaceholderPage title="Maintenance Plan Details" />,
      },
      {
        path: 'quotations',
        element: <RoutePlaceholderPage title="Quotations" />,
      },
      {
        path: 'quotations/:quotationId',
        element: <RoutePlaceholderPage title="Quotation Details" />,
      },
      { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]

if (import.meta.env.DEV) {
  appRoutes.push({ path: '/dev/login-preview', lazy: async () => { const module = await import('../pages/LoginPreviewPage'); return { Component: module.default } } })
  appRoutes.push({ path: '/dev/register-preview', lazy: async () => { const module = await import('../pages/RegisterPreviewPage'); return { Component: module.default } } })
  appRoutes.push({ path: '/dev/logout-preview', lazy: async () => { const module = await import('../pages/LogoutPreviewPage'); return { Component: module.default } } })
  appRoutes.push({ path: '/dev/error-preview', lazy: async () => { const module = await import('../pages/ErrorPreviewPage'); return { Component: module.default } } })
  appRoutes.push({ path: '/dev/components', lazy: async () => { const module = await import('../pages/ComponentShowcasePage'); return { Component: module.default } } })
  appRoutes.push({ path: '/dev/app-shell', lazy: async () => { const module = await import('../pages/AppShellPreviewPage'); return { Component: module.default } } })
  appRoutes.push({ path: '/dev/responsive-navigation', lazy: async () => { const module = await import('../pages/AppShellPreviewPage'); return { Component: module.default } } })
}

appRoutes.push(
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
)

export const appRouter = createBrowserRouter(appRoutes)
