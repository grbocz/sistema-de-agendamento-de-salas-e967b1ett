import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'

import { lazy, Suspense } from 'react'
import Layout from './components/Layout'

const Index = lazy(() => import('./pages/Index'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Reservations = lazy(() => import('./pages/Reservations'))
const Rooms = lazy(() => import('./pages/Rooms'))
const PendingReservations = lazy(() => import('./pages/PendingReservations'))
const NotFound = lazy(() => import('./pages/NotFound'))

const PageLoader = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const LayoutWrapper = () => (
  <ProtectedRoute>
    <Layout />
  </ProtectedRoute>
)

const App = () => (
  <AuthProvider>
    <AppProvider>
      <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Index />
                </Suspense>
              }
            />

            <Route element={<LayoutWrapper />}>
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="/reservas"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Reservations />
                  </Suspense>
                }
              />
              <Route
                path="/gerenciar-salas"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Rooms />
                  </Suspense>
                }
              />
              <Route
                path="/reservas-pendentes"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PendingReservations />
                  </Suspense>
                }
              />
            </Route>

            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              }
            />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
