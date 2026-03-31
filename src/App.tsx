import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'

import Index from './pages/Index'
import Dashboard from './pages/Dashboard'
import Reservations from './pages/Reservations'
import Rooms from './pages/Rooms'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <AppProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public / Login route */}
          <Route path="/" element={<Index />} />

          {/* Protected routes wrapped in Layout */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reservas" element={<Reservations />} />
            <Route path="/gerenciar-salas" element={<Rooms />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AppProvider>
)

export default App
