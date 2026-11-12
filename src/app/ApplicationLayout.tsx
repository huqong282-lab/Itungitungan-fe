import { Link, Outlet } from 'react-router'

const applicationLinks = [
  { label: 'Dashboard', to: '/app' },
  { label: 'Projects', to: '/app/projects' },
  { label: 'Features', to: '/app/features' },
  { label: 'Designs', to: '/app/designs' },
  { label: 'Hosting', to: '/app/hosting' },
  { label: 'Maintenance', to: '/app/maintenance' },
  { label: 'Quotations', to: '/app/quotations' },
  { label: 'Settings', to: '/app/settings' },
]

function ApplicationLayout() {
  return (
    <>
      <header>
        <Link to="/app">Itungitungan</Link>
      </header>
      <nav aria-label="Application navigation">
        {applicationLinks.map(({ label, to }) => (
          <Link key={to} to={to}>
            {label}
          </Link>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default ApplicationLayout
