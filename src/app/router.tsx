import { createBrowserRouter, type RouteObject } from 'react-router'
import ApplicationLayout from './ApplicationLayout'
import RoutePlaceholderPage, { NotFoundPage } from '../pages/RoutePlaceholderPage'
import ErrorPreviewPage from '../pages/ErrorPreviewPage'

export const appRoutes: RouteObject[] = [
  { path: '/login', element: <RoutePlaceholderPage title="Login" /> },
  { path: '/register', element: <RoutePlaceholderPage title="Register" /> },
  {
    path: '/app',
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
      { path: 'features', element: <RoutePlaceholderPage title="Features" /> },
      {
        path: 'features/new',
        element: <RoutePlaceholderPage title="Create Feature" />,
      },
      {
        path: 'features/:featureId',
        element: <RoutePlaceholderPage title="Feature Details" />,
      },
      { path: 'designs', element: <RoutePlaceholderPage title="Designs" /> },
      {
        path: 'designs/new',
        element: <RoutePlaceholderPage title="Create Design" />,
      },
      {
        path: 'designs/:designId',
        element: <RoutePlaceholderPage title="Design Details" />,
      },
      { path: 'hosting', element: <RoutePlaceholderPage title="Hosting" /> },
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
      { path: 'settings', element: <RoutePlaceholderPage title="Settings" /> },
    ],
  },
]

if (import.meta.env.DEV) {
  appRoutes.push({ path: '/dev/error-preview', element: <ErrorPreviewPage /> })
}

appRoutes.push(
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
)

export const appRouter = createBrowserRouter(appRoutes)
