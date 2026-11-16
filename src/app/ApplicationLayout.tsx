import { Outlet } from 'react-router'
import { AppShell } from '../components/app-shell/AppShell'

function ApplicationLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default ApplicationLayout
