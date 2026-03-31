import { Reservation } from '@/types'

export const timeToMins = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

export const minsToTime = (mins: number): string => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export const generateTimeOptions = (): string[] => {
  const options = []
  for (let i = 7 * 60; i <= 21 * 60; i += 30) {
    options.push(minsToTime(i))
  }
  return options
}

export const isConflict = (
  date: string,
  startTime: string,
  duration: number,
  roomId: string,
  reservations: Reservation[],
  ignoreResId?: string,
): boolean => {
  const start1 = timeToMins(startTime)
  const end1 = start1 + duration

  return reservations.some((r) => {
    if (r.id === ignoreResId) return false
    if (r.roomId !== roomId || r.date !== date) return false

    const start2 = timeToMins(r.startTime)
    const end2 = start2 + r.duration

    // Check overlap: Event 1 starts before Event 2 ends AND Event 2 starts before Event 1 ends
    return start1 < end2 && start2 < end1
  })
}
