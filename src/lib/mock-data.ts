import { Room, Reservation } from '@/types'

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

const IMAGE_QUERIES = [
  'modern meeting room',
  'boardroom',
  'conference room',
  'office workspace',
  'huddle room',
  'executive office',
  'training room',
  'minimalist office',
  'coworking space',
  'presentation room',
]

export const MOCK_ROOMS: Room[] = Array.from({ length: 10 }, (_, i) => ({
  id: `room-${i + 1}`,
  name: `Sala ${String(i + 1).padStart(2, '0')}`,
  capacity: [10, 15, 20, 30, 50][i % 5],
  description: `Sala de reunião equipada com TV, ar-condicionado e quadro branco.`,
  color: CHART_COLORS[i % 5],
  imageUrl: `https://img.usecurling.com/p/250/250?q=${encodeURIComponent(IMAGE_QUERIES[i])}&dpr=2`,
}))

const today = new Date()
const todayStr = today.toISOString().split('T')[0]

const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = tomorrow.toISOString().split('T')[0]

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    roomId: 'room-1',
    date: todayStr,
    startTime: '09:00',
    duration: 60,
    userId: 'generico@email.com',
    userName: 'Usuário Genérico',
  },
  {
    id: 'res-2',
    roomId: 'room-2',
    date: todayStr,
    startTime: '14:00',
    duration: 120,
    userId: 'master@email.com',
    userName: 'Administrador',
  },
  {
    id: 'res-3',
    roomId: 'room-3',
    date: tomorrowStr,
    startTime: '10:30',
    duration: 90,
    userId: 'generico@email.com',
    userName: 'Usuário Genérico',
  },
]
