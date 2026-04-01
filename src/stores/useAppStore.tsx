import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User, Room, Reservation } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface AppStore {
  user: User | null
  login: (email: string) => void
  logout: () => Promise<void>
  rooms: Room[]
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>
  deleteRoom: (id: string) => Promise<void>
  reservations: Reservation[]
  addReservation: (res: Omit<Reservation, 'id'>) => Promise<{ success: boolean; error?: string }>
  deleteReservation: (id: string) => Promise<void>
  updateReservation: (id: string, data: any) => Promise<void>
}

const AppContext = createContext<AppStore | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const { toast } = useToast()

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) {
      setRooms(
        data.map((r: any) => ({
          id: r.id,
          name: r.name,
          capacity: r.capacity,
          description: r.description,
          color: r.color,
          imageUrl: r.image_url,
        })),
      )
    }
  }, [])

  const fetchReservations = useCallback(async () => {
    const { data } = await supabase.from('reservations').select('*, profiles(name)')
    if (data) {
      setReservations(
        data.map((r: any) => ({
          id: r.id,
          roomId: r.room_id,
          date: r.date,
          startTime: r.start_time,
          duration: r.duration_minutes,
          userId: r.user_id,
          userName: r.profiles?.name || 'Usuário',
          realUserName: r.user_name || r.solicitante || '',
          status: r.status || 'pendente',
        })),
      )
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchRooms()
      fetchReservations()

      const channel = supabase
        .channel('public:reservations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
          fetchReservations()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, fetchRooms, fetchReservations])

  const addRoom = async (room: Omit<Room, 'id'>) => {
    const { data, error } = await supabase
      .from('rooms')
      .insert({
        name: room.name,
        capacity: room.capacity,
        description: room.description,
        color: room.color,
        image_url: room.imageUrl,
      })
      .select()
      .single()

    if (data) {
      setRooms((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          capacity: data.capacity,
          description: data.description,
          color: data.color,
          imageUrl: data.image_url,
        },
      ])
    } else if (error) {
      toast({ title: 'Erro ao criar sala', description: error.message, variant: 'destructive' })
    }
  }

  const updateRoom = async (id: string, data: Partial<Room>) => {
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.capacity) updateData.capacity = data.capacity
    if (data.description) updateData.description = data.description
    if (data.color) updateData.color = data.color
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl

    const { error } = await supabase.from('rooms').update(updateData).eq('id', id)
    if (!error) {
      setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)))
    } else {
      toast({ title: 'Erro ao atualizar sala', description: error.message, variant: 'destructive' })
    }
  }

  const deleteRoom = async (id: string) => {
    const { error } = await supabase.from('rooms').delete().eq('id', id)
    if (!error) {
      setRooms((prev) => prev.filter((r) => r.id !== id))
    } else {
      toast({ title: 'Erro ao deletar sala', description: error.message, variant: 'destructive' })
    }
  }

  const addReservation = async (res: Omit<Reservation, 'id'>) => {
    const { data, error } = await supabase.functions.invoke('book-room', {
      body: {
        room_id: res.roomId,
        date: res.date,
        start_time: res.startTime,
        duration_minutes: res.duration,
        user_name: (res as any).user_name || (res as any).userName,
      },
    })

    if (error || data?.error) {
      return { success: false, error: data?.error || error?.message || 'Erro de conflito' }
    }

    if (data?.success && data?.data) {
      const r = data.data
      setReservations((prev) => [
        ...prev,
        {
          id: r.id,
          roomId: r.room_id,
          date: r.date,
          startTime: r.start_time,
          duration: r.duration_minutes,
          userId: r.user_id,
          userName: r.profiles?.name || user?.name || 'Você',
          realUserName: r.user_name || (res as any).user_name || (res as any).userName || '',
          status: r.status || 'pendente',
        },
      ])
      return { success: true }
    }
    return { success: false, error: 'Erro desconhecido' }
  }

  const updateReservation = async (id: string, data: any) => {
    const updateData: any = {}
    if (data.user_name || data.userName) updateData.user_name = data.user_name || data.userName
    if (data.date) updateData.date = data.date
    if (data.startTime) updateData.start_time = data.startTime
    if (data.duration) updateData.duration_minutes = data.duration
    if (data.status) updateData.status = data.status

    const { error } = await supabase.from('reservations').update(updateData).eq('id', id)
    if (!error) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...data,
                realUserName: data.user_name || data.userName || (r as any).realUserName,
              }
            : r,
        ),
      )
      toast({ title: 'Reserva atualizada', description: 'As alterações foram salvas.' })
    } else {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' })
    }
  }

  const deleteReservation = async (id: string) => {
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (!error) {
      setReservations((prev) => prev.filter((r) => r.id !== id))
    } else {
      toast({
        title: 'Erro ao cancelar reserva',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const login = () => {}
  const logout = async () => {
    await signOut()
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
    updateReservation,
  }

  return React.createElement(AppContext.Provider, { value: store }, children)
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within AppProvider')
  return context
}
