import React, { createContext, useContext, useState } from 'react'
import { User, Room, Reservation } from '@/types'
import { MOCK_ROOMS, MOCK_RESERVATIONS } from '@/lib/mock-data'
import { isConflict } from '@/lib/date-utils'

interface AppStore {
  user: User | null
  login: (email: string) => void
  logout: () => void
  rooms: Room[]
  addRoom: (room: Omit<Room, 'id'>) => void
  updateRoom: (id: string, room: Partial<Room>) => void
  deleteRoom: (id: string) => void
  reservations: Reservation[]
  addReservation: (res: Omit<Reservation, 'id'>) => { success: boolean; error?: string }
  deleteReservation: (id: string) => void
}

const AppContext = createContext<AppStore | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS)
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS)

  const login = (email: string) => {
    const role = email.toLowerCase().includes('master') ? 'master' : 'generic'
    setUser({ id: `usr-${Date.now()}`, email, name: role === 'master' ? 'Admin' : 'Usuário', role })
  }

  const logout = () => setUser(null)

  const addRoom = (room: Omit<Room, 'id'>) => {
    setRooms((prev) => [...prev, { ...room, id: `room-${Date.now()}` }])
  }

  const updateRoom = (id: string, data: Partial<Room>) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)))
  }

  const deleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id))
    setReservations((prev) => prev.filter((r) => r.roomId !== id))
  }

  const addReservation = (res: Omit<Reservation, 'id'>) => {
    if (isConflict(res.date, res.startTime, res.duration, res.roomId, reservations)) {
      return { success: false, error: 'Horário já ocupado nesta sala.' }
    }
    setReservations((prev) => [...prev, { ...res, id: `res-${Date.now()}` }])
    return { success: true }
  }

  const deleteReservation = (id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id))
  }

  const store: AppStore = {
    user,
    login,
    logout,
    rooms,
    addRoom,
    updateRoom,
    deleteRoom,
    reservations,
    addReservation,
    deleteReservation,
  }

  return React.createElement(AppContext.Provider, { value: store }, children)
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within AppProvider')
  return context
}
