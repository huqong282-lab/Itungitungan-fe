import {
  Blocks,
  FileText,
  Folder,
  LayoutDashboard,
  Palette,
  Server,
  Settings,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export type AppNavigationItem = {
  label: string
  to: string
  icon: LucideIcon
}

export const appNavigation: AppNavigationItem[] = [
  { label: 'Dashboard', to: '/app', icon: LayoutDashboard },
  { label: 'Projects', to: '/app/projects', icon: Folder },
  { label: 'Features', to: '/app/features', icon: Blocks },
  { label: 'Designs', to: '/app/designs', icon: Palette },
  { label: 'Hosting', to: '/app/hosting', icon: Server },
  { label: 'Maintenance', to: '/app/maintenance', icon: Wrench },
  { label: 'Quotations', to: '/app/quotations', icon: FileText },
  { label: 'Settings', to: '/app/settings', icon: Settings },
]
