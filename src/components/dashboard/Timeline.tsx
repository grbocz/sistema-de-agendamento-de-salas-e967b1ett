import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { Reservation, Room } from '@/types'
import { timeToMins, minsToTime } from '@/lib/date-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TimelineProps {
  date: Date
  reservations: Reservation[]
  rooms: Room[]
  selectedRoomId?: string | null
}

const START_HOUR = 7
const END_HOUR = 21
const PIXELS_PER_HOUR = 44

export function Timeline({ date, reservations, rooms, selectedRoomId }: TimelineProps) {
  const dateStr = format(date, 'yyyy-MM-dd')

  const todaysReservations = useMemo(() => {
    let filtered = reservations.filter((r) => r.date === dateStr && r.status !== 'reprovada')
    if (selectedRoomId) {
      filtered = filtered.filter((r) => r.roomId === selectedRoomId)
    }
    return filtered
  }, [reservations, dateStr, selectedRoomId])

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId],
  )

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR)

  return (
    <Card className="h-full flex flex-col shadow-subtle">
      <CardHeader className="py-4 px-6 border-b bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Agenda: {format(date, 'dd-MMMM-yyyy', { locale: ptBR })}
          </CardTitle>
        </div>
        {selectedRoom && (
          <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold text-sm border border-primary/20 shadow-sm animate-fade-in text-center truncate max-w-full">
            {selectedRoom.name}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <div className="h-[600px] overflow-y-auto relative bg-slate-50/50">
          {/* Background Grid */}
          {hours.map((h) => (
            <div key={h} className="flex h-[44px] border-b border-border/50">
              <div className="w-16 text-xs text-muted-foreground p-1.5 border-r border-border/50 text-right bg-white select-none">
                {h.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1 bg-white" />
            </div>
          ))}

          {/* Events Overlay */}
          <div className="absolute top-0 left-16 right-0 bottom-0 pointer-events-none p-1">
            {todaysReservations.map((res) => {
              const startMins = timeToMins(res.startTime)
              const top = (startMins - START_HOUR * 60) * (PIXELS_PER_HOUR / 60)
              const height = res.duration * (PIXELS_PER_HOUR / 60)
              const room = rooms.find((r) => r.id === res.roomId)
              const endTime = minsToTime(startMins + res.duration)

              const isPending = res.status === 'pendente'

              const userName = (res as any).realUserName || (res as any).user_name || res.userName

              return (
                <div
                  key={res.id}
                  className={cn(
                    'absolute left-2 right-2 rounded-md border px-3 text-xs text-white overflow-hidden pointer-events-auto shadow-sm transition-all hover:scale-[1.01] hover:shadow-md hover:z-10 group flex flex-row items-start justify-start pt-1',
                    isPending && 'opacity-50 border-dashed border-2',
                  )}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: room?.color || 'hsl(var(--primary))',
                    borderColor: isPending ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  <div className="flex items-center gap-1.5 w-full opacity-90 group-hover:opacity-100 leading-none overflow-hidden mt-0.5">
                    <span className="font-bold whitespace-nowrap">
                      {res.startTime} - {endTime}
                    </span>
                    <span className="opacity-75 shrink-0">|</span>
                    <span className="font-medium truncate flex-1">{userName}</span>
                    {room?.name && (
                      <span className="truncate shrink-0 max-w-[30%] text-right font-bold ml-1">
                        {room.name}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            {todaysReservations.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
                Nenhuma reserva para este dia.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
