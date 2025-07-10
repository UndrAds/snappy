import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { useAuth } from '@/hooks/useAuth'
import {
  Moon,
  Sun,
  Bell,
  User,
  Settings,
  LogOut,
  Plus,
  BarChart3,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardLayout() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/create')) return 'Create Snap'
    if (path.includes('/analytics')) return 'Analytics'
    if (path.includes('/settings')) return 'Settings'
    return 'Dashboard'
  }

  const menuItems = [
    {
      id: 'create',
      label: 'Create Snap',
      icon: Plus,
      path: '/create',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
    },
  ]

  const handleMenuClick = (path: string) => {
    navigate(path)
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            Please log in to access the dashboard
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex flex-col border-r bg-card transition-all duration-300`}
      >
        {/* Top Bar - App Logo */}
        <div className="border-b p-4">
          <div className="flex items-center justify-center">
            <h1
              className={`text-xl font-bold text-primary ${!sidebarOpen && 'hidden'}`}
            >
              Snappy
            </h1>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 space-y-2 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start transition-all duration-200 ${
                  !sidebarOpen && 'justify-center'
                } ${
                  isActive
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => handleMenuClick(item.path)}
              >
                <Icon className="h-4 w-4" />
                {sidebarOpen && <span className="ml-2">{item.label}</span>}
              </Button>
            )
          })}
        </div>

        {/* Bottom Bar - Settings */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className={`w-full justify-start transition-all duration-200 ${
              !sidebarOpen && 'justify-center'
            } ${
              location.pathname === '/settings'
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                : 'hover:bg-accent hover:text-accent-foreground'
            }`}
            onClick={() => handleMenuClick('/settings')}
          >
            <Settings className="h-4 w-4" />
            {sidebarOpen && <span className="ml-2">Settings</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Navbar */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Page Title */}
            <div>
              <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
            </div>

            {/* Right side - Theme toggle, notifications, profile */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-5 w-5" />
                    <span>{user.name || user.email}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleMenuClick('/profile')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
