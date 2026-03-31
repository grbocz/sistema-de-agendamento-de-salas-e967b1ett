import { Link, useLocation } from 'react-router-dom'
import { LogOut, CalendarDays, LayoutDashboard, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'

export function Header() {
  const { user, logout } = useAppStore()
  const location = useLocation()

  if (!user) return null

  const isMaster = user.role === 'master'

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      href: '/reservas',
      label: isMaster ? 'Lista de Reservas' : 'Minhas Reservas',
      icon: CalendarDays,
    },
    ...(isMaster ? [{ href: '/gerenciar-salas', label: 'Gerenciar Salas', icon: Settings }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </div>
          <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
            CurlingRooms
          </span>
        </div>

        <nav className="flex items-center space-x-1 sm:space-x-4">
          {links.map((link) => {
            const isActive = location.pathname === link.href
            return (
              <Link key={link.href} to={link.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn('gap-2', isActive && 'bg-secondary/50')}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden sm:inline-block">{link.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-sm font-medium leading-none">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <Button variant="outline" size="icon" onClick={logout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
