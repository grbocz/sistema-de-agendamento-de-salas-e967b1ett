export type UserRole = 'generic' | 'master'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

export interface Room {
  id: string
  name: string
  capacity: number
  description: string
  color: string
  imageUrl?: string
}

export interface Reservation {
  id: string
  roomId: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  duration: number // minutes
  userId: string
  userName: string
}
