import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/Header'
import useAppStore from '@/stores/useAppStore'

export default function Layout() {
  const { user } = useAppStore()
  const location = useLocation()

  if (!user && location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Header />
      <main className="flex-1 container py-8">
        <div className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
